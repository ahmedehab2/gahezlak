import { Request } from "express";
import multer from "multer";

const storage = multer.memoryStorage();
const limits = { fileSize: 1 * 1024 * 1024 }; // 1MB limit

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
  
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  limits,
  fileFilter,
}).single('image'); 