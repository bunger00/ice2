const express = require('express');
const router = express.Router();

router.post('/validate-goal', async (req, res) => {
  const { mal } = req.body;
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Vurder følgende målsetting: "${mal}"...`
      }]
    });
    
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}); 