import Banner from "../models/banner.model.js";
import fs from "fs";

export const createBannerService = async (data, file) => {
    const { title, link, order, status } = data;

    if (!title) return { success: false, message: "Banner title is required" };
    if (!file) return { success: false, message: "Banner image is required" };

    const newBanner = await Banner.create({
        title,
        link: link || "/",
        order: Number(order) || 0,
        status: status || "Active",
        isActive: status === "Active",
        image: { url: file.path, public_id: file.filename },
    });

    return { success: true, data: newBanner };
};

export const getAllBannersService = async () => {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    return { success: true, data: banners };
};

export const getAdminBannersService = async ({ page, limit, search }) => {
    const query = search ? { title: { $regex: search, $options: "i" } } : {};

    const total = await Banner.countDocuments(query);
    const banners = await Banner.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    return {
        success: true,
        data: {
            banners,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        }
    };
};

export const getBannerStatsService = async () => {
    const total = await Banner.countDocuments();
    const active = await Banner.countDocuments({ status: "Active" });
    const inactive = await Banner.countDocuments({ status: "Inactive" });

    return {
        success: true,
        data: { total, active, inactive }
    };
};

export const updateBannerService = async (id, data, file) => {
    const banner = await Banner.findById(id);
    if (!banner) return { success: false, message: "Banner not found" };

    const updateData = {
        title: data.title,
        link: data.link,
        order: data.order !== undefined ? Number(data.order) : banner.order,
        status: data.status,
        isActive: data.status === "Active"
    };

    if (file) {
        // Purani image delete karna
        if (banner.image?.url && fs.existsSync(banner.image.url)) {
            try { fs.unlinkSync(banner.image.url); } catch (e) { console.error("File error"); }
        }
        updateData.image = { url: file.path, public_id: file.filename };
    }

    const updated = await Banner.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    return { success: true, data: updated };
};

export const deleteBannerService = async (id) => {
    const banner = await Banner.findById(id);
    if (!banner) return { success: false, message: "Banner not found" };

    if (banner.image?.url && fs.existsSync(banner.image.url)) {
        try { fs.unlinkSync(banner.image.url); } catch (e) { }
    }

    await banner.deleteOne();
    return { success: true, message: "Banner deleted successfully" };
};