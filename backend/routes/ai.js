const router = require('express').Router();
const { OpenAI } = require('openai');
const { verifyToken, requireVerifiedEmail } = require('../middleware/authMiddleware');
const { aiRateLimit } = require('../middleware/aiRateLimit');
const validateChat = (req, res, next) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 20 ||
    messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 4000) ||
    messages.reduce((n, m) => n + m.content.length, 0) > 16000 || messages.at(-1).role !== 'user') {
    return res.status(400).json({ error: 'Send up to 20 user/assistant messages, up to 4,000 characters each and 16,000 total, ending with a question.' });
  }
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'The AI assistant is not configured yet.' });
  next();
};
router.post('/chat', verifyToken, requireVerifiedEmail, validateChat, aiRateLimit, async (req, res) => {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000, maxRetries: 0 });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_completion_tokens: 800,
      messages: [
        { role: 'system', content: 'You are the Smart Study Hub study assistant. Explain concepts clearly and concisely. Admit uncertainty. You cannot access the site study materials; do not claim to have read them.' },
        ...req.body.messages.map(({ role, content }) => ({ role, content }))
      ]
    });
    res.json({ role: 'assistant', content: completion.choices[0].message.content });
  } catch (error) {
    res.status(error.status === 429 ? 429 : 502).json({ error: error.status === 429 ? 'The AI service is temporarily at its usage limit.' : 'The AI service could not respond. Please try again.' });
  }
});
module.exports = router;
