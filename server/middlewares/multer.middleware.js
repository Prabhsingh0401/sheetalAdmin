import multer from "multer";
import path from "path";
import fs from "fs";
import ErrorResponse from "../utils/ErrorResponse.js";

export const uploadTo = (folderName) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = `uploads/${folderName}`;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(
        null,
        `${folderName}-${uniqueSuffix}${path.extname(file.originalname)}`,
      );
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|mp4|webm|mov/;
    const isExtValid = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const isMimeValid = allowedTypes.test(file.mimetype);

    if (isExtValid && isMimeValid) {
      cb(null, true);
    } else {
      cb(ErrorResponse("Only images and videos are allowed.", 400), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 55 * 1024 * 1024,
    },
  });
};
