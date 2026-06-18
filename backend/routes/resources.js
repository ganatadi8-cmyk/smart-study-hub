const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  getBranches,
  getAllResources, 
  getResourceById, 
  deleteResource, 
  rateResource,
  uploadResource,
  getRecommendedResources
} = require('../controllers/resourceController');

router.get('/branches', getBranches);
router.get('/recommended', getRecommendedResources);
router.get('/', getAllResources);
router.get('/:id', getResourceById);

// Protected routes
router.post('/upload-resource', verifyToken, upload.single('file'), uploadResource);
router.delete('/:id', verifyToken, deleteResource);
router.post('/:id/rate', verifyToken, rateResource);

module.exports = router;
