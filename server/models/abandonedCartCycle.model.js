import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["first", "second", "third", "final"],
      required: true,
    },
    scheduledFor: { type: Date, required: true },
    status: {
      type: String,
      enum: ["queued", "processing", "sent", "failed", "cancelled", "skipped"],
      default: "queued",
    },
    sentAt: { type: Date },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: null },
    lockedAt: { type: Date },
    lockedBy: { type: String, default: null },
    retryAt: { type: Date },
    sentChannels: [
      {
        channel: {
          type: String,
          enum: ["email", "whatsapp", "sms"],
          required: true,
        },
        status: {
          type: String,
          enum: ["sent", "failed", "skipped"],
          required: true,
        },
        attemptedAt: { type: Date, default: Date.now },
        error: { type: String, default: null },
      },
    ],
    attemptLogs: [
      {
        attemptedAt: { type: Date, default: Date.now },
        outcome: {
          type: String,
          enum: ["success", "failure", "skipped"],
          required: true,
        },
        message: { type: String, default: null },
        channels: [{ type: String }],
      },
    ],
  },
  { _id: false },
);

const abandonedCartCycleSchema = new mongoose.Schema(
  {
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: { type: String, trim: true, lowercase: true, default: null },
    phoneNumber: { type: String, trim: true, default: null },
    abandonedAt: { type: Date, required: true, index: true },
    lastActivityAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "abandoned", "cancelled", "completed"],
      default: "abandoned",
      index: true,
    },
    reason: {
      type: String,
      enum: ["inactivity", "checkout_exit", "manual", "user_activity", "order_completed"],
      default: "inactivity",
    },
    inactivityMinutes: { type: Number, required: true, default: 20 },
    cartValue: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },
    couponCode: { type: String, default: null },
    discountPercent: { type: Number, default: null },
    itemsSnapshot: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        productName: { type: String, default: "" },
        image: { type: String, default: "" },
        price: { type: Number, default: 0 },
        discountPrice: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        size: { type: String, default: "" },
        color: { type: String, default: "" },
        variantImage: { type: String, default: "" },
      },
    ],
    reminders: [reminderSchema],
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    source: {
      type: String,
      enum: ["scanner", "checkout_exit", "api", "manual"],
      default: "scanner",
    },
  },
  { timestamps: true },
);

abandonedCartCycleSchema.index(
  { cart: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["active", "abandoned"] },
    },
  },
);

const AbandonedCartCycle =
  mongoose.models.AbandonedCartCycle ||
  mongoose.model("AbandonedCartCycle", abandonedCartCycleSchema);

export default AbandonedCartCycle;
