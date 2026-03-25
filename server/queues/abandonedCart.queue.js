import { Queue } from "bullmq";
import { config } from "../config/config.js";
import {
  getRedisConnectionOptions,
  isRedisReachable,
} from "../config/redis.js";

export const ABANDONED_CART_QUEUE_NAME = "abandoned-cart-recovery";

let abandonedCartQueue;

export const getAbandonedCartQueue = () => {
  if (abandonedCartQueue === null) {
    return null;
  }

  if (!abandonedCartQueue) {
    abandonedCartQueue = new Queue(ABANDONED_CART_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  return abandonedCartQueue;
};

export const ensureAbandonedCartQueue = async () => {
  if (abandonedCartQueue) return abandonedCartQueue;
  if (!(await isRedisReachable())) {
    abandonedCartQueue = null;
    return null;
  }

  return getAbandonedCartQueue();
};

export const buildAbandonedCartJobId = (cartId, cycleId, stage) =>
  `abandoned-cart:${cartId}:${cycleId}:${stage}`;

export const buildAbandonedCartOrderUrl = (cartId) =>
  `${config.frontendDomain.replace(/\/$/, "")}/checkout?cartId=${cartId}`;

export const closeAbandonedCartQueue = async () => {
  if (!abandonedCartQueue) return;
  await abandonedCartQueue.close();
  abandonedCartQueue = undefined;
};
