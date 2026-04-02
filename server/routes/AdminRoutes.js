import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
  getAllUsers,
  deleteUser,
  updateStatus,
  getAllGigs,
  deleteGig,
  getAdminStats,
  getAllOrders,
  deleteOrder,
  getAdminReports,
  exportData,
  getRevenueStats,
} from "../controllers/AdminControllers.js";

const adminRoutes = Router();

adminRoutes.get("/stats", verifyToken, adminMiddleware, getAdminStats);
adminRoutes.get("/users", verifyToken, adminMiddleware, getAllUsers);
adminRoutes.delete("/user/:id", verifyToken, adminMiddleware, deleteUser);
adminRoutes.put("/user/status/:id", verifyToken, adminMiddleware, updateStatus);
adminRoutes.get("/gigs", verifyToken, adminMiddleware, getAllGigs);
adminRoutes.delete("/gig/:id", verifyToken, adminMiddleware, deleteGig);
adminRoutes.get("/orders", verifyToken, adminMiddleware, getAllOrders);
adminRoutes.delete("/order/:id", verifyToken, adminMiddleware, deleteOrder);
adminRoutes.get("/reports", verifyToken, adminMiddleware, getAdminReports);
adminRoutes.get("/export", verifyToken, adminMiddleware, exportData);
adminRoutes.get("/revenue-stats", verifyToken, adminMiddleware, getRevenueStats);

export default adminRoutes;
