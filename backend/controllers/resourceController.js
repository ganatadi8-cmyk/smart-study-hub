const { db, storage } = require('../config/firebase-admin');

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

    if (docSnap.data().storagePath) {
      await storage.bucket().file(docSnap.data().storagePath).delete({ ignoreNotFound: true });
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
    const { rating } = req.body || {};
    
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
  const { title, branch, subject, type, description = '', videoURL } = req.body || {};
  const validBranches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI', 'AERO', 'CHEM'];
  const validTypes = ['Notes', 'PPT', 'Video', 'Previous Paper'];
  if (![title, subject].every(v => typeof v === 'string' && v.trim() && v.length <= 200) ||
      !validBranches.includes(branch) || !validTypes.includes(type) || typeof description !== 'string' || description.length > 5000) {
    return res.status(400).json({ error: 'Provide a title, subject, valid branch and resource type. Description must be at most 5,000 characters.' });
  }
  let video;
  let detected;
  if (type === 'Video') {
    try { video = new URL(videoURL); } catch { return res.status(400).json({ error: 'Provide a valid HTTPS video URL.' }); }
    if (video.protocol !== 'https:' || video.username || video.password || req.file) return res.status(400).json({ error: 'Videos require an HTTPS link and no file.' });
  } else {
    try {
      const { fileTypeFromBuffer } = await import('file-type');
      detected = req.file && await fileTypeFromBuffer(req.file.buffer);
    } catch { detected = null; }
    const extension = req.file?.originalname.split('.').pop().toLowerCase();
    if (!detected || !['pdf', 'docx', 'pptx'].includes(detected.ext) || detected.ext !== extension) {
      return res.status(400).json({ error: 'Upload a valid PDF, DOCX or PPTX file (maximum 10 MB). File contents must match the extension.' });
    }
  }
  const docRef = db.collection('resources').doc();
  let storedFile;
  try {
    const resource = { title: title.trim(), branch, subject: subject.trim(), type, description, uploadedBy: req.user.uid,
      rating: 0, ratingCount: 0, createdAt: new Date().toISOString() };
    if (video) resource.videoURL = video.href;
    else {
      const storagePath = `resources/${docRef.id}.${detected.ext}`;
      storedFile = storage.bucket().file(storagePath);
      await storedFile.save(req.file.buffer, { resumable: false, contentType: detected.mime, metadata: { contentDisposition: 'attachment' } });
      resource.storagePath = storagePath;
      resource.mimeType = detected.mime;
      resource.fileName = req.file.originalname.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 150);
      resource.fileURL = `${process.env.PUBLIC_API_URL.replace(/\/$/, '')}/resources/${docRef.id}/file`;
    }
    await docRef.set(resource);
    res.status(201).json({ message: 'Resource uploaded.', id: docRef.id, resource });
  } catch (error) {
    if (storedFile) await storedFile.delete({ ignoreNotFound: true }).catch(() => {});
    console.error('Upload failed:', error.message);
    res.status(503).json({ error: 'Unable to save the resource. Please try again.' });
  }
};
const downloadResource = async (req, res) => {
  try {
    const snap = await db.collection('resources').doc(req.params.id).get();
    if (!snap.exists || !snap.data().storagePath) return res.status(404).json({ error: 'File not found.' });
    const data = snap.data();
    res.attachment(data.fileName || 'study-material.pdf');
    res.set('Content-Type', data.mimeType || 'application/octet-stream');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "sandbox; default-src 'none'");
    storage.bucket().file(data.storagePath).createReadStream().on('error', () => {
      if (!res.headersSent) res.status(503).json({ error: 'Unable to download this file.' });
      else res.destroy();
    }).pipe(res);
  } catch { res.status(503).json({ error: 'Unable to download this file.' }); }
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
  downloadResource,
  getRecommendedResources
};
