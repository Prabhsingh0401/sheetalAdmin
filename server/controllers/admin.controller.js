import User from "../models/user.model.js";
import Order from "../models/order.model.js";

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
        ] = await Promise.all([
            User.countDocuments({ role: "user" }),
            User.countDocuments({ role: "user", status: "Active" }),
            Order.countDocuments(),
            Order.countDocuments({
                createdAt: { $gte: todayStart, $lte: todayEnd },
            }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                totalOrders,
                todayOrders,
            },
        });
    } catch (err) {
        next(err);
    }
};