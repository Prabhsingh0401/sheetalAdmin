import fs from "fs/promises";
import path from "path";
import logger from "./logger.js";
import s3 from "../config/s3.js";
import { config } from "../config/config.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const deleteFile = async (filePath) => {
  if (!filePath) return;

  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    await fs.unlink(fullPath);
    logger.info(`File successfully delete hui: ${filePath}`);
  } catch (err) {
    if (err.code !== "ENOENT") {
      logger.error(`File delete karne mein error: ${err.message}`);
    }
  }
};

export const deleteS3File = async (key) => {
  if (!key) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.aws.bucketName,
      Key: key,
    });
    await s3.send(command);
    logger.info(`S3 Object successfully deleted: ${key}`);
  } catch (err) {
    logger.error(`S3 Object delete karne mein error: ${err.message}`);
  }
};

