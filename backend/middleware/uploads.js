const multer = require('multer');
const path = require('node:path');
// Leave headroom below Vercel's 4.5 MB request/response payload limit.
const MAX_FILE_MB = process.env.VERCEL === '1' ? 4 : 10;
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 7, fieldSize: 5000, parts: 8 },
  fileFilter: (req, file, cb) => {
    if (!['.pdf', '.docx', '.pptx'].includes(path.extname(file.originalname).toLowerCase())) {
      return cb(Object.assign(new Error(`Upload a PDF, DOCX or PPTX document, maximum ${MAX_FILE_MB} MB.`), { status: 400 }));
    }
    cb(null, true);
  }
});
module.exports = { upload, MAX_FILE_SIZE, MAX_FILE_MB };
