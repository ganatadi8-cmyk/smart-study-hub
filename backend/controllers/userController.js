const { db } = require('../config/firebase-admin');

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
    console.error("Error fetching users:", error);
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

    await docRef.delete();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
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
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

const getUserProfile = async (req, res) => {
  res.json({ message: 'User profile accessed', user: req.user });
};

module.exports = {
  getAllUsers,
  deleteUser,
  getLeaderboard,
  getUserProfile
};
