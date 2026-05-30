const multer = require('multer');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'];

const storage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (_req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error(`Unsupported file type: ${file.mimetype}`), { status: 415 }), false);
};

// Images: up to 5 files, 10 MB each
const uploadImages = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
}).array('images', 5);

// Audio: single file, 25 MB
const uploadAudio = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_AUDIO_TYPES),
}).single('audio');

// Combined: images + one audio in a single multipart request
const uploadMedia = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error(`Unsupported file type: ${file.mimetype}`), { status: 415 }), false);
  },
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'audio',  maxCount: 1 },
]);

module.exports = { uploadImages, uploadAudio, uploadMedia };
