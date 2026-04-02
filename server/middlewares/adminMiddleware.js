import { prisma } from "../utils/prisma.js";

export const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "You are not authenticated!" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only!" });
    }

    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
