const { auth } = require('../config/firebase-admin');
const { db } = require('../config/database');

const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can view the users list.' });
    }

    const snapshot = await db.collection('users').get();
    const users = [];

    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Unable to load users.");
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can delete users.' });
    }

    const { id } = req.params;
    const docRef = db.collection('users').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (id === req.user.uid) return res.status(400).json({ error: 'You cannot delete your own administrator account.' });
    try { await auth.deleteUser(id); } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
    }
    await docRef.delete();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Unable to delete user.");
    res.status(500).json({ error: "Failed to delete user" });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const students = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.role === 'Student') {
        const testScore = data.testScore || 0;
        const resourcesUploaded = data.resourcesUploaded || 0;
        // Basic competitive formula: 1 resource = 50 points
        const totalScore = testScore + (resourcesUploaded * 50);
        
        students.push({
          id: doc.id,
          name: data.name || 'Anonymous Student',
          testScore,
          resourcesUploaded,
          totalScore
        });
      }
    });

    students.sort((a, b) => b.totalScore - a.totalScore);
    
    res.status(200).json(students);
  } catch (error) {
    console.error("Unable to load leaderboard.");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const ref = db.collection('users').doc(req.user.uid);
    const profile = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      const existing = snapshot.exists ? snapshot.data() : {};
      const data = {
        name: req.user.name || existing.name || 'Student',
        email: req.user.email || '',
        role: req.user.role,
        ...(!snapshot.exists ? { createdAt: new Date().toISOString(), testScore: 0, resourcesUploaded: 0 } : {})
      };
      transaction.set(ref, data, { merge: true });
      return { ...existing, ...data, uid: req.user.uid };
    });
    res.json(profile);
  } catch (error) {
    console.error('Profile synchronization failed.');
    res.status(503).json({ error: 'Unable to load your profile. Please try again.' });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getLeaderboard,
  getUserProfile
};
