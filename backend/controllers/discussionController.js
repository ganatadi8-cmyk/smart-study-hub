const { randomUUID } = require('node:crypto');
const { db } = require('../config/database');

// Fetch all discussions
const getDiscussions = async (req, res) => {
  try {
    const snapshot = await db.collection('discussions').get();
    const discussions = [];

    snapshot.forEach((doc) => {
      discussions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by chronological order (newest first)
    discussions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json(discussions);
  } catch (error) {
    console.error("Unable to load discussions.");
    res.status(500).json({ error: "Failed to load discussions" });
  }
};

// Post a new question thread
const postDiscussion = async (req, res) => {
  try {
    const { question } = req.body;
    
    if (typeof question !== 'string' || !question.trim() || question.length > 5000) {
      return res.status(400).json({ error: "Question cannot be empty" });
    }

    // Require authentication
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userSnap = await db.collection('users').doc(req.user.uid).get();
    const userData = userSnap.exists ? userSnap.data() : { name: "Anonymous", role: "Student" };

    const newDiscussion = {
      user: userData.name,
      role: req.user.role,
      question,
      timestamp: new Date().toISOString(),
      replies: []
    };

    const docRef = await db.collection('discussions').add(newDiscussion);
    
    res.status(201).json({ 
      message: 'Discussion posted', 
      discussion: { id: docRef.id, ...newDiscussion } 
    });
  } catch (error) {
    console.error("Unable to save discussion.");
    res.status(500).json({ error: "Failed to post discussion" });
  }
};

// Reply to an existing thread
const replyToDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (typeof message !== 'string' || !message.trim() || message.length > 5000) {
      return res.status(400).json({ error: "Reply message cannot be empty" });
    }

    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const docRef = db.collection('discussions').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Discussion thread not found" });
    }

    const userSnap = await db.collection('users').doc(req.user.uid).get();
    const userData = userSnap.exists ? userSnap.data() : { name: "Anonymous", role: "Student" };

    const newReply = {
      id: randomUUID(),
      user: userData.name,
      role: req.user.role,
      message,
      timestamp: new Date().toISOString()
    };

    await db.runTransaction(async tx => {
      const latest = await tx.get(docRef);
      if (!latest.exists) throw Object.assign(new Error('Discussion thread not found.'), { status: 404 });
      tx.update(docRef, { replies: [...(latest.data().replies || []), newReply] });
    });

    res.status(201).json({ message: "Reply posted successfully", reply: newReply });
  } catch (error) {
    console.error("Unable to save reply.");
    res.status(500).json({ error: "Failed to post reply" });
  }
};

module.exports = {
  getDiscussions,
  postDiscussion,
  replyToDiscussion
};
