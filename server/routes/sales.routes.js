import express from 'express';
import { getBestSellingProducts, getChartData, getRevenueData, getSalesData } from '../controllers/sales.controller.js';
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.get('/best-selling', isAuthenticated, isAdmin, getBestSellingProducts)
router.get('/get-chart', isAuthenticated, isAdmin, getChartData)
router.get('/get-revenue', isAuthenticated, isAdmin, getRevenueData)
router.get('/get-sales', isAuthenticated, isAdmin, getSalesData)

export default router