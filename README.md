# 🛡️ Bharat Cyber Rakshak (BCR) AI

Bharat Cyber Rakshak is an advanced national cyber-fraud defense system. It uses Sovereign AI (Gemini 3) to protect citizens by detecting scams and automatically engaging scammers to extract financial intelligence (UPI IDs, bank accounts, phone numbers).

## 🚀 Getting Started (Local Development)

### 1. Frontend Web App
The frontend is a React-based dashboard for citizens and investigators.
- Ensure you have an API Key from [Google AI Studio](https://aistudio.google.com/).
- The system uses `process.env.API_KEY` for frontend operations.

### 2. Backend API Gateway (`server.js`)
The backend provides a standardized REST endpoint for third-party integrations and automated processing.
```bash
# Install dependencies
npm install

# Set your API Key in a .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start the server
npm start
```
The API will be available at `http://localhost:3000/rakshak`.

## 🚢 Deployment

### Deploying the Backend (Node.js)
- **Render / Heroku / Fly.io**:
  - Connect your GitHub repository.
  - Set the `GEMINI_API_KEY` as an environment variable in the dashboard.
  - Deployment is automatic on push.

### Deploying the Frontend (React)
- The frontend can be deployed to Vercel, Netlify, or GitHub Pages.
- Ensure `process.env.API_KEY` is configured in your build environment.

## 🧪 Testing the API

Use the following `curl` command to test the scam detection and engagement engine:

```bash
curl -X POST http://localhost:3000/rakshak \
-H "Content-Type: application/json" \
-d '{
  "conversation_id": "test-case-001",
  "message": "Your Bank account is blocked. Call 9988776655 to verify KYC immediately.",
  "history": []
}'
```

## 🧠 Core Features
- **Honeypot Engagement**: Automatically talks to scammers using a "Polite but Confused" Indian victim persona.
- **Forensic Extraction**: Pulls UPI IDs, IFSC codes, and Phone numbers directly from the chat.
- **Voice Safety Shield**: Real-time voice monitoring for deepfake and pressure tactic detection.
- **War Room**: Stress-test the national grid with simulated 5,000-node attack clusters.
