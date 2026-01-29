import express from "express";
import { getMe, updateProfile, getAllUsers, deleteUser, updateUser, createUser, guestLogin, getUserStats, getSingleUserDetails, toggleWishlist, getWishlist } from "../controllers/user.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
import { uploadTo } from "../middlewares/multer.middleware.js"; // Import uploadTo

const router = express.Router();

// public guest login route
router.post("/guest-login", guestLogin);

// protected routes
router.get("/me", isAuthenticated, getMe);
router.put("/update", isAuthenticated, uploadTo('users').single('profilePicture'), updateProfile); // Added multer middleware
router.post("/wishlist", isAuthenticated, toggleWishlist);
router.get("/wishlist", isAuthenticated, getWishlist);

// admin routes
router.get("/admin/all", isAuthenticated, isAdmin, getAllUsers);
router.post("/admin", isAuthenticated, isAdmin, createUser);
router.get("/admin/stats", isAuthenticated, isAdmin, getUserStats);
router.route("/admin/:id")
    .get(isAuthenticated, isAdmin, getSingleUserDetails)
    .put(isAuthenticated, isAdmin, updateUser)
    .delete(isAuthenticated, isAdmin, deleteUser);

export default router;