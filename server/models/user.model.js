import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
    addressType: { type: String, enum: ["Home", "Office", "Other"], default: "Home" }
});

const userSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: [50, "Name cannot exceed 50 characters"] },
        email: {
            type: String, unique: true, sparse: true, lowercase: true, trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
        },
        password: { type: String, select: false, minlength: [8, "Password must be at least 8 characters"] },
        phoneNumber: { type: String, unique: true, sparse: true },
        role: { type: String, enum: ["user", "admin", "guest"], default: "user" },
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        isGuest: { type: Boolean, default: false },
        addresses: [addressSchema],
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        cart: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: { type: Number, default: 1 } }],
        isVerified: { type: Boolean, default: false },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
