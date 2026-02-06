import Settings from "../models/settings.model.js";

// Ensure settings document exists
const ensureSettings = async () => {
    const settings = await Settings.findOne();
    if (!settings) {
        return await Settings.create({});
    }
    return settings;
};

export const getSettings = async () => {
    try {
        const settings = await ensureSettings();
        return { success: true, data: settings };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

export const updateSettings = async (data) => {
    try {
        const settings = await Settings.findOneAndUpdate({}, data, {
            new: true,
            upsert: true,
        });
        return { success: true, data: settings };
    } catch (error) {
        return { success: false, message: error.message };
    }
};
