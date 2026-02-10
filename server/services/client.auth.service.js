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
  const { phone_number: phoneNumber, email, name, picture } = decodedToken;

  if (!phoneNumber && !email) {
    throw new Error("Neither phone number nor email found in Firebase ID token.");
  }

  let user = null;

  if (phoneNumber) {
    user = await User.findOne({ phoneNumber });
  }

  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    user = await User.create({
      phoneNumber,
      email,
      name: name || undefined,
      profilePicture: picture || undefined,
      isVerified: !!email || !!phoneNumber,
    });
  }

  const token = signToken({ id: user._id, role: user.role });

  return {
    user: {
      id: user._id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      fullName: user.name,
      alternativeMobileNumber: user.alternativeMobileNumber,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().split("T")[0]
        : undefined, // Formatted to YYYY-MM-DD
    },
    token,
  };
};

export { sendOtp, verifyFirebaseIdToken };
