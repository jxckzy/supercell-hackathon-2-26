"""
FastAPI backend: NPC chat with real AI (supports Gemini 3, Ollama, Groq, OpenAI).
Run: uvicorn main:app --reload

Set AI_PROVIDER=gemini|ollama|groq|openai in .env (default: gemini)
For Gemini 3: Get free API key from https://aistudio.google.com/apikey (recommended, cloud-based)
  Uses google-genai package with gemini-3-flash-preview model
For Ollama: Install from https://ollama.ai and run: ollama pull llama3.2
For Groq: Get free API key from https://console.groq.com
"""
import os

from dotenv import load_dotenv
load_dotenv()
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Sheriff NPC Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response models ---

class Message(BaseModel):
    from_: Literal["player", "npc"] = Field(alias="from")
    text: str


class NPCInfo(BaseModel):
    name: str
    role: str
    personality: str


class TalkRequest(BaseModel):
    npc: NPCInfo
    history: list[Message]
    player_message: str
    npc_type: Literal["killer", "villain"] | None = None  # killer = hide clues; villain = truth or lie
    other_npc_names: list[str] | None = None  # names of other NPCs (for clues/lying)


class TalkResponse(BaseModel):
    reply: str


# --- AI Providers ---

AI_PROVIDER = os.environ.get("AI_PROVIDER", "gemini").lower()


def build_system_prompt(npc: NPCInfo, npc_type: str | None = None, other_npc_names: list[str] | None = None) -> str:
    base = (
        f"You are {npc.name}, {npc.role}. "
        f"Personality: {npc.personality}. "
        "The sheriff is questioning you. Reply in character, briefly (1-3 sentences). "
    )
    if npc_type == "killer":
        base += (
            "You are the KILLER. Hide that. Deflect, give vague answers, or lie. "
            "Do not admit anything. Do not give real clues about yourself or others. "
        )
    elif npc_type == "villain":
        others = ", ".join(other_npc_names) if other_npc_names else "others"
        base += (
            f"You are NOT the killer but you know things about the others. Other people here: {others}. "
            "When asked where you were, what you saw, or who you know, give REAL clues that mention other people BY NAME. "
            "Examples: 'I saw [Name] near the bar', 'I was with [Name] for a bit', '[Name] was acting nervous'. "
            "Your clues must be TRUE so the sheriff can piece together who did it. After 2–3 questions, drop at least one concrete clue that names someone. "
            "Keep replies short (1–3 sentences) and in character. "
        )
    else:
        base += "Reply naturally and briefly. "
    return base


def format_messages(history: list[Message], player_message: str, system_prompt: str):
    """Format messages for chat API (system + history + new message)"""
    out = [{"role": "system", "content": system_prompt}]
    for m in history:
        role = "user" if m.from_ == "player" else "assistant"
        out.append({"role": role, "content": m.text})
    out.append({"role": "user", "content": player_message})
    return out


# --- Gemini 3 (free tier, cloud-based, recommended) ---

def call_gemini(messages: list, system_prompt: str) -> str:
    """Call Google Gemini 3 API using the new google-genai package."""
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Install google-genai: pip install google-genai",
        )
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Set GEMINI_API_KEY in .env (get free key from https://aistudio.google.com/apikey)",
        )
    
    try:
        # Initialize client with new API
        client = genai.Client(api_key=api_key)
        
        # Use Gemini 3 Flash Preview (or configurable model)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview")
        
        # Log which model is being used (for debugging)
        print(f"[Gemini] Using model: {model_name}")
        
        # Convert messages to Gemini 3 format using types.Content
        contents = []
        
        # Add system prompt as first user message (Gemini 3 handles system prompts differently)
        if system_prompt:
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=f"System: {system_prompt}")]
                )
            )
            # Add a model response to acknowledge system prompt (required for chat flow)
            contents.append(
                types.Content(
                    role="model",
                    parts=[types.Part.from_text(text="Understood. I'll respond as that character.")]
                )
            )
        
        # Convert conversation history
        for msg in messages:
            if msg["role"] == "system":
                continue  # Already handled above
            elif msg["role"] == "user":
                contents.append(
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=msg["content"])]
                    )
                )
            elif msg["role"] == "assistant":
                contents.append(
                    types.Content(
                        role="model",
                        parts=[types.Part.from_text(text=msg["content"])]
                    )
                )
        
        # Generate content using the new API (non-streaming)
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
        )
        
        # Extract text from response
        # The response structure may vary, try multiple ways to extract text
        text_result = ""
        
        # Method 1: Direct text attribute
        if hasattr(response, 'text') and response.text:
            text_result = response.text
        # Method 2: From candidates
        elif hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content:
                if hasattr(candidate.content, 'parts') and candidate.content.parts:
                    text_parts = []
                    for part in candidate.content.parts:
                        if hasattr(part, 'text') and part.text:
                            text_parts.append(part.text)
                    text_result = "".join(text_parts)
        # Method 3: Try accessing directly
        elif hasattr(response, 'content') and response.content:
            if hasattr(response.content, 'parts') and response.content.parts:
                text_parts = []
                for part in response.content.parts:
                    if hasattr(part, 'text') and part.text:
                        text_parts.append(part.text)
                text_result = "".join(text_parts)
        
        return text_result.strip() if text_result else ""
        
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(status_code=502, detail=f"Gemini error: {error_msg}")


# --- Ollama (local, free) ---

def call_ollama(messages: list, model: str = "llama3.2") -> str:
    import httpx
    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")
    try:
        resp = httpx.post(
            f"{ollama_url}/api/chat",
            json={"model": model, "messages": messages, "stream": False},
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"] or ""
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama not running. Install from https://ollama.ai and run: ollama pull llama3.2",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {str(e)}")


# --- Groq (free tier) ---

def call_groq(messages: list) -> str:
    try:
        from openai import OpenAI
    except ImportError:
        raise HTTPException(status_code=500, detail="Install openai: pip install openai")
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Set GROQ_API_KEY in .env (get free key from https://console.groq.com)",
        )
    
    client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
    try:
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Free, fast model
            messages=messages,
            max_tokens=256,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq error: {str(e)}")


# --- OpenAI (paid) ---

def call_openai(messages: list) -> str:
    try:
        from openai import OpenAI
    except ImportError:
        raise HTTPException(status_code=500, detail="Install openai: pip install openai")
    
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Set OPENAI_API_KEY in .env",
        )
    
    client = OpenAI(api_key=api_key)
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=256,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")


@app.post("/talk", response_model=TalkResponse)
def talk(req: TalkRequest) -> TalkResponse:
    system_prompt = build_system_prompt(
        req.npc,
        npc_type=req.npc_type,
        other_npc_names=req.other_npc_names,
    )
    messages = format_messages(req.history, req.player_message, system_prompt)
    
    if AI_PROVIDER == "gemini":
        reply = call_gemini(messages, system_prompt)
    elif AI_PROVIDER == "ollama":
        reply = call_ollama(messages)
    elif AI_PROVIDER == "groq":
        reply = call_groq(messages)
    elif AI_PROVIDER == "openai":
        reply = call_openai(messages)
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Unknown AI_PROVIDER={AI_PROVIDER}. Use: gemini|ollama|groq|openai",
        )
    
    return TalkResponse(reply=reply.strip())
