import React, { useState } from 'react';
import { sendChatMessage, Candidate } from '../services/api';
import { Send, Bot, User, Trash2, Wrench, Table, ExternalLink, RefreshCw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tools_used?: string[];
  source_table?: Candidate[] | null;
  citations?: Array<{ title: string; uri: string }>;
}

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Exoplanet Science Assistant. I answer candidate ranking and habitability questions using live data tools. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(updatedMsgs.map(m => ({ role: m.role, content: m.content })));
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer,
        tools_used: res.tools_used,
        source_table: res.source_table,
        citations: res.citations
      };
      setMessages([...updatedMsgs, assistantMsg]);
      if (res.source_table && res.source_table.length > 0) {
        setActiveMessage(assistantMsg);
      }
    } catch (err: any) {
      setMessages([...updatedMsgs, {
        role: 'assistant',
        content: '⚠️ Failed to get response. Please check backend connection.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat reset. Ask me anything about exoplanet candidates or habitability rankings!'
    }]);
    setActiveMessage(null);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-6 h-6 text-space-cyan" /> Tool-Using AI Assistant
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Powered by Gemini with function calling tools & Search Grounding. Strictly adheres to ExoMiner science caveats.
          </p>
        </div>

        <button
          onClick={clearChat}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear Chat
        </button>
      </div>

      {/* Main Chat Grid (Left: Chat Stream, Right: Data Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left: Chat Stream & Input */}
        <div className="lg:col-span-2 glass-panel rounded-xl flex flex-col min-h-0 overflow-hidden">
          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-space-cyan/20 border border-space-cyan/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-space-cyan" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 text-xs md:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-space-indigo text-slate-100 rounded-tr-none'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none space-y-2'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Tool Badge & Source Toggle */}
                  {m.role === 'assistant' && m.tools_used && m.tools_used.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <Wrench className="w-3 h-3 text-amber-400" /> Tools: {m.tools_used.join(', ')}
                      </span>
                      {m.source_table && m.source_table.length > 0 && (
                        <button
                          onClick={() => setActiveMessage(m)}
                          className="ml-auto text-space-cyan hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Table className="w-3 h-3" /> View Data Table ({m.source_table.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-space-cyan" />
                <span>Executing tools & querying data...</span>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900/90 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask about top ranked exoplanets, Kepler-1649 c, habitability scores..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-lg px-4 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-space-cyan"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-space-indigo hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right: Data Side Panel */}
        <div className="glass-panel rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Table className="w-4 h-4 text-space-cyan" /> Tool Executed Source Table
          </h2>

          <div className="flex-1 overflow-y-auto mt-3 space-y-3 text-xs custom-scrollbar">
            {activeMessage && activeMessage.source_table ? (
              <div className="space-y-2 font-mono">
                {activeMessage.source_table.map((row, i) => (
                  <div key={i} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-sans font-bold text-space-cyan text-sm flex justify-between">
                      <span>{row.pl_name}</span>
                      <span className="text-emerald-400 text-xs">Score: {row.composite_habitability_score ? row.composite_habitability_score.toFixed(3) : 'N/A'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Star: {row.hostname} ({row.stellar_type})</span>
                      <span>Radius: {row.pl_rade} R⊕</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-sans">
                <p>When the chatbot calls dataset tools, the resulting source records will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
