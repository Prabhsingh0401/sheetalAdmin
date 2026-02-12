import About from "../models/about.model.js";
import { deleteS3File } from "../utils/fileHelper.js";

// @desc    Get About Page Data
// @route   GET /api/v1/pages/about
// @access  Public
export const getAboutPage = async (req, res, next) => {
    try {
        let about = await About.findOne();

        if (!about) {
            // Return empty structure if not found
            return res.status(200).json({
                success: true,
                page: {},
            });
        }

        res.status(200).json({
            success: true,
            page: about,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update About Page
// @route   POST /api/v1/pages/about
// @access  Private/Admin
export const updateAboutPage = async (req, res, next) => {
    try {
        let about = await About.findOne();

        if (!about) {
            about = new About({});
        }

        // Image Helper
        const handleFile = (section, fieldName) => {
            if (req.files && req.files[fieldName]) {
                if (!about[section]) about[section] = {};
                about[section].image = req.files[fieldName][0].location; // S3 URL
            }
        }

        // Update Banner
        if (req.body.bannerTitle) {
            if (!about.banner) about.banner = {};
            about.banner.title = req.body.bannerTitle;
        }
        handleFile("banner", "bannerImage");

        // Update Journey
        if (req.body.journeyTitle) {
            if (!about.journey) about.journey = {};
            about.journey.title = req.body.journeyTitle;
            about.journey.description = req.body.journeyDescription;
        }
        handleFile("journey", "founderImage");

        // Update Mission
        if (req.body.missionTitle) {
            if (!about.mission) about.mission = {};
            about.mission.title = req.body.missionTitle;
            about.mission.description = req.body.missionDescription;
        }
        handleFile("mission", "missionImage");

        // Update Craft
        if (req.body.craftTitle) {
            if (!about.craft) about.craft = {};
            about.craft.title = req.body.craftTitle;
            about.craft.description = req.body.craftDescription;
        }
        handleFile("craft", "craftImage");

        if (req.user) {
            about.updatedBy = req.user._id;
        }

        await about.save();

        res.status(200).json({
            success: true,
            message: "About page updated successfully",
            page: about,
        });
    } catch (error) {
        next(error);
    }
};
