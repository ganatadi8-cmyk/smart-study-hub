const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // System prompt for the AI Study Assistant
    const systemMessage = {
      role: 'system',
      content: 'You are an expert AI Study Assistant for the "Smart Study Hub" educational platform. Your goal is to help students understand concepts, solve problems, and provide study tips. Be concise, encouraging, and clear in your explanations. Use formatting like bullet points or bold text where appropriate to make information easier to read.'
    };

    // Prepend the system message to the conversation history
    const conversation = [systemMessage, ...messages];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conversation,
    });

    res.json({
      role: 'assistant',
      content: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    
    // Check if it's an OpenAI API error
    if (error.status === 429) {
      if (error.error && error.error.code === 'insufficient_quota') {
        return res.status(429).json({ error: 'OpenAI API Quota Exceeded. Please check your billing details and add credits to your account.' });
      }
      return res.status(429).json({ error: 'Too many requests to the AI service. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

module.exports = router;
