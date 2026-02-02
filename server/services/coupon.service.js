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

        // Pass cartItems to isValid method
        const validation = coupon.isValid(userId, cartTotal, cartItems);
        if (!validation.valid) return { success: false, statusCode: 400, message: validation.message };

        let discount = 0;
        let applicableItems = cartItems;
        let applicableTotal = cartTotal;
        let itemWiseDiscount = {}; // Initialize itemWiseDiscount

        if (coupon.scope === "Category") {
            applicableItems = cartItems.filter(item => 
                coupon.applicableIds.some(id => id.toString() === item.product.category._id.toString())
            );
            applicableTotal = applicableItems.reduce((sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity, 0);
        }

        switch (coupon.offerType) {
            case "Percentage":
                let totalApplicableDiscount = (applicableTotal * coupon.offerValue) / 100;
                if (coupon.maxDiscountAmount) totalApplicableDiscount = Math.min(totalApplicableDiscount, coupon.maxDiscountAmount);
                discount = totalApplicableDiscount;

                // Distribute discount proportionally
                if (applicableItems.length > 0 && applicableTotal > 0) {
                    applicableItems.forEach(item => {
                        const itemEffectivePrice = (item.discountPrice ?? item.price) * item.quantity;
                        itemWiseDiscount[item._id] = Math.round((itemEffectivePrice / applicableTotal) * totalApplicableDiscount);
                    });
                }
                break;

            case "FixedAmount":
                let fixedDiscountAmount = Math.min(coupon.offerValue, applicableTotal);
                discount = fixedDiscountAmount;
                
                // Distribute fixed discount proportionally
                if (applicableItems.length > 0 && applicableTotal > 0) {
                    applicableItems.forEach(item => {
                        const itemEffectivePrice = (item.discountPrice ?? item.price) * item.quantity;
                        itemWiseDiscount[item._id] = Math.round((itemEffectivePrice / applicableTotal) * fixedDiscountAmount);
                    });
                }
                break;

            case "BOGO":
                const bogoApplicableItems = coupon.scope === "Category" ? applicableItems : cartItems;

                if (bogoApplicableItems.length < (coupon.buyQuantity + coupon.getQuantity)) {
                    return { success: false, statusCode: 400, message: `BOGO requires at least ${coupon.buyQuantity + coupon.getQuantity} items from the applicable category in cart` };
                }

                // Sort items by effective price to find the cheapest ones
                const sortedItems = [...bogoApplicableItems].sort((a, b) => 
                    (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)
                );
                
                let bogoDiscount = 0;
                const freeItemsCount = coupon.getQuantity;

                // Calculate total BOGO discount first
                for (let i = 0; i < freeItemsCount && i < sortedItems.length; i++) {
                    const freeItem = sortedItems[i];
                    const freeItemPrice = (freeItem.discountPrice ?? freeItem.price) * freeItem.quantity;
                    bogoDiscount += freeItemPrice;
                }

                // Apply max discount cap if exists
                let finalBogoDiscount = bogoDiscount;
                if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
                    finalBogoDiscount = Math.min(bogoDiscount, coupon.maxDiscountAmount);
                }

                // Now distribute the final discount among items proportionally
                if (bogoDiscount > 0) {
                    const discountRatio = finalBogoDiscount / bogoDiscount; // Ratio to apply if capped
                    
                    for (let i = 0; i < freeItemsCount && i < sortedItems.length; i++) {
                        const freeItem = sortedItems[i];
                        const freeItemPrice = (freeItem.discountPrice ?? freeItem.price) * freeItem.quantity;
                        // Apply the ratio if discount was capped
                        itemWiseDiscount[freeItem._id] = Math.round(freeItemPrice * discountRatio);
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
                isMaxApplied: coupon.maxDiscountAmount ? discount >= coupon.maxDiscountAmount : false,
                applicableIds: coupon.applicableIds, // Pass applicableIds to frontend
                scope: coupon.scope,
                itemWiseDiscount: itemWiseDiscount // New: item-wise discount breakdown
            }
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
            endDate: { $gte: now } 
        };
        const query = search 
            ? { ...baseQuery, code: { $regex: search, $options: "i" } } 
            : baseQuery;

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Coupon.find(query)
                .populate({
                    path: 'applicableIds',
                    model: 'Category', // Explicitly populate as Category
                    select: 'name' // Only retrieve the name field
                })
                .sort("-createdAt").skip(skip).limit(limit),
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