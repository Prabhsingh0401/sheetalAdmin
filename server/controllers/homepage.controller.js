import Homepage from "../models/homepage.model.js";

// @desc    Get homepage visibility settings
// @route   GET /api/v1/homepage/sections
// @access  Public
export const getSections = async (req, res, next) => {
    try {
        let homepage = await Homepage.findOne();

        // Create default if doesn't exist
        if (!homepage) {
            homepage = await Homepage.create({});
        }

        res.status(200).json({ success: true, sections: homepage.sections });
    } catch (error) {
        next(error);
    }
};

// @desc    Update homepage visibility settings
// @route   PATCH /api/v1/homepage/sections
// @access  Private/Admin
export const updateSections = async (req, res, next) => {
    try {
        const { sections } = req.body;

        let homepage = await Homepage.findOne();

        if (!homepage) {
            homepage = await Homepage.create({ sections });
        } else {
            homepage.sections = { ...homepage.sections.toObject(), ...sections };
            await homepage.save();
        }

        res.status(200).json({ success: true, sections: homepage.sections });
    } catch (error) {
        next(error);
    }
};