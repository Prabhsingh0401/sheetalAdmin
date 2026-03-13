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

    if (data.showOnHomepage === true) {
      await Coupon.updateMany({}, { $set: { showOnHomepage: false } });
    }

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

    if (updateData.showOnHomepage === true) {
      await Coupon.updateMany(
        { _id: { $ne: id } },
        { $set: { showOnHomepage: false } },
      );
    }

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

    const validation = coupon.isValid(userId, cartTotal, cartItems);
    if (!validation.valid)
      return { success: false, statusCode: 400, message: validation.message };

    let discount = 0;
    let applicableItems = cartItems;
    let applicableTotal = cartTotal;
    let itemWiseDiscount = {};

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
        const isCategoryScope = coupon.scope === "Category";
        const isProductScope = coupon.scope === "Specific_Product";

        let bogoApplicableItems = cartItems;

        if (isCategoryScope) {
          bogoApplicableItems = cartItems.filter((item) => {
            const product = item.product;
            if (!product || !product.category) return false;
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

        const totalApplicableQuantity = bogoApplicableItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        if (totalApplicableQuantity < coupon.buyQuantity + coupon.getQuantity) {
          return {
            success: false,
            statusCode: 400,
            message: `BOGO requires at least ${
              coupon.buyQuantity + coupon.getQuantity
            } qualifying items in cart`,
          };
        }

        const sortedItems = [...bogoApplicableItems].sort(
          (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price),
        );

        let bogoDiscount = 0;
        let remainingFreeUnits = coupon.getQuantity;

        for (const item of sortedItems) {
          if (remainingFreeUnits <= 0) break;
          const itemPrice = item.discountPrice ?? item.price;
          const unitsToDiscount = Math.min(item.quantity, remainingFreeUnits);
          bogoDiscount += unitsToDiscount * itemPrice;
          remainingFreeUnits -= unitsToDiscount;
        }

        let finalBogoDiscount = bogoDiscount;
        if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
          finalBogoDiscount = Math.min(bogoDiscount, coupon.maxDiscountAmount);
        }

        if (bogoDiscount > 0) {
          const discountRatio = finalBogoDiscount / bogoDiscount;
          remainingFreeUnits = coupon.getQuantity;

          for (const item of sortedItems) {
            if (remainingFreeUnits <= 0) break;
            const itemPrice = item.discountPrice ?? item.price;
            const unitsToDiscount = Math.min(item.quantity, remainingFreeUnits);
            const itemTotalDiscount =
              unitsToDiscount * itemPrice * discountRatio;
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
        applicableIds: coupon.applicableIds,
        scope: coupon.scope,
        itemWiseDiscount,
      },
    };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

// Admin: returns ALL coupons regardless of isActive/expiry so the table
// shows the full picture. Public /api/v1/coupons/ still filters by active+valid.
export const getAllCouponsService = async ({ page, limit, search, isAdmin = false }) => {
  try {
    // Admin sees everything; public only sees active non-expired
    const baseQuery = isAdmin
      ? {}
      : { isActive: true, endDate: { $gte: new Date() } };

    if (search) {
      baseQuery.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Coupon.find(baseQuery)
        .populate({ path: "applicableIds", select: "name" })
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments(baseQuery),
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
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$isActive", true] }, { $gte: ["$endDate", now] }] },
                1,
                0,
              ],
            },
          },
          expired: {
            $sum: { $cond: [{ $lt: ["$endDate", now] }, 1, 0] },
          },
          totalUsed: { $sum: { $ifNull: ["$usedCount", 0] } },
          totalSavings: { $sum: { $ifNull: ["$totalDiscountGenerated", 0] } },
          festiveSales: {
            $sum: { $cond: [{ $eq: ["$couponType", "FestiveSale"] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      active: 0,
      expired: 0,
      totalUsed: 0,
      totalSavings: 0,
      festiveSales: 0,
    };
    return { success: true, data: result };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

// Returns the single coupon marked showOnHomepage: true, or null.
// Used by the admin modal to check for conflicts without relying on
// the paginated/filtered local list.
export const getHomepageCouponService = async () => {
  try {
    const coupon = await Coupon.findOne({ showOnHomepage: true }).lean();
    return { success: true, data: coupon ?? null };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};