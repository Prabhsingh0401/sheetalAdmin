import Order from '../models/order.model.js';

/**
 * Helper — builds a $match stage from query params.
 * Accepts:  ?period=weekly|monthly|yearly  OR  ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Falls back to last 7 days when nothing is supplied.
 */
function buildDateMatch(query) {
  const { period, startDate, endDate } = query;

  if (startDate || endDate) {
    const match = {};
    if (startDate) match.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);          // include the full end day
      match.$lte = end;
    }
    return { createdAt: match };
  }

  const now = new Date();
  let from;

  switch (period) {
    case 'monthly': from = new Date(now.getFullYear(), now.getMonth() - 11, 1); break; // last 12 months
    case 'yearly':  from = new Date(now.getFullYear() - 4, 0, 1);               break; // last 5 years
    case 'weekly':
    default:        from = new Date(now); from.setDate(now.getDate() - 6);      break; // last 7 days
  }

  from.setHours(0, 0, 0, 0);
  return { createdAt: { $gte: from } };
}

/**
 * Returns the $dateToString format + groupId depending on period.
 */
function buildGrouping(period) {
  switch (period) {
    case 'monthly': return { format: '%Y-%m', label: '%b %Y' };   // Jan 2025
    case 'yearly':  return { format: '%Y',    label: '%Y'      };  // 2025
    default:        return { format: '%Y-%m-%d', label: '%d %b' }; // 14 Jun
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/sales-data
// Query: period=weekly|monthly|yearly  OR  startDate / endDate
// Returns: number of orders (count) grouped by date bucket
// ─────────────────────────────────────────────────────────────────────────────
export const getSalesData = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const dateMatch = buildDateMatch(req.query);
    const { format, label } = buildGrouping(period);

    const results = await Order.aggregate([
      // 1. Filter by date range & exclude cancelled orders
      {
        $match: {
          ...dateMatch,
          orderStatus: { $nin: ['Cancelled'] },
        },
      },

      // 2. Group by date bucket — count orders + total items sold
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          label: { $first: { $dateToString: { format: label, date: '$createdAt' } } },
          orders: { $sum: 1 },
          unitsSold: { $sum: { $sum: '$orderItems.quantity' } },
        },
      },

      // 3. Sort chronologically
      { $sort: { _id: 1 } },

      // 4. Shape output
      {
        $project: {
          _id: 0,
          date: '$_id',
          name: '$label',
          sales: '$orders',
          unitsSold: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      period,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('[getSalesData]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales data.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/revenue-data
// Query: period=weekly|monthly|yearly  OR  startDate / endDate
// Returns: totalRevenue (itemsPrice) grouped by date bucket
// ─────────────────────────────────────────────────────────────────────────────
export const getRevenueData = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const dateMatch = buildDateMatch(req.query);
    const { format, label } = buildGrouping(period);

    const results = await Order.aggregate([
      // 1. Filter by date range — only count revenue from delivered / processing orders
      {
        $match: {
          ...dateMatch,
          orderStatus: { $nin: ['Cancelled', 'Returned'] },
        },
      },

      // 2. Group by date bucket — sum revenue fields
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          label: { $first: { $dateToString: { format: label, date: '$createdAt' } } },
          revenue: { $sum: '$totalPrice' },
          itemsRevenue: { $sum: '$itemsPrice' },
          tax: { $sum: '$taxPrice' },
          shipping: { $sum: '$shippingPrice' },
          orders: { $sum: 1 },
        },
      },

      // 3. Sort chronologically
      { $sort: { _id: 1 } },

      // 4. Shape output
      {
        $project: {
          _id: 0,
          date: '$_id',
          name: '$label',
          revenue: { $round: ['$revenue', 2] },
          itemsRevenue: { $round: ['$itemsRevenue', 2] },
          tax: { $round: ['$tax', 2] },
          shipping: { $round: ['$shipping', 2] },
          orders: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      period,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('[getRevenueData]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue data.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/chart-data
// Combines sales + revenue into one payload so the chart needs one request
// ─────────────────────────────────────────────────────────────────────────────
export const getChartData = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const dateMatch = buildDateMatch(req.query);
    const { format, label } = buildGrouping(period);

    const results = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          orderStatus: { $nin: ['Cancelled', 'Returned'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          name: { $first: { $dateToString: { format: label, date: '$createdAt' } } },
          sales: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
          unitsSold: { $sum: { $sum: '$orderItems.quantity' } },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          name: 1,
          sales: 1,
          revenue: { $round: ['$revenue', 2] },
          unitsSold: 1,
        },
      },
    ]);

    // Summary totals for the stat pills
    const totals = results.reduce(
      (acc, d) => ({
        sales: acc.sales + d.sales,
        revenue: acc.revenue + d.revenue,
        unitsSold: acc.unitsSold + d.unitsSold,
      }),
      { sales: 0, revenue: 0, unitsSold: 0 }
    );

    res.status(200).json({
      success: true,
      period,
      totals,
      data: results,
    });
  } catch (error) {
    console.error('[getChartData]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chart data.',
      error: error.message,
    });
  }
};

export const getBestSellingProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 50);

    const results = await Order.aggregate([
      { $match: { orderStatus: 'Delivered' } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          image: { $first: '$orderItems.image' },
          unitsSold: { $sum: '$orderItems.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] },
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: 1,
          image: 1,
          unitsSold: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('[getBestSellingProducts]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch best-selling products.',
      error: error.message,
    });
  }
};