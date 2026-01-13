import * as userService from "../services/user.service.js";
import successResponse from "../utils/successResponse.js";

export const getMe = async (req, res, next) => {
    try {
        const result = await userService.getMeService(req.user._id);
        if (!result.success) return res.status(result.statusCode).json(result);
        return successResponse(res, 200, result.data, "User profile retrieved successfully");
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const result = await userService.updateProfileService(req.user._id, req.body);
        if (!result.success) return res.status(result.statusCode).json(result);
        return successResponse(res, 200, result.data, "Profile updated successfully");
    } catch (err) {
        next(err);
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const result = await userService.getAllUsersService({ 
            page: Number(page), 
            limit: Number(limit), 
            search 
        });
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const result = await userService.updateUserService(req.params.id, req.body);
        if (!result.success) return res.status(result.statusCode).json(result);
        return successResponse(res, 200, result.data, "User details updated successfully");
    } catch (err) {
        next(err);
    }
};

export const createUser = async (req, res, next) => {
    try {
        const result = await userService.createUserService(req.body);
        if (!result.success) return res.status(result.statusCode).json(result);
        return successResponse(res, 201, result.data, "User created successfully");
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const result = await userService.deleteUserService(req.params.id);
        if (!result.success) return res.status(result.statusCode).json(result);
        return successResponse(res, 200, null, "User deleted successfully");
    } catch (err) {
        next(err);
    }
};

export const getUserStats = async (req, res, next) => {
    try {
        const result = await userService.getUserStatsService();
        return successResponse(res, 200, result.data, "User statistics retrieved successfully");
    } catch (err) {
        next(err);
    }
};

export const guestLogin = async (req, res, next) => {
    try {
        const user = await userService.createGuestUser();
        return successResponse(res, 200, { user }, "Guest session initiated successfully");
    } catch (error) {
        next(error);
    }
};

export const getSingleUserDetails = async (req, res, next) => {
    try {
        const result = await userService.getSingleUserDetailsService(req.params.id);
        
        if (!result.success) {
            return res.status(result.statusCode).json(result);
        }

        return successResponse(res, 200, result.data, "User full details retrieved successfully");
    } catch (err) {
        next(err);
    }
};