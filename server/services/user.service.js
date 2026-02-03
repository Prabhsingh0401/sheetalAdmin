import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { deleteFile } from "../utils/fileHelper.js"; // Import deleteFile

export const getWishlistService = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "wishlist",
    select:
      "_id name slug mainImage hoverImage stock variants.v_sku variants.color variants.sizes.name variants.sizes.stock variants.sizes.price variants.sizes.discountPrice", // Select relevant product fields, including variants and their nested sizes and prices
  });
  if (!user) {
    return { success: false, statusCode: 404, message: "User not found" };
  }
  return { success: true, data: user.wishlist };
};

export const toggleWishlistService = async (userId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { success: false, statusCode: 400, message: "Invalid Product ID" };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { success: false, statusCode: 404, message: "User not found" };
  }

  const isWishlisted = user.wishlist.some((id) => id.equals(productId));
  let message;

  if (isWishlisted) {
    user.wishlist.pull(productId);
    message = "Product removed from wishlist";
  } else {
    user.wishlist.push(productId);
    message = "Product added to wishlist";
  }

  await user.save();

  return { success: true, message, data: user.wishlist };
};

export const getMeService = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user)
    return { success: false, statusCode: 404, message: "User not found" };
  return { success: true, data: user };
};

export const updateProfileService = async (
  userId,
  data,
  profilePictureFile,
) => {
  if (data.role) delete data.role; // Prevent role from being updated

  const user = await User.findById(userId); // Get existing user to check for old profile picture
  if (!user)
    return { success: false, statusCode: 404, message: "User not found" };

  if (profilePictureFile) {
    // If an old profile picture exists and is not the default, delete it
    if (user.profilePicture && user.profilePicture !== "") {
      deleteFile(user.profilePicture);
    }
    data.profilePicture = profilePictureFile.path.replace(/\\/g, "/");
  }

  const updatedUser = await User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  }).select("-password");
  if (!updatedUser)
    return { success: false, statusCode: 404, message: "Update failed" };
  return { success: true, data: updatedUser };
};

export const getAllUsersService = async ({ page, limit, search }) => {
  const query = {
    role: { $in: ["user", "guest"] },
    ...(search && {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ],
    }),
  };

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit)
    .select("-password");

  return {
    success: true,
    data: users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const updateUserService = async (id, updateData) => {
  if (updateData.password && updateData.password.trim() !== "") {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  } else {
    delete updateData.password;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  ).select("-password");

  if (!user)
    return { success: false, statusCode: 404, message: "User not found" };
  return { success: true, data: user };
};

export const createUserService = async (data) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser)
    return {
      success: false,
      statusCode: 400,
      message: "Email already registered",
    };

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const newUser = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    phoneNumber: data.phoneNumber,
    role: data.role || "user",
    status: data.status || "Active",
  });

  const userWithoutPassword = await User.findById(newUser._id).select(
    "-password",
  );
  return { success: true, data: userWithoutPassword };
};

export const deleteUserService = async (id) => {
  const user = await User.findById(id);
  if (!user)
    return { success: false, statusCode: 404, message: "User not found" };
  await user.deleteOne();
  return { success: true, message: "User account deleted successfully" };
};

export const getUserStatsService = async () => {
  const roleQuery = { role: { $in: ["user", "guest"] } };
  const total = await User.countDocuments(roleQuery);
  const active = await User.countDocuments({ ...roleQuery, status: "Active" });
  const inactive = await User.countDocuments({
    ...roleQuery,
    status: "Inactive",
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const today = await User.countDocuments({
    ...roleQuery,
    createdAt: { $gte: startOfToday, $lte: endOfToday },
  });

  return { success: true, data: { total, active, inactive, today } };
};

export const createGuestUser = async () => {
  const guestUser = await User.create({
    name: "Guest User",
    email: `guest${Date.now()}@example.com`,
    role: "guest",
    status: "Active",
    isGuest: true,
  });
  return guestUser;
};

export const getSingleUserDetailsService = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    return { success: false, statusCode: 404, message: "User not found" };
  }

  const orders = await Order.find({ user: userId }).sort("-createdAt");

  const totalSpent = orders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0,
  );

  return {
    success: true,
    data: {
      ...user._doc,
      orders: orders || [],
      totalSpent: totalSpent,
    },
  };
};
