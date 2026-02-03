import dotenv from "dotenv";
dotenv.config();

const { PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRE, NODE_ENV } = process.env;

if (!MONGO_URI || !JWT_SECRET) {
  throw new Error("ERROR: MONGO_URI and JWT_SECRET are missing in .env!");
}

export const config = Object.freeze({
  port: PORT || 5000,
  mongoUri: MONGO_URI,
  mode: process.env.NODE_ENV,
  jwtSecret: JWT_SECRET,
  jwtExpire: JWT_EXPIRE || "7d",
  nodeEnv: NODE_ENV || "development",
  adminName: process.env.ADMIN_NAME || "Admin",
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  frontendDomain: process.env.FRONTEND_URL || "http://localhost:3000",
  baseUrl: process.env.BACKEND_URL || "http://localhost:8000",
});
