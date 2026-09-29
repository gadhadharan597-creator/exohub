import os
import sys
import json
import pandas as pd
import numpy as np
import streamlit as st
import matplotlib.pyplot as plt
import seaborn as sns

# Ensure current working directory is in python path for backend imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from backend.app.services.candidate_service import CandidateService
from backend.app.services.gemini_service import GeminiService
from backend.app.services.orbit_service import orbit_service

st.set_page_config(
    page_title="Exoplanet Habitability Explorer & AI Assistant",
    page_icon="🪐",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern dark space theme styling
st.markdown("""
<style>
    .main {
        background-color: #0b0f19;
        color: #e2e8f0;
    }
    .stMetric {
        background-color: #1e293b;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #334155;
    }
    .stMetric label {
        color: #94a3b8 !important;
        font-weight: 600;
    }
    .stMetric [data-testid="stMetricValue"] {
        color: #38bdf8 !important;
        font-weight: 700;
    }
    h1, h2, h3 {
        color: #f8fafc;
        font-family: 'Inter', sans-serif;
    }
    .highlight-card {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #6366f1;
        margin-bottom: 20px;
    }
    .badge-online {
        background-color: #065f46;
        color: #34d399;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .badge-offline {
        background-color: #78350f;
        color: #fbbf24;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Services with Caching
@st.cache_resource
def load_candidate_service():
    data_path = 'exoplanet_habitability_rankings.csv' if os.path.exists('exoplanet_habitability_rankings.csv') else 'data/ranked_candidates.csv'
    model_path = 'models/habitability_model.joblib'
    return CandidateService(data_path=data_path, model_path=model_path)

@st.cache_resource
def load_gemini_service():
    return GeminiService()

candidate_svc = load_candidate_service()
gemini_svc = load_gemini_service()

# Sidebar Navigation
st.sidebar.title("🪐 Exohub Navigation")
module = st.sidebar.radio(
    "Select Module",
    options=[
        "🪐 Habitability Rankings Explorer",
        "🌌 Multi-Planet Orbit Visualizer",
        "🤖 ExoBot AI Assistant",
        "🔎 Candidate Inspector & Predictor",
        "📊 Scientific Analytics & Insights"
    ],
    index=0
)

st.sidebar.markdown("---")
# Service Status Badge
if gemini_svc.is_available:
    st.sidebar.markdown('<span class="badge-online">🟢 Gemini 3.8 Flash Online</span>', unsafe_allow_html=True)
else:
    st.sidebar.markdown('<span class="badge-offline">🟡 Local AI Fallback Mode</span>', unsafe_allow_html=True)

st.sidebar.markdown(" ")
st.sidebar.caption("Data Sources: NASA Exoplanet Archive TAP Service & ExoMiner++ TESS Vetting Catalog.")

# =============================================================================
# MODULE 1: HABITABILITY RANKINGS EXPLORER
# =============================================================================
if module == "🪐 Habitability Rankings Explorer":
    st.title("🪐 Advanced Exoplanet Habitability Ranking System")
    st.markdown("""
    An interactive multi-stage ranking framework combining **NASA Exoplanet Archive** parameters with **NASA ExoMiner++** planet validation probabilities and **Kopparapu et al. Habitable Zone models**.
    """)
    st.markdown("---")

    df = candidate_svc.df if candidate_svc.df is not None else pd.DataFrame()

    if not df.empty:
        st.sidebar.header("🔍 Filter Parameters")

        min_composite = st.sidebar.slider(
            "Minimum Composite Habitability Score",
            min_value=0.0,
            max_value=1.0,
            value=0.50,
            step=0.05
        )

        min_exominer = st.sidebar.slider(
            "Minimum Real Planet Probability (P_real)",
            min_value=0.0,
            max_value=1.0,
            value=0.70,
            step=0.05
        )

        stellar_types = sorted(df['stellar_type'].dropna().unique().tolist())
        selected_stellar = st.sidebar.multiselect(
            "Select Host Star Spectral Types",
            options=stellar_types,
            default=stellar_types
        )

        rocky_only = st.sidebar.checkbox("Show Rocky Planets Only (R ≤ 1.6 R⊕)", value=False)
        hz_only = st.sidebar.checkbox("Show Conservative Habitable Zone Planets Only", value=False)

        search_text = st.text_input("🔍 Search Planet Name or Host Star:", placeholder="e.g. K2-72, TOI-700, Kepler-1649...")

        filtered_df = df[
            (df['composite_habitability_score'] >= min_composite) &
            (df['P_real_planet'] >= min_exominer) &
            (df['stellar_type'].isin(selected_stellar))
        ].copy()

        if rocky_only:
            filtered_df = filtered_df[filtered_df['is_rocky'] == 1]

        if hz_only:
            filtered_df = filtered_df[filtered_df['P_HZ'] == 1]

        if search_text.strip():
            q = search_text.strip().lower()
            filtered_df = filtered_df[
                filtered_df['pl_name'].fillna('').str.lower().str.contains(q) |
                filtered_df['hostname'].fillna('').str.lower().str.contains(q)
            ]

        # Metrics Overview
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Catalog Candidates", f"{len(df):,}")
        with col2:
            st.metric("Filtered Candidates", f"{len(filtered_df):,}")
        with col3:
            high_cand = (df['composite_habitability_score'] >= 0.85).sum()
            st.metric("Top Tier Candidates (Score ≥ 0.85)", f"{high_cand}")
        with col4:
            rocky_count = (filtered_df['is_rocky'] == 1).sum() if 'is_rocky' in filtered_df.columns else 0
            st.metric("Filtered Rocky Planets", f"{rocky_count}")

        st.markdown("### 🏆 Ranked Potentially Habitable Candidates")
        st.write(f"Showing **{len(filtered_df)}** exoplanet candidates meeting active filter criteria.")

        display_cols = [
            'pl_name', 'hostname', 'stellar_type', 'pl_rade', 'eq_temp_k',
            'pl_insol', 'earth_similarity_index', 'P_real_planet', 'P_HZ',
            'physics_habitability_score', 'ml_habitability_score', 'composite_habitability_score'
        ]

        display_cols = [c for c in display_cols if c in filtered_df.columns]

        renamed_cols = {
            'pl_name': 'Planet Name',
            'hostname': 'Host Star',
            'stellar_type': 'Star Type',
            'pl_rade': 'Radius (R⊕)',
            'eq_temp_k': 'T_eq (K)',
            'pl_insol': 'Insolation (S⊕)',
            'earth_similarity_index': 'Proxy ESI',
            'P_real_planet': 'P(Real Planet)',
            'P_HZ': 'In HZ',
            'physics_habitability_score': 'Physics Score',
            'ml_habitability_score': 'ML Score',
            'composite_habitability_score': 'Composite Score'
        }

        display_df = filtered_df[display_cols].rename(columns=renamed_cols)

        format_dict = {
            'Radius (R⊕)': '{:.2f}',
            'T_eq (K)': '{:.1f}',
            'Insolation (S⊕)': '{:.2f}',
            'Proxy ESI': '{:.3f}',
            'P(Real Planet)': '{:.3f}',
            'Physics Score': '{:.3f}',
            'ML Score': '{:.3f}',
            'Composite Score': '{:.3f}'
        }

        for col, fmt in format_dict.items():
            if col in display_df.columns:
                display_df[col] = display_df[col].apply(lambda x: fmt.format(x) if pd.notnull(x) else 'N/A')

        st.dataframe(display_df)

        csv_data = filtered_df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Download Filtered Rankings CSV",
            data=csv_data,
            file_name="filtered_exoplanet_rankings.csv",
            mime="text/csv"
        )

        st.markdown("---")
        st.subheader("📊 Habitability Distribution & Scientific Insights")

        chart_col1, chart_col2 = st.columns(2)

        with chart_col1:
            st.markdown("#### Score Distribution")
            fig, ax = plt.subplots(figsize=(6, 4))
            sns.set_style("darkgrid")
            plt.rcParams.update({'text.color': 'white', 'axes.labelcolor': 'white', 'xtick.color': 'white', 'ytick.color': 'white', 'figure.facecolor': '#0b0f19', 'axes.facecolor': '#1e293b'})
            sns.histplot(filtered_df['composite_habitability_score'], kde=True, color='#38bdf8', ax=ax, bins=20)
            ax.set_title("Distribution of Composite Habitability Scores", color='white')
            ax.set_xlabel("Composite Habitability Score", color='white')
            ax.set_ylabel("Count", color='white')
            st.pyplot(fig)

        with chart_col2:
            st.markdown("#### Radius vs Insolation (Habitable Zone)")
            fig2, ax2 = plt.subplots(figsize=(6, 4))
            plt.rcParams.update({'text.color': 'white', 'axes.labelcolor': 'white', 'xtick.color': 'white', 'ytick.color': 'white', 'figure.facecolor': '#0b0f19', 'axes.facecolor': '#1e293b'})
            scatter = ax2.scatter(
                filtered_df['pl_insol'],
                filtered_df['pl_rade'],
                c=filtered_df['composite_habitability_score'],
                cmap='viridis',
                alpha=0.8,
                edgecolors='w',
                linewidth=0.5
            )
            ax2.set_xscale('log')
            ax2.set_title("Planet Radius vs. Insolation Flux", color='white')
            ax2.set_xlabel("Insolation (Earth Flux Units, Log Scale)", color='white')
            ax2.set_ylabel("Radius (Earth Radii)", color='white')
            ax2.axhline(1.6, color='#f43f5e', linestyle='--', label='Rocky Threshold (1.6 R⊕)')
            ax2.legend()
            cbar = plt.colorbar(scatter, ax=ax2)
            cbar.set_label("Composite Score", color='white')
            cbar.ax.yaxis.set_tick_params(color='white')
            plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='white')
            st.pyplot(fig2)

    else:
        st.warning("No data loaded. Please run exoplanet_pipeline.py to generate rankings.")

# =============================================================================
# MODULE 2: EXOBOT AI ASSISTANT
# =============================================================================
elif module == "🤖 ExoBot AI Assistant":
    st.title("🤖 ExoBot — AI Exoplanet Assistant")
    st.markdown("""
    Ask questions about exoplanet candidates, transit signal vetting, Habitable Zone physics, or ask ExoBot to lookup specific target stars.
    """)
    st.markdown("---")

    # Initialize chat history in session state
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": "Hello! I am **ExoBot**, your specialized Exoplanet Science & Habitability Assistant.\n\n"
                           "You can ask me to rank top candidates (e.g. *'What are the top 5 habitable exoplanets?'*), "
                           "query specific planets (*'Tell me about K2-72 e'* or *'TOI-700 d'*), or ask about ExoMiner vetting and Kopparapu HZ models!"
            }
        ]

    # Quick prompt buttons
    st.markdown("##### 💡 Suggested Quick Queries:")
    qp_col1, qp_col2, qp_col3, qp_col4 = st.columns(4)

    prompt_to_submit = None
    with qp_col1:
        if st.button("🏆 Top 5 Habitable Candidates"):
            prompt_to_submit = "What are the top 5 habitable exoplanet candidates in the catalog?"
    with qp_col2:
        if st.button("🪐 Tell me about K2-72 e"):
            prompt_to_submit = "Tell me detailed parameters and habitability info about K2-72 e"
    with qp_col3:
        if st.button("🔬 What is ExoMiner?"):
            prompt_to_submit = "What is ExoMiner and how does it calculate real planet probabilities?"
    with qp_col4:
        if st.button("☀️ Explain Kopparapu HZ"):
            prompt_to_submit = "Explain the Kopparapu Habitable Zone model and inner/outer flux boundaries."

    # Render Chat History
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if "tools_used" in msg and msg["tools_used"]:
                st.caption(f"🔧 **Tools Executed:** `{', '.join(msg['tools_used'])}`")
            if "source_table" in msg and msg["source_table"]:
                with st.expander("📊 Retrieved Catalog Data"):
                    st.dataframe(pd.DataFrame(msg["source_table"]))
            if "citations" in msg and msg["citations"]:
                st.markdown("**Web Grounding Sources:**")
                for cite in msg["citations"]:
                    st.markdown(f"- [{cite.get('title', 'Link')}]({cite.get('uri', '#')})")

    # Handle Chat Input
    user_input = st.chat_input("Ask ExoBot a question...")
    if prompt_to_submit:
        user_input = prompt_to_submit

    if user_input:
        # Append User Message
        st.session_state.messages.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.markdown(user_input)

        # Generate Assistant Response
        with st.chat_message("assistant"):
            with st.spinner("ExoBot is analyzing catalog data & scientific literature..."):
                response_data = gemini_svc.chat_with_tools(st.session_state.messages, candidate_svc)

                answer = response_data.get("answer", "No response generated.")
                tools_used = response_data.get("tools_used", [])
                source_table = response_data.get("source_table", None)
                citations = response_data.get("citations", [])

                st.markdown(answer)
                if tools_used:
                    st.caption(f"🔧 **Tools Executed:** `{', '.join(tools_used)}`")
                if source_table:
                    with st.expander("📊 Retrieved Catalog Data"):
                        st.dataframe(pd.DataFrame(source_table))
                if citations:
                    st.markdown("**Web Grounding Sources:**")
                    for cite in citations:
                        st.markdown(f"- [{cite.get('title', 'Link')}]({cite.get('uri', '#')})")

                # Store assistant response in history
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": answer,
                    "tools_used": tools_used,
                    "source_table": source_table,
                    "citations": citations
                })

# =============================================================================
# MODULE 3: CANDIDATE INSPECTOR & CUSTOM PREDICTOR
# =============================================================================
elif module == "🔎 Candidate Inspector & Predictor":
    st.title("🔎 Candidate Inspector & Custom Predictor")
    st.markdown("Inspect catalog exoplanet candidates or calculate habitability for custom planetary parameters.")
    st.markdown("---")

    sub_tab1, sub_tab2 = st.tabs(["📋 Catalog Candidate Inspector", "🧮 Custom Candidate Predictor"])

    df = candidate_svc.df if candidate_svc.df is not None else pd.DataFrame()

    with sub_tab1:
        if not df.empty:
            planet_names = sorted(df['pl_name'].dropna().unique().tolist())
            default_index = planet_names.index("K2-72 e") if "K2-72 e" in planet_names else 0
            selected_planet = st.selectbox("Select Exoplanet Candidate:", options=planet_names, index=default_index)

            cand = candidate_svc.get_candidate_by_id_or_name(selected_planet)

            if cand:
                st.markdown(f"### 🪐 {cand['pl_name']} Overview")

                c1, c2, c3, c4 = st.columns(4)
                with c1:
                    st.metric("Host Star", f"{cand.get('hostname', 'N/A')} ({cand.get('stellar_type', 'N/A')})")
                    st.metric("Planet Radius", f"{cand.get('pl_rade', 0.0):.2f} R⊕")
                with c2:
                    st.metric("Equilibrium Temp (T_eq)", f"{cand.get('eq_temp_k', 0.0):.1f} K")
                    st.metric("Insolation Flux", f"{cand.get('pl_insol', 0.0):.2f} S⊕")
                with c3:
                    st.metric("Proxy ESI", f"{cand.get('earth_similarity_index', 0.0):.3f}")
                    st.metric("ExoMiner P(Real)", f"{cand.get('P_real_planet', 0.0):.3f}")
                with c4:
                    st.metric("Physics Score", f"{cand.get('physics_habitability_score', 0.0):.3f}")
                    st.metric("Composite Score", f"{cand.get('composite_habitability_score', 0.0):.3f}")

                st.markdown("---")
                st.subheader("🌐 Gemini Search Grounding Scientific Overview")
                with st.spinner(f"Fetching search grounding data for {selected_planet}..."):
                    grounding_res = gemini_svc.search_grounding_summary(selected_planet)
                    st.write(grounding_res.get("summary", "No summary available."))
                    if grounding_res.get("citations"):
                        st.markdown("**Citations & Sources:**")
                        for cite in grounding_res["citations"]:
                            st.markdown(f"- [{cite['title']}]({cite['uri']})")
        else:
            st.warning("Catalog dataset not loaded.")

    with sub_tab2:
        st.subheader("🧮 Custom Candidate Habitability Calculator")
        st.markdown("Enter custom orbital, planetary, and stellar parameters to run the habitability pipeline live.")

        col_in1, col_in2, col_in3 = st.columns(3)

        with col_in1:
            custom_name = st.text_input("Planet Candidate Name", value="Kepler-Custom-1b")
            custom_radius = st.number_input("Planet Radius (Earth Radii R⊕)", min_value=0.1, max_value=20.0, value=1.15, step=0.05)
            custom_period = st.number_input("Orbital Period (Days)", min_value=0.1, max_value=2000.0, value=24.2, step=0.5)

        with col_in2:
            custom_insol = st.number_input("Insolation Flux (Earth Flux S⊕)", min_value=0.01, max_value=100.0, value=1.10, step=0.05)
            custom_teff = st.number_input("Stellar Effective Temp (T_eff K)", min_value=2000.0, max_value=30000.0, value=3800.0, step=50.0)
            custom_mass = st.number_input("Stellar Mass (Solar Mass M☉)", min_value=0.05, max_value=10.0, value=0.45, step=0.05)

        with col_in3:
            custom_dist = st.number_input("System Distance (Parsecs)", min_value=0.1, max_value=5000.0, value=15.0, step=1.0)
            custom_p_real = st.slider("Signal Validation P(Real Planet)", min_value=0.0, max_value=1.0, value=0.95, step=0.05)

        if st.button("🚀 Calculate Habitability Ranking", type="primary"):
            # 1. Kopparapu HZ calculation
            X = custom_teff - 5778.0
            s_inner = 1.776 + (1.3351e-8 * X) + (3.1515e-12 * (X**2))
            s_outer = 0.356 + (1.0183e-8 * X) + (1.4885e-12 * (X**2))

            in_hz = int(s_outer <= custom_insol <= s_inner)
            is_rocky = int(custom_radius <= 1.6)

            # 2. Equilibrium Temperature (Bond Albedo = 0.3)
            sigma = 5.670374419e-8
            insol_wm2 = custom_insol * 1361.0
            eq_temp = (insol_wm2 * (1 - 0.3) / (4 * sigma)) ** 0.25

            # 3. Earth Similarity Index (ESI)
            esi_r = max(0, 1 - abs(custom_radius - 1.0) / (custom_radius + 1.0))
            esi_t = max(0, 1 - abs(eq_temp - 288.0) / (eq_temp + 288.0))
            esi = (esi_r * esi_t) ** 0.5

            # 4. Physics Score
            physics_score = custom_p_real * in_hz * is_rocky

            # 5. ML Score (using loaded model if available or heuristic fallback)
            if candidate_svc.model_data and 'model' in candidate_svc.model_data:
                try:
                    feat_names = candidate_svc.model_data.get('feature_names', ['pl_orbper', 'pl_rade', 'pl_insol', 'eq_temp_k', 'st_teff', 'st_rad', 'st_mass', 'sy_dist', 'earth_similarity_index'])
                    sample_df = pd.DataFrame([{
                        'pl_orbper': custom_period,
                        'pl_rade': custom_radius,
                        'pl_insol': custom_insol,
                        'eq_temp_k': eq_temp,
                        'st_teff': custom_teff,
                        'st_rad': 0.5,
                        'st_mass': custom_mass,
                        'sy_dist': custom_dist,
                        'earth_similarity_index': esi
                    }])[feat_names]
                    ml_score = float(candidate_svc.model_data['model'].predict_proba(sample_df)[0, 1])
                except Exception:
                    ml_score = physics_score
            else:
                ml_score = physics_score

            composite_score = (0.5 * physics_score) + (0.5 * ml_score)

            st.markdown("---")
            st.markdown(f"### 📊 Habitability Assessment Results for `{custom_name}`")

            res_c1, res_c2, res_c3, res_c4 = st.columns(4)
            with res_c1:
                st.metric("In Conservative HZ", "YES ✅" if in_hz else "NO ❌")
                st.metric("Rocky Classification", "Rocky (R ≤ 1.6)" if is_rocky else "Mini-Neptune/Gas")
            with res_c2:
                st.metric("Equilibrium Temp", f"{eq_temp:.1f} K")
                st.metric("Proxy ESI", f"{esi:.3f}")
            with res_c3:
                st.metric("Physics Score", f"{physics_score:.3f}")
                st.metric("ML Score", f"{ml_score:.3f}")
            with res_c4:
                st.metric("Composite Score", f"{composite_score:.3f}")

            st.progress(composite_score)

            if composite_score >= 0.80:
                st.success("🏆 High Habitability Potential! This candidate is rocky, inside the conservative Habitable Zone, and has a high signal confidence.")
            elif composite_score >= 0.40:
                st.info("🟡 Moderate Habitability Potential. Meets partial habitability criteria.")
            else:
                st.warning("🔴 Low Habitability Potential. Candidate lies outside conservative Habitable Zone or exceeds rocky radius threshold.")

# =============================================================================
# MODULE 4: SCIENTIFIC ANALYTICS & INSIGHTS
# =============================================================================
elif module == "📊 Scientific Analytics & Insights":
    st.title("📊 Scientific Analytics & Model Insights")
    st.markdown("Comprehensive statistical distribution and ML performance evaluation metrics.")
    st.markdown("---")

    df = candidate_svc.df if candidate_svc.df is not None else pd.DataFrame()

    if not df.empty:
        a_col1, a_col2 = st.columns(2)

        with a_col1:
            st.markdown("#### Proxy ESI vs. Composite Habitability Score")
            fig1, ax1 = plt.subplots(figsize=(6, 4))
            sns.set_style("darkgrid")
            plt.rcParams.update({'text.color': 'white', 'axes.labelcolor': 'white', 'xtick.color': 'white', 'ytick.color': 'white', 'figure.facecolor': '#0b0f19', 'axes.facecolor': '#1e293b'})
            sns.scatterplot(
                data=df,
                x='earth_similarity_index',
                y='composite_habitability_score',
                hue='stellar_type',
                palette='Set2',
                ax=ax1,
                alpha=0.7
            )
            ax1.set_xlabel("Proxy Earth Similarity Index (ESI)")
            ax1.set_ylabel("Composite Habitability Score")
            st.pyplot(fig1)

        with a_col2:
            st.markdown("#### Host Star Spectral Type Distribution")
            fig2, ax2 = plt.subplots(figsize=(6, 4))
            plt.rcParams.update({'text.color': 'white', 'axes.labelcolor': 'white', 'xtick.color': 'white', 'ytick.color': 'white', 'figure.facecolor': '#0b0f19', 'axes.facecolor': '#1e293b'})
            st_counts = df['stellar_type'].value_counts()
            ax2.pie(st_counts.values, labels=st_counts.index, autopct='%1.1f%%', colors=sns.color_palette("mako", len(st_counts)))
            ax2.set_title("Catalog Star Types")
            st.pyplot(fig2)

        st.markdown("---")
        b_col1, b_col2 = st.columns(2)

        with b_col1:
            st.markdown("#### Physics Score vs. ML Score Correlation")
            fig3, ax3 = plt.subplots(figsize=(6, 4))
            plt.rcParams.update({'text.color': 'white', 'axes.labelcolor': 'white', 'xtick.color': 'white', 'ytick.color': 'white', 'figure.facecolor': '#0b0f19', 'axes.facecolor': '#1e293b'})
            sns.scatterplot(
                data=df,
                x='physics_habitability_score',
                y='ml_habitability_score',
                color='#6366f1',
                alpha=0.6,
                ax=ax3
            )
            ax3.set_xlabel("Physics Habitability Score")
            ax3.set_ylabel("ML Habitability Score")
            st.pyplot(fig3)

        with b_col2:
            st.markdown("#### Equilibrium Temperature vs Planet Radius")
            fig4, ax4 = plt.subplots(figsize=(6, 4))
            plt.rcParams.update({'text.color': 'white', 'axes.labelcolor': 'white', 'xtick.color': 'white', 'ytick.color': 'white', 'figure.facecolor': '#0b0f19', 'axes.facecolor': '#1e293b'})
            sns.scatterplot(
                data=df,
                x='eq_temp_k',
                y='pl_rade',
                hue='P_HZ',
                palette='coolwarm',
                ax=ax4,
                alpha=0.7
            )
            ax4.set_xlabel("Equilibrium Temp (K)")
            ax4.set_ylabel("Radius (R⊕)")
            st.pyplot(fig4)
    else:
        st.warning("Catalog dataset not loaded.")
