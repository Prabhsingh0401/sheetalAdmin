import admin from "firebase-admin";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
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

const verifyFirebaseIdToken = async (idToken, currentUserId = null) => {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { phone_number: phoneNumber, email, name, picture } = decodedToken;

  if (!phoneNumber && !email) {
    throw new Error("Neither phone number nor email found in Firebase ID token.");
  }

  let userPhone = null;
  let userEmail = null;
  let currentUser = null;

  if (phoneNumber) {
    userPhone = await User.findOne({ phoneNumber });
  }

  if (email) {
    userEmail = await User.findOne({ email });
  }

  if (currentUserId) {
    currentUser = await User.findById(currentUserId);
  }

  let user = null;

  // Decide on merging
  const identifyConflict = () => {
    const list = [userPhone, userEmail, currentUser].filter(u => u !== null);
    if (list.length < 2) return null;
    
    // Check if they are actually different users
    const uniqueIds = [...new Set(list.map(u => u._id.toString()))];
    if (uniqueIds.length > 1) {
       // Return primary and secondary for merging
       // Prefer currentUser or userEmail as primary
       const primary = currentUser || userEmail || userPhone;
       const secondary = list.find(u => u && u._id.toString() !== primary._id.toString());
       return { primary, secondary };
    }
    return null;
  };

  const conflict = identifyConflict();

  if (conflict) {
    const { primary, secondary } = conflict;
    // MERGE ACCOUNTS
    // 1. Move Orders
    await Order.updateMany(
      { user: secondary._id },
      { $set: { user: primary._id } }
    );

    // 2. Merge Wishlist (Unique items)
    const mergedWishlist = [...new Set([
      ...primary.wishlist.map(id => id.toString()),
      ...secondary.wishlist.map(id => id.toString())
    ])];
    primary.wishlist = mergedWishlist;

    // 3. Merge Cart (Unique products)
    const cartMap = new Map();
    primary.cart.forEach(item => cartMap.set(item.product.toString(), item.quantity));
    secondary.cart.forEach(item => {
      const prodId = item.product.toString();
      if (cartMap.has(prodId)) {
        cartMap.set(prodId, cartMap.get(prodId) + item.quantity);
      } else {
        cartMap.set(prodId, item.quantity);
      }
    });
    primary.cart = Array.from(cartMap.entries()).map(([product, quantity]) => ({
      product,
      quantity
    }));

    // 4. Merge Addresses
    if (primary.addresses.length === 0 && secondary.addresses.length > 0) {
      primary.addresses = secondary.addresses;
    } else if (secondary.addresses.length > 0) {
      primary.addresses.push(...secondary.addresses);
    }

    // 5. Update primary credentials
    if (!primary.phoneNumber && phoneNumber) primary.phoneNumber = phoneNumber;
    if (!primary.email && email) primary.email = email;
    if (!primary.name && name) primary.name = name;
    if (!primary.profilePicture && picture) primary.profilePicture = picture;
    
    await primary.save();

    // 6. Delete secondary user
    await User.deleteOne({ _id: secondary._id });

    user = primary;
  } else {
    // No conflict, just find or create
    user = userPhone || userEmail || currentUser;

    if (user) {
      // Update missing info
      let modified = false;
      if (phoneNumber && !user.phoneNumber) {
        user.phoneNumber = phoneNumber;
        modified = true;
      }
      if (email && !user.email) {
        user.email = email;
        modified = true;
      }
      if (name && !user.name) {
        user.name = name;
        modified = true;
      }
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
        modified = true;
      }
      if (modified) await user.save();
    } else {
      // Create new
      user = await User.create({
        phoneNumber,
        email,
        name: name || undefined,
        profilePicture: picture || undefined,
        isVerified: !!email || !!phoneNumber,
      });
    }
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
        : undefined,
    },
    token,
  };
};

export { sendOtp, verifyFirebaseIdToken };
