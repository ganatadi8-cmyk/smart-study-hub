const { db } = require('../config/firebase-admin');

const getBranches = async (req, res) => {
  try {
    const branches = [
      { id: 'cse', name: 'Computer Science Engineering', shortName: 'CSE', icon: '💻' },
      { id: 'it', name: 'Information Technology', shortName: 'IT', icon: '🌐' },
      { id: 'ece', name: 'Electronics and Communication', shortName: 'ECE', icon: '📡' },
      { id: 'eee', name: 'Electrical Engineering', shortName: 'EEE', icon: '⚡' },
      { id: 'mech', name: 'Mechanical Engineering', shortName: 'MECH', icon: '⚙️' },
      { id: 'civil', name: 'Civil Engineering', shortName: 'CIVIL', icon: '🏗️' },
      { id: 'ai', name: 'Artificial Intelligence & Data Science', shortName: 'AI&DS', icon: '🤖' },
      { id: 'aero', name: 'Aerospace Engineering', shortName: 'AERO', icon: '🚀' },
      { id: 'chem', name: 'Chemical Engineering', shortName: 'CHEM', icon: '🧪' }
    ];
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllResources = async (req, res) => {
  try {
    const { branch, type } = req.query;

    let query = db.collection("resources");

    if (branch) {
      query = query.where("branch", "==", branch);
    }

    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();

    const resources = [];

    snapshot.forEach((doc) => {
      resources.push({
        id: doc.id,
        ...doc.data()
      });
    });

    resources.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt) : 0;
      const timeB = b.createdAt ? new Date(b.createdAt) : 0;
      return timeB - timeA;
    });

    res.status(200).json(resources);

  } catch (error) {
    res.status(500).json({ message: "Failed to load resources" });
  }
};

const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('resources').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    // Check ownership
    const docRef = db.collection('resources').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Check ownership or Admin privileges
    const isOwner = docSnap.data().uploadedBy === req.user.uid;
    const isAdmin = req.user.role === 'Admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this resource' });
    }

    await docRef.delete();
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating value' });
    }

    const docRef = db.collection('resources').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const data = docSnap.data();
    const newCount = (data.ratingCount || 0) + 1;
    const newTotal = ((data.rating || 0) * (data.ratingCount || 0)) + rating;
    const newAvg = newTotal / newCount;

    await docRef.update({
      rating: newAvg,
      ratingCount: newCount
    });

    res.json({ message: 'Rating updated', rating: newAvg, count: newCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadResource = async (req, res) => {
  try {
    const { title, branch, subject, type, description, videoURL } = req.body;
    const file = req.file;

    if (req.user.role === 'Student') {
      return res.status(403).json({ error: 'Students are not authorized to upload resources.' });
    }

    if (!file && !(type === 'Video' && videoURL)) {
      return res.status(400).json({ error: 'Please provide a file or a video link.' });
    }

    const newResource = {
      title,
      branch,
      subject,
      type,
      description,
      uploadedBy: req.user.uid,
      rating: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString()
    };

    if (file) {
      // In a real prod environment we'd push to Firebase Storage here.
      // For local testing without Google Credentials we save locally via Multer.
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      newResource.fileURL = fileUrl;
      newResource.fileName = file.originalname;
    } else if (type === 'Video' && videoURL) {
      newResource.videoURL = videoURL;
    }

    const docRef = await db.collection('resources').add(newResource);
    
    res.status(201).json({ message: 'Resource uploaded successfully', id: docRef.id, resource: newResource });
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ error: 'Failed to upload resource. ' + error.message });
  }
};

const getRecommendedResources = async (req, res) => {
  try {
    const { branch } = req.query;
    let query = db.collection("resources");
    
    if (branch) {
      query = query.where("branch", "==", branch);
    }

    const snapshot = await query.get();
    const resources = [];

    snapshot.forEach((doc) => {
      resources.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by descending rating and then descending ratingCount
    resources.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (b.ratingCount || 0) - (a.ratingCount || 0);
    });

    // Return the top 4
    res.status(200).json(resources.slice(0, 4));
  } catch (error) {
    console.error("Error fetching recommended resources:", error);
    res.status(500).json({ error: "Failed to load recommended resources" });
  }
};

module.exports = {
  getBranches,
  getAllResources,
  getResourceById,
  deleteResource,
  rateResource,
  uploadResource,
  getRecommendedResources
};
