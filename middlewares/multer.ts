import { Request } from "express";
import multer from "multer";


const storage = multer.memoryStorage();
const limits = { fileSize: 1 * 1024 * 1024 }; // 1MB limit

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
};

function uploadMiddleware(fileName: string) {
  return multer({
    storage,
    limits,
    fileFilter,
  }).single(fileName);
}

export { uploadMiddleware };
