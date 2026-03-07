import express from 'express';
import { getBestSellingProducts } from '../controllers/sales.controller.js';
const router = express.Router();

router.get('/best-selling', getBestSellingProducts)

export default router