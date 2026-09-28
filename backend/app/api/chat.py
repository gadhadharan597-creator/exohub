from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from ..services.gemini_service import gemini_service
from ..services.candidate_service import CandidateService

router = APIRouter()
candidate_service = CandidateService()

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text content")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Chat message history")

@router.post("/chat")
def chat_endpoint(request: ChatRequest) -> Dict[str, Any]:
    """Chatbot endpoint returning AI assistant answer, function tools executed, source data tables, and web citations."""
    msgs = [{"role": m.role, "content": m.content} for m in request.messages]
    
    response_data = gemini_service.chat_with_tools(msgs, candidate_service)
    
    return {
        "answer": response_data["answer"],
        "tools_used": response_data["tools_used"],
        "source_table": response_data["source_table"],
        "citations": response_data["citations"],
        "disclaimer": "ExoMiner classifies transit signals, not habitability. Habitability scores are computed potential habitability estimates."
    }
