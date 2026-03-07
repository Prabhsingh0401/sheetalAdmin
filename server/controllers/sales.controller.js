import Order from '../models/order.model.js';

export const getBestSellingProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 50);

    const results = await Order.aggregate([
      // 1. Only count delivered orders
      {
        $match: { orderStatus: "Delivered" },
      },

      // 2. Flatten orderItems — one doc per line item
      {
        $unwind: "$orderItems",
      },

      // 3. Group by product — sum units and revenue
      {
        $group: {
          _id: "$orderItems.product",
          name: { $first: "$orderItems.name" },
          image: { $first: "$orderItems.image" },
          unitsSold: { $sum: "$orderItems.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$orderItems.quantity", "$orderItems.price"],
            },
          },
        },
      },

      // 4. Sort by revenue descending
      {
        $sort: { totalRevenue: -1 },
      },

      // 5. Limit results
      {
        $limit: limit,
      },

      // 6. Shape the final response
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          image: 1,
          unitsSold: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("[getBestSellingProducts]", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch best-selling products.",
      error: error.message,
    });
  }
};