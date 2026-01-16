import admin from 'firebase-admin';
import User from '../models/user.model.js';
import { signToken } from '../utils/jwt.js';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const sendOtp = async (phoneNumber) => {
  try {
    const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return { verificationId: userRecord.uid };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
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
    throw new Error('Phone number not found in Firebase ID token.');
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
      role: user.role,
    },
    token,
  };
};

export {
  sendOtp,
  verifyFirebaseIdToken,
};
