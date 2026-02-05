import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// =======================
// SIMPLE HACKATHON ENDPOINT
// =======================
app.post('/api/agentic-honeypot', async (req, res) => {
  return res.json({
    status: "success",
    reply: "Why is my account being suspended?"
  });
});

// =======================
// SERVER START
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
