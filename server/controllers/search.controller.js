import asyncHandler from "express-async-handler";
import { searchService } from "../services/search.service.js";

export const searchController = asyncHandler(async (req, res) => {
    const { q, limit = 10, page = 1 } = req.query;

    if (!q) {
        res.status(400).json({ success: false, message: "Search query 'q' is required." });
        return;
    }

    const results = await searchService({ query: q, limit: parseInt(limit), page: parseInt(page) });

    res.status(200).json({
        success: true,
        results,
    });
});
