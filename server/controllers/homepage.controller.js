import Homepage from "../models/homepage.model.js";

const applyNoStoreHeaders = (res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
    });
};

// @desc    Get homepage visibility settings
// @route   GET /api/v1/homepage/sections
// @access  Public
export const getSections = async (req, res, next) => {
    try {
        applyNoStoreHeaders(res);
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
        applyNoStoreHeaders(res);
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
