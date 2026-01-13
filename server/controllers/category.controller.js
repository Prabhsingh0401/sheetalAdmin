import * as categoryService from "../services/category.service.js";
import successResponse from "../utils/successResponse.js";
import fs from "fs";

const safeUnlink = (path) => {
    if (path && fs.existsSync(path)) fs.unlinkSync(path);
};

export const createCategory = async (req, res, next) => {
    try {
        const result = await categoryService.createCategoryService(req.body, req.file);
        
        if (!result.success) {
            if (req.file) safeUnlink(req.file.path);
            return res.status(400).json(result);
        }
        
        return successResponse(res, 201, result.data, "Category created successfully");
    } catch (error) {
        if (req.file) safeUnlink(req.file.path);
        next(error);
    }
};

export const getAllCategories = async (req, res, next) => {
    try {
        const result = await categoryService.getAllCategoriesService();
        return successResponse(res, 200, result.data, "Categories retrieved successfully");
    } catch (error) { 
        next(error); 
    }
};

export const getAdminCategories = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const result = await categoryService.getAdminCategoriesService({ 
            page: Number(page), 
            limit: Number(limit), 
            search 
        });
        return successResponse(res, 200, result.data, "Admin categories retrieved successfully");
    } catch (error) { 
        next(error); 
    }
};

export const getCategoryStats = async (req, res, next) => {
    try {
        const result = await categoryService.getCategoryStatsService();
        return successResponse(res, 200, result.data, "Category statistics retrieved successfully");
    } catch (error) { 
        next(error); 
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const result = await categoryService.updateCategoryService(req.params.id, req.body, req.file);
        
        if (!result.success) {
            if (req.file) safeUnlink(req.file.path);
            return res.status(400).json(result);
        }
        
        return successResponse(res, 200, result.data, "Category updated successfully");
    } catch (error) {
        if (req.file) safeUnlink(req.file.path);
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        const result = await categoryService.deleteCategoryService(req.params.id);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        return successResponse(res, 200, null, "Category deleted successfully");
    } catch (error) { 
        next(error); 
    }
};