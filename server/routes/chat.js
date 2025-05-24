const express = require('express');
const axios = require('axios');
const router = express.Router();
const Message = require('../models/Message');

// Utility: generate session ID (date string)
const getSessionId = () => new Date().toISOString().split('T')[0];

// POST /api/chat - send user message, get AI reply, save both
router.post('/', async (req, res) => {
  const { message, session } = req.body;
  const sessionId = session || getSessionId();

  try {
    // Save user message to MongoDB
    await Message.create({ sender: 'user', text: message, session: sessionId });
    console.log('User message saved');

    // Call Cohere API
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        model: 'command-r',
        message: message,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json',
          'Cohere-Version': '2022-12-06',
        },
      }
    );

    const reply = response.data.text;

    // Save bot reply to MongoDB
    await Message.create({ sender: 'bot', text: reply, session: sessionId });
    console.log('Bot reply saved');

    res.json({ reply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch AI response from Cohere' });
  }
});

// GET /api/chat/history/:sessionId - get messages for a session
router.get('/history/:sessionId', async (req, res) => {
  try {
    const messages = await Message.find({ session: req.params.sessionId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Error fetching session history:', err);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
});

// GET /api/chat/sessions - get unique session IDs
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Message.distinct('session');
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching session list:', err);
    res.status(500).json({ error: 'Failed to fetch session list' });
  }
});

// DELETE /api/chat/clear/:sessionId - delete all messages for one session
router.delete('/clear/:sessionId', async (req, res) => {
  try {
    await Message.deleteMany({ session: req.params.sessionId });
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing session:', err);
    res.status(500).json({ error: 'Failed to clear session messages' });
  }
});

// DELETE /api/chat/clear-all - delete all chat messages
router.delete('/clear-all', async (req, res) => {
  try {
    await Message.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing all messages:', err);
    res.status(500).json({ error: 'Failed to clear all messages' });
  }
});

module.exports = router;
