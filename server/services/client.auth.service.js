import admin from "firebase-admin";
import User from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";

const sendOtp = async (phoneNumber) => {
  try {
    const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return { verificationId: userRecord.uid };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      const newUser = await admin.auth().createUser({ phoneNumber });
      return { verificationId: newUser.uid };
    }
    throw error;
  }
};

const verifyFirebaseIdToken = async (idToken) => {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const phoneNumber = decodedToken.phone_number;

  if (!phoneNumber) {
    throw new Error("Phone number not found in Firebase ID token.");
  }

  let user = await User.findOne({ phoneNumber });

  if (!user) {
    user = await User.create({ phoneNumber });
  }

  const token = signToken({ id: user._id, role: user.role });

  return {
    user: {
      id: user._id,
      phoneNumber: user.phoneNumber,
      email: user.email, // Added
      role: user.role,
      fullName: user.name, // Assuming 'name' in model maps to 'fullName' on frontend
      alternativeMobileNumber: user.alternativeMobileNumber, // Added
      gender: user.gender, // Added
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().split("T")[0]
        : undefined, // Added, formatted to YYYY-MM-DD
    },
    token,
  };
};

export { sendOtp, verifyFirebaseIdToken };
