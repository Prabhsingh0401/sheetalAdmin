import express from "express";
import * as sizeChartController from "../controllers/sizeChart.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route("/all").get(sizeChartController.getAllSizeCharts);

router.route("/details/:id").get(sizeChartController.getSizeChartDetails);

router.route("/admin/create").
    post(isAuthenticated, isAdmin, upload.single("guideImage"), sizeChartController.createSizeChart);

router.route("/admin/:id")
    .put(isAuthenticated, isAdmin, upload.single("guideImage"), sizeChartController.updateSizeChart)
    .delete(isAuthenticated, isAdmin, sizeChartController.deleteSizeChart);

export default router;