import Coupon from "../models/coupon.model.js";

export const createCouponService = async (data) => {
    try {
        const code = data.code?.toUpperCase();

        if (code) {
            const existing = await Coupon.findOne({ code });
            if (existing) return { success: false, statusCode: 400, message: "Coupon code already exists" };
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

        const coupon = await Coupon.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return { success: false, statusCode: 404, message: "Coupon not found" };
        }

        return { success: true, data: coupon };
    } catch (error) {
        return { success: false, statusCode: 500, message: error.message };
    }
};

export const applyCouponService = async (code, cartTotal, userId, cartItems = []) => {
    try {
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) return { success: false, statusCode: 404, message: "Invalid or inactive coupon" };

        const validation = coupon.isValid(userId, cartTotal);
        if (!validation.valid) return { success: false, statusCode: 400, message: validation.message };

        let discount = 0;
        switch (coupon.offerType) {
            case "Percentage":
                discount = (cartTotal * coupon.offerValue) / 100;
                if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
                break;

            case "FixedAmount":
                discount = coupon.offerValue;
                break;

            case "BOGO":
                if (cartItems.length < 2) {
                    return { success: false, statusCode: 400, message: "BOGO requires at least 2 items in cart" };
                }

                const sortedPrices = cartItems.map(item => item.price).sort((a, b) => a - b);
                let cheapestItem = sortedPrices[0];

                if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
                    discount = Math.min(cheapestItem, coupon.maxDiscountAmount);
                } else {
                    discount = cheapestItem;
                }
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
                finalAmount: Math.max(0, cartTotal - Math.round(discount)),
                couponCode: coupon.code,
                offerType: coupon.offerType,
                isMaxApplied: coupon.maxDiscountAmount ? discount >= coupon.maxDiscountAmount : false
            }
        };
    } catch (error) {
        return { success: false, statusCode: 500, message: error.message };
    }
};

export const getAllCouponsService = async ({ page, limit, search }) => {
    try {
        const query = search ? { code: { $regex: search, $options: "i" } } : {};
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Coupon.find(query).sort("-createdAt").skip(skip).limit(limit),
            Coupon.countDocuments(query)
        ]);
        return { success: true, data, pagination: { total, page, limit } };
    } catch (error) {
        return { success: false, statusCode: 500, message: error.message };
    }
};

export const deleteCouponService = async (id) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(id);
        return coupon ? { success: true } : { success: false, statusCode: 404, message: "Not found" };
    } catch (error) {
        return { success: false, statusCode: 500, message: error.message };
    }
};

export const getCouponStatsService = async () => {
    try {
        const stats = await Coupon.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ["$isActive", 1, 0] } },
                    totalUsed: { $sum: { $ifNull: ["$usedCount", 0] } },
                    totalSavings: { $sum: { $ifNull: ["$totalDiscountGenerated", 0] } },
                    festiveSales: {
                        $sum: { $cond: [{ $eq: ["$couponType", "FestiveSale"] }, 1, 0] }
                    }
                }
            }
        ]);
        const result = stats[0] || { total: 0, active: 0, totalUsed: 0, totalSavings: 0, festiveSales: 0 };
        return { success: true, data: result };
    } catch (error) {
        return { success: false, statusCode: 500, message: error.message };
    }
};