import { Request } from "express";
import multer from "multer";

const storage = multer.memoryStorage();
const multibleUploadLimit = { fileSize: 5 * 1024 * 1024 }; // 5MB per file
const singleUploadLimit = { fileSize: 1 * 1024 * 1024 }; // 10MB for single file

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

function uploadSingleMiddleware(fieldName: string) {
  return multer({
    storage,
    limits: singleUploadLimit,
    fileFilter,
  }).single(fieldName);
}

function uploadMultipleMiddleware(fieldName: string) {
  return multer({
    storage,
    limits: multibleUploadLimit,
    fileFilter,
  }).array(fieldName, 5); // max 5 files
}

export { uploadSingleMiddleware, uploadMultipleMiddleware };
