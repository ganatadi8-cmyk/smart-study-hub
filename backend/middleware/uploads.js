const multer = require('multer');
const path = require('node:path');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 7, fieldSize: 5000, parts: 8 },
  fileFilter: (req, file, cb) => {
    if (!['.pdf', '.docx', '.pptx'].includes(path.extname(file.originalname).toLowerCase())) {
      return cb(Object.assign(new Error('Upload a PDF, DOCX or PPTX document, maximum 10 MB.'), { status: 400 }));
    }
    cb(null, true);
  }
});
module.exports = { upload, MAX_FILE_SIZE };
