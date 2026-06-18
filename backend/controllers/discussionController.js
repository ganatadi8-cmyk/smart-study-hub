const { db } = require('../config/firebase-admin');

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
    console.error("Error fetching discussions:", error);
    res.status(500).json({ error: "Failed to load discussions" });
  }
};

// Post a new question thread
const postDiscussion = async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || question.trim() === '') {
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
      role: userData.role,
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
    console.error("Error posting discussion:", error);
    res.status(500).json({ error: "Failed to post discussion" });
  }
};

// Reply to an existing thread
const replyToDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
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
      id: "reply_" + Date.now(),
      user: userData.name,
      role: userData.role,
      message,
      timestamp: new Date().toISOString()
    };

    const discussionData = docSnap.data();
    const replies = discussionData.replies || [];
    replies.push(newReply);

    await docRef.update({ replies });

    res.status(201).json({ message: "Reply posted successfully", reply: newReply });
  } catch (error) {
    console.error("Error replying to discussion:", error);
    res.status(500).json({ error: "Failed to post reply" });
  }
};

module.exports = {
  getDiscussions,
  postDiscussion,
  replyToDiscussion
};
