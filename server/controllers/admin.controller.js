import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import bcrypt from "bcryptjs";

export const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    // Server-side validation (mirroring frontend requirements)
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      activeUsers,
      totalOrders,
      todayOrders,
      totalProducts,
      latestUsers,
      stockData,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", status: "Active" }),
      Order.countDocuments(),
      Order.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
      Product.countDocuments(),
      User.find({ role: "user" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email createdAt"),
      Product.find({ status: "Active" })
        .sort({ stock: 1 })
        .limit(4)
        .select("name stock"),
    ]);


    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalOrders,
        todayOrders,
        totalProducts,
        latestUsers,
        stockData,
      },
    });
  }
  catch (err) {
    next(err);
  }
};
