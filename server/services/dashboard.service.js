import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const getAdminStatsService = async () => {
    // 1. Total Sales (Revenue) - Sabhi Delivered orders ka sum
    const totalSalesData = await Order.aggregate([
        { $match: { orderStatus: "Delivered" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalSales = totalSalesData.length > 0 ? totalSalesData[0].total : 0;

    // 2. Counts (Orders, Products, Users)
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });

    // 3. Inventory Status (Out of Stock)
    const outOfStock = await Product.countDocuments({ stock: 0 });

    // 4. Order Status Breakup (For Pie Chart)
    const orderStatus = await Order.aggregate([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);

    // 5. Category wise Product Count
    const categoryStats = await Product.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    return {
        success: true,
        stats: {
            totalSales,
            totalOrders,
            totalProducts,
            totalUsers,
            outOfStock
        },
        orderStatus,
        categoryStats
    };
};