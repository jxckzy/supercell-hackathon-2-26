# Gemini Setup Guide (Cloud-Based, Free)

## Step 1: Get Your Free API Key

1. Go to **Google AI Studio**: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the API key (starts with `AIza...`)

**No credit card required!** The free tier includes:
- 5-15 requests per minute
- 250,000 tokens per minute
- Up to 1,000 requests per day

## Step 2: Configure Your Backend

1. **Copy the example env file**:
   ```bash
   cd server
   copy .env.example .env
   ```

2. **Edit `.env`** and add your Gemini API key:
   ```
   AI_PROVIDER=gemini
   GEMINI_API_KEY=AIza-your-actual-key-here
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server**:
   ```bash
   uvicorn main:app --reload
   ```

## Step 3: Test It!

Open your `index.html` in a browser and try sending a message to Morgan or Lola. You should get AI-generated responses!

---

## Troubleshooting

**Error: "Set GEMINI_API_KEY in .env"**
- Make sure you created a `.env` file (not just `.env.example`)
- Check that `GEMINI_API_KEY=your-key` is in the file

**Error: "Install google-generativeai"**
- Run: `pip install google-generativeai`

**Error: "Gemini error: ..."**
- Check your API key is correct
- Make sure you haven't exceeded the free tier limits (1,000 requests/day)

---

That's it! Gemini is now your default AI provider. 🎉
