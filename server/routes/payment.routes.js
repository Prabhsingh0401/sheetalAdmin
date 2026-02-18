import express from 'express';
import { createPaymentLink } from '../controllers/payment.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create-link', isAuthenticated, createPaymentLink);

export default router;
