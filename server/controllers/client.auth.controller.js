import {
  sendOtp as sendOtpService,
  verifyFirebaseIdToken as verifyFirebaseIdTokenService,
} from "../services/client.auth.service.js";

const sendOtp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const result = await sendOtpService(phoneNumber);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const verifyFirebaseIdTokenController = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split(" ")[1];
    if (!idToken) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization token not found." });
    }
    const result = await verifyFirebaseIdTokenService(idToken);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export { sendOtp, verifyFirebaseIdTokenController };
