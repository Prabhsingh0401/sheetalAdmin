import fs from "fs/promises";
import path from "path";
import logger from "./logger.js";

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
