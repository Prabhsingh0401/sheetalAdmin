import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: { type: String, unique: true, uppercase: true, trim: true, sparse: true },
    description: { type: String, required: true },
    offerType: { type: String, enum: ["Percentage", "FixedAmount", "BOGO", "FreeShipping"], required: true },
    offerValue: { type: Number, required: true },
    isAutomatic: { type: Boolean, default: false },
    couponType: { type: String, enum: ["CouponCode", "FestiveSale", "FlashSale"], default: "CouponCode" },
    buyQuantity: { type: Number, default: 0 },
    getQuantity: { type: Number, default: 0 },
    scope: { type: String, enum: ["All", "Category", "Specific_Product"], default: "All" },
    applicableIds: [{ type: mongoose.Schema.Types.ObjectId }],
    usageLimitPerUser: { type: Number, default: 1 },
    totalUsageLimit: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usedBy: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            count: { type: Number, default: 0 },
            lastUsed: { type: Date, default: Date.now },
        }
    ],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

couponSchema.methods.canUserUse = function (userId) {
    if (!userId) return false;
    const userRecord = this.usedBy.find(u => u.userId.toString() === userId.toString());
    return !userRecord || userRecord.count < this.usageLimitPerUser;
};

couponSchema.methods.isValid = function (userId, orderAmount) {
    const now = new Date();

    if (!this.isActive) return { valid: false, message: "Coupon inactive" };
    if (now < this.startDate || now > this.endDate) return { valid: false, message: "Offer expired" };
    if (this.usedCount >= this.totalUsageLimit) return { valid: false, message: "Usage limit reached" };
    if (orderAmount < this.minOrderAmount) return { valid: false, message: "Minimum amount not met" };

    if (userId) {
        const userUsage = this.usedBy.find(u => u.userId.toString() === userId.toString());
        if (userUsage && userUsage.count >= this.usageLimitPerUser) {
            return { valid: false, message: "User limit exceeded" };
        }
    }

    return { valid: true, message: "Valid" };
};

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
export default Coupon;