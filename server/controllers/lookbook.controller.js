import Lookbook from "../models/lookbook.model.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import { deleteS3File } from "../utils/fileHelper.js";

// @desc    Get lookbook by slug
// @route   GET /api/v1/lookbooks/:slug
// @access  Public
export const getLookbookBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        let lookbook = await Lookbook.findOne({ slug });

        if (!lookbook) {
            // If it doesn't exist, we can create a default one or just return null
            // Here we'll return null and let the frontend decide
            return res.status(200).json({
                success: true,
                lookbook: null,
            });
        }

        res.status(200).json({
            success: true,
            lookbook,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update lookbook images
// @route   PUT /api/v1/lookbooks/:slug
// @access  Private/Admin
export const updateLookbook = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { title } = req.body;

        // req.files will contain the new uploaded files
        // req.body.existingLeftImages and req.body.existingRightImages will contain the JSON string of existing images to keep

        let lookbook = await Lookbook.findOne({ slug });

        if (!lookbook) {
            // Create new if not exists
            lookbook = new Lookbook({
                slug,
                title: title || "Lookbook",
                leftSliderImages: [],
                rightSliderImages: [],
            });
        }

        // Parse existing images from JSON strings
        let existingLeft = [];
        try {
            existingLeft = JSON.parse(req.body.existingLeftImages || "[]");
        } catch (e) {
            console.error("Error parsing existingLeftImages", e);
        }

        let existingRight = [];
        try {
            existingRight = JSON.parse(req.body.existingRightImages || "[]");
        } catch (e) {
            console.error("Error parsing existingRightImages", e);
        }

        // Identify images to delete (those in DB but not in existing list)
        const allCurrentLeft = lookbook.leftSliderImages;
        const allCurrentRight = lookbook.rightSliderImages;

        // Find deleted images
        const toDelete = [];

        allCurrentLeft.forEach((img) => {
            if (!existingLeft.find((e) => e.key === img.key)) {
                toDelete.push(img.key);
            }
        });

        allCurrentRight.forEach((img) => {
            if (!existingRight.find((e) => e.key === img.key)) {
                toDelete.push(img.key);
            }
        });

        // Delete from S3 in background
        toDelete.forEach((key) => {
            deleteS3File(key);
        });

        // Process New Uploads
        const newLeftFiles = req.files["leftImages"] || [];
        const newRightFiles = req.files["rightImages"] || [];

        const newLeftImages = newLeftFiles.map((file) => ({
            url: file.location, // S3 URL
            key: file.key, // S3 Key
            alt: file.originalname,
        }));

        const newRightImages = newRightFiles.map((file) => ({
            url: file.location,
            key: file.key,
            alt: file.originalname,
        }));

        // Update Lookbook
        lookbook.title = title || lookbook.title;
        lookbook.leftSliderImages = [...existingLeft, ...newLeftImages];
        lookbook.rightSliderImages = [...existingRight, ...newRightImages];

        await lookbook.save();

        res.status(200).json({
            success: true,
            message: "Lookbook updated successfully",
            lookbook,
        });
    } catch (error) {
        next(error);
    }
};
