# AI Setup Guide

## Option 1: Ollama (Recommended - Free & Local)

1. **Install Ollama**: Download from https://ollama.ai
2. **Pull a model**:
   ```bash
   ollama pull llama3.2
   ```
   (This downloads ~2GB, one-time setup)
3. **Start Ollama**: It runs automatically after install, or run `ollama serve`
4. **Set in .env**:
   ```
   AI_PROVIDER=ollama
   ```
5. **Done!** No API key needed.

## Option 2: Groq (Free Tier - Fast & Cloud)

1. **Get API key**: Sign up at https://console.groq.com (free)
2. **Set in .env**:
   ```
   AI_PROVIDER=groq
   GROQ_API_KEY=your-key-here
   ```
3. **Done!** Very fast responses.

## Option 3: OpenAI (Paid)

1. **Get API key**: https://platform.openai.com/api-keys
2. **Set in .env**:
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```

## Running the Server

```bash
cd server
pip install -r requirements.txt
# Copy .env.example to .env and configure
uvicorn main:app --reload
```

The server will use whichever provider you set in `.env` (default: ollama).
