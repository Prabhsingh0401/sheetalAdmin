import test from "node:test";
import assert from "node:assert/strict";

const setBaseEnv = () => {
  process.env.MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:3000";
  process.env.ABANDONED_CART_INACTIVITY_MINUTES =
    process.env.ABANDONED_CART_INACTIVITY_MINUTES || "20";
  process.env.ABANDONED_CART_DISCOUNT_PERCENT =
    process.env.ABANDONED_CART_DISCOUNT_PERCENT || "10";
  process.env.ABANDONED_CART_COUPON_CODE =
    process.env.ABANDONED_CART_COUPON_CODE || "SAVE10";
};

test("config clamps abandoned cart settings into supported ranges", async () => {
  setBaseEnv();

  process.env.ABANDONED_CART_INACTIVITY_MINUTES = "2";
  process.env.ABANDONED_CART_DISCOUNT_PERCENT = "25";

  const { config } = await import("../config/config.js?config-clamp-test=1");

  assert.equal(config.abandonedCart.inactivityMinutes, 15);
  assert.equal(config.abandonedCart.discountPercent, 10);
});

test("queue helpers build stable job ids and checkout urls", async () => {
  setBaseEnv();

  const { buildAbandonedCartJobId, buildAbandonedCartOrderUrl } =
    await import("../queues/abandonedCart.queue.js?queue-helper-test=1");

  assert.equal(
    buildAbandonedCartJobId("cart-1", "cycle-9", "first"),
    "abandoned-cart:cart-1:cycle-9:first",
  );
  assert.equal(
    buildAbandonedCartOrderUrl("cart-1"),
    "http://localhost:3000/checkout?cartId=cart-1",
  );
});

test("reminder channel selection matches cart contact availability", async () => {
  setBaseEnv();

  const { getReminderChannelAvailability } =
    await import("../services/abandonedCart.notification.service.js?channel-test=1");

  assert.deepEqual(
    getReminderChannelAvailability("first", {
      email: "customer@example.com",
      phoneNumber: "+911234567890",
    }),
    ["email", "whatsapp"],
  );
  assert.deepEqual(
    getReminderChannelAvailability("third", {
      email: "customer@example.com",
      phoneNumber: "+911234567890",
    }),
    ["email", "whatsapp", "sms"],
  );
  assert.deepEqual(
    getReminderChannelAvailability("final", {
      email: "customer@example.com",
      phoneNumber: "+911234567890",
    }),
    ["email"],
  );
  assert.deepEqual(
    getReminderChannelAvailability("first", {
      phoneNumber: "+911234567890",
    }),
    ["whatsapp"],
  );
  assert.deepEqual(
    getReminderChannelAvailability("first", {
      email: "customer@example.com",
    }),
    ["email"],
  );
});

test("reminder senders skip cleanly when contact details are missing", async () => {
  setBaseEnv();

  const { sendReminderEmail, sendReminderWhatsApp, sendReminderSms } =
    await import("../services/abandonedCart.notification.service.js?sender-test=1");

  const cart = { _id: "cart-1" };
  const items = [{ name: "Kurta", price: 1299, quantity: 1 }];
  const ctaUrl = "http://localhost:3000/checkout?cartId=cart-1";

  assert.deepEqual(
    await sendReminderEmail({
      cart,
      items,
      ctaUrl,
      stage: "first",
      couponCode: "SAVE10",
      discountPercent: 10,
    }),
    { skipped: true, reason: "missing_email" },
  );

  assert.deepEqual(
    await sendReminderWhatsApp({
      cart,
      items,
      ctaUrl,
      stage: "first",
      couponCode: "SAVE10",
      discountPercent: 10,
    }),
    { skipped: true, reason: "missing_phone_number" },
  );

  assert.deepEqual(
    await sendReminderSms({
      cart,
      items,
      ctaUrl,
      stage: "third",
      couponCode: "SAVE10",
      discountPercent: 10,
    }),
    { skipped: true, reason: "missing_phone_number" },
  );
});
