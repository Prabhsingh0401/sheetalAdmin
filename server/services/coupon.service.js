import Coupon from "../models/coupon.model.js";

export const createCouponService = async (data) => {
  try {
    const code = data.code?.toUpperCase();

    if (code) {
      const existing = await Coupon.findOne({ code });
      if (existing)
        return {
          success: false,
          statusCode: 400,
          message: "Coupon code already exists",
        };
    }

    // Enforce Scope and ModelRef based on applicableIds
    if (data.applicableIds && data.applicableIds.length > 0) {
      if (data.scope === "Specific_Product") {
        data.modelRef = "Product";
      } else {
        data.scope = "Category";
        data.modelRef = "Category";
      }
    } else {
      data.modelRef = "None";
    }

    const coupon = await Coupon.create({ ...data, code });
    return { success: true, data: coupon };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const updateCouponService = async (id, updateData) => {
  try {
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    // Enforce Scope and ModelRef based on applicableIds
    if (updateData.applicableIds && updateData.applicableIds.length > 0) {
      if (updateData.scope === "Specific_Product") {
        updateData.modelRef = "Product";
      } else {
        updateData.scope = "Category";
        updateData.modelRef = "Category";
      }
    } else if (updateData.scope === "All") {
      updateData.modelRef = "None";
      updateData.applicableIds = [];
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!coupon) {
      return { success: false, statusCode: 404, message: "Coupon not found" };
    }

    return { success: true, data: coupon };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const applyCouponService = async (
  code,
  cartTotal,
  userId,
  cartItems = [],
) => {
  try {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });
    if (!coupon)
      return {
        success: false,
        statusCode: 404,
        message: "Invalid or inactive coupon",
      };

    // Pass cartItems to isValid method
    const validation = coupon.isValid(userId, cartTotal, cartItems);
    if (!validation.valid)
      return { success: false, statusCode: 400, message: validation.message };

    let discount = 0;
    let applicableItems = cartItems;
    let applicableTotal = cartTotal;
    let itemWiseDiscount = {}; // Initialize itemWiseDiscount

    if (coupon.scope === "Category") {
      applicableItems = cartItems.filter(
        (item) =>
          item.product &&
          item.product.category &&
          coupon.applicableIds.some(
            (id) => id.toString() === item.product.category._id.toString(),
          ),
      );
      applicableTotal = applicableItems.reduce(
        (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
        0,
      );
    } else if (coupon.scope === "Specific_Product") {
      applicableItems = cartItems.filter(
        (item) =>
          item.product &&
          coupon.applicableIds.some(
            (id) =>
              id.toString() === (item.product._id || item.product).toString(),
          ),
      );
      applicableTotal = applicableItems.reduce(
        (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
        0,
      );
    }

    switch (coupon.offerType) {
      case "Percentage":
        let totalApplicableDiscount =
          (applicableTotal * coupon.offerValue) / 100;
        if (coupon.maxDiscountAmount)
          totalApplicableDiscount = Math.min(
            totalApplicableDiscount,
            coupon.maxDiscountAmount,
          );
        discount = totalApplicableDiscount;

        // Distribute discount proportionally
        if (applicableItems.length > 0 && applicableTotal > 0) {
          applicableItems.forEach((item) => {
            const itemEffectivePrice =
              (item.discountPrice ?? item.price) * item.quantity;
            itemWiseDiscount[item._id] = Math.round(
              (itemEffectivePrice / applicableTotal) * totalApplicableDiscount,
            );
          });
        }
        break;

      case "FixedAmount":
        let fixedDiscountAmount = Math.min(coupon.offerValue, applicableTotal);
        discount = fixedDiscountAmount;

        // Distribute fixed discount proportionally
        if (applicableItems.length > 0 && applicableTotal > 0) {
          applicableItems.forEach((item) => {
            const itemEffectivePrice =
              (item.discountPrice ?? item.price) * item.quantity;
            itemWiseDiscount[item._id] = Math.round(
              (itemEffectivePrice / applicableTotal) * fixedDiscountAmount,
            );
          });
        }
        break;

      case "BOGO":
        // 1. Determine applicable items based on scope
        const isCategoryScope = coupon.scope === "Category";
        const isProductScope = coupon.scope === "Specific_Product";

        let bogoApplicableItems = cartItems;

        if (isCategoryScope) {
          bogoApplicableItems = cartItems.filter((item) => {
            const product = item.product;
            if (!product || !product.category) return false;

            // Handle both populated category object and direct ID string
            const categoryId = product.category._id || product.category;

            return coupon.applicableIds.some(
              (id) => id.toString() === categoryId.toString(),
            );
          });
        } else if (isProductScope) {
          bogoApplicableItems = cartItems.filter((item) => {
            const product = item.product;
            if (!product) return false;
            const productId = product._id || product;
            return coupon.applicableIds.some(
              (id) => id.toString() === productId.toString(),
            );
          });
        }

        // 2. Check minimum quantity requirement (Buy X + Get Y)
        // Calculate TOTAL QUANTITY of applicable items, not just line item count.
        const totalApplicableQuantity = bogoApplicableItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        if (
          totalApplicableQuantity <
          coupon.buyQuantity + coupon.getQuantity
        ) {
          return {
            success: false,
            statusCode: 400,
            message: `BOGO requires at least ${coupon.buyQuantity + coupon.getQuantity
              } qualifying items in cart`,
          };
        }

        // 3. Sort items by effective price to find the cheapest ones
        // We want to make the CHEAPEST units free.
        const sortedItems = [...bogoApplicableItems].sort(
          (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)
        );

        let bogoDiscount = 0;
        let remainingFreeUnits = coupon.getQuantity;

        // 4. Calculate total BOGO discount (Unit-based calculation)
        // Iterate through cheapest items and make them free until we reach getQuantity limit
        for (const item of sortedItems) {
          if (remainingFreeUnits <= 0) break;

          const itemPrice = item.discountPrice ?? item.price;
          // How many units of this item can we make free?
          // Either all of them, or however many free units we have left.
          const unitsToDiscount = Math.min(item.quantity, remainingFreeUnits);

          bogoDiscount += unitsToDiscount * itemPrice;
          remainingFreeUnits -= unitsToDiscount;
        }

        // 5. Apply max discount cap if exists
        let finalBogoDiscount = bogoDiscount;
        if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
          finalBogoDiscount = Math.min(bogoDiscount, coupon.maxDiscountAmount);
        }

        // 6. Distribute the final discount among items proportionally
        if (bogoDiscount > 0) {
          const discountRatio = finalBogoDiscount / bogoDiscount; // Ratio to apply if capped

          // Reset for distribution
          remainingFreeUnits = coupon.getQuantity;

          for (const item of sortedItems) {
            if (remainingFreeUnits <= 0) break;

            const itemPrice = item.discountPrice ?? item.price;
            const unitsToDiscount = Math.min(item.quantity, remainingFreeUnits);

            // Calculate proportional discount for this specific line item
            // based on how many units of it were considered "free"
            const itemTotalDiscount = (unitsToDiscount * itemPrice) * discountRatio;

            itemWiseDiscount[item._id] = Math.round(itemTotalDiscount);
            remainingFreeUnits -= unitsToDiscount;
          }
        }

        discount = finalBogoDiscount;
        break;

      case "FreeShipping":
        discount = 0;
        break;

      default:
        discount = 0;
    }

    return {
      success: true,
      data: {
        discount: Math.round(discount),
        couponCode: coupon.code,
        offerType: coupon.offerType,
        isMaxApplied: coupon.maxDiscountAmount
          ? discount >= coupon.maxDiscountAmount
          : false,
        applicableIds: coupon.applicableIds, // Pass applicableIds to frontend
        scope: coupon.scope,
        itemWiseDiscount: itemWiseDiscount, // New: item-wise discount breakdown
      },
    };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const getAllCouponsService = async ({ page, limit, search }) => {
  try {
    const now = new Date();
    const baseQuery = {
      isActive: true,
      endDate: { $gte: now },
    };
    const query = search
      ? { ...baseQuery, code: { $regex: search, $options: "i" } }
      : baseQuery;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Coupon.find(query)
        .populate({
          path: "applicableIds",
          select: "name", // Only retrieve the name field
        })
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments(query),
    ]);
    return { success: true, data, pagination: { total, page, limit } };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const deleteCouponService = async (id) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(id);
    return coupon
      ? { success: true }
      : { success: false, statusCode: 404, message: "Not found" };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const getCouponStatsService = async () => {
  try {
    const now = new Date();

    const stats = await Coupon.aggregate([
      {
        // Match the same base filter used in the table so stats are consistent
        $match: {
          isActive: true,
          endDate: { $gte: now },
        },
      },
      {
        $group: {
          _id: null,
          // Total = all active, non-expired coupons (matches the table's filter)
          total: { $sum: 1 },
          // Active = isActive:true AND not yet expired (matches the table's own filter)
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isActive", true] },
                    { $gte: ["$endDate", now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          // Total redemptions across all coupons
          totalUsed: { $sum: { $ifNull: ["$usedCount", 0] } },
          // Total discount value generated
          totalSavings: { $sum: { $ifNull: ["$totalDiscountGenerated", 0] } },
          // Count of FestiveSale type coupons
          festiveSales: {
            $sum: { $cond: [{ $eq: ["$couponType", "FestiveSale"] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      active: 0,
      totalUsed: 0,
      totalSavings: 0,
      festiveSales: 0,
    };
    return { success: true, data: result };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};
