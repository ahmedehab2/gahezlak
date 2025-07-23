import { Request } from "express";
import multer from "multer";

const storage = multer.memoryStorage();
const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB per file

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG) or PDF documents are allowed"));
  }
};

function uploadSingleMiddleware(fieldName: string) {
  return multer({
    storage,
    limits,
    fileFilter,
  }).single(fieldName);
}

function uploadMultipleMiddleware(fieldName: string) {
  return multer({
    storage,
    limits,
    fileFilter,
  }).array(fieldName, 5); // max 5 files
}

export { uploadSingleMiddleware, uploadMultipleMiddleware };
