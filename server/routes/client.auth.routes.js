import express from "express";
const router = express.Router();
import {
  sendOtp,
  verifyFirebaseIdTokenController,
} from "../controllers/client.auth.controller.js";

router.post("/send-otp", sendOtp);
router.post("/verify-id-token", verifyFirebaseIdTokenController);

export default router;
