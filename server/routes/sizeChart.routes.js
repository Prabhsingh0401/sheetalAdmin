import express from "express";
import * as sizeChartController from "../controllers/sizeChart.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
import { uploadTo } from "../middlewares/multer.middleware.js";

const router = express.Router();

router
  .route("/how-to-measure")
  .put(
    isAuthenticated,
    isAdmin,
    uploadTo("sizeChart").single("howToMeasureImage"),
    sizeChartController.uploadHowToMeasureImage,
  );

router
  .route("/")
  .get(sizeChartController.getSizeChart)
  .post(isAuthenticated, isAdmin, sizeChartController.addSize);

router
  .route("/:id")
  .put(isAuthenticated, isAdmin, sizeChartController.updateSize)
  .delete(isAuthenticated, isAdmin, sizeChartController.deleteSize);

export default router;
