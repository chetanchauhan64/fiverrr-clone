import { prisma } from "../utils/prisma.js";
import ExcelJS from "exceljs";
import json2xls from "json2xls";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).send("User deleted successfully.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    return res.status(200).send("User status updated successfully.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getAllGigs = async (req, res, next) => {
  try {
    const gigs = await prisma.gigs.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
    });
    return res.status(200).json({ gigs });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const deleteGig = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.gigs.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).send("Gig deleted successfully.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalGigs = await prisma.gigs.count();
    const totalOrders = await prisma.orders.count();
    const revenue = await prisma.orders.aggregate({
      where: { isCompleted: true },
      _sum: { price: true },
    });

    const recentOrders = await prisma.orders.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { username: true } },
        gig: { select: { title: true } },
      },
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalGigs,
        totalOrders,
        revenue: revenue._sum.price || 0,
      },
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await prisma.orders.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        buyer: {
          select: {
            username: true,
            email: true,
          },
        },
        gig: {
          select: {
            title: true,
            category: true,
          },
        },
      },
    });
    return res.status(200).json({ orders });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.orders.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).send("Order deleted successfully.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getAdminReports = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.orders.count({ where: { isCompleted: true } });
    const totalRevenue = await prisma.orders.aggregate({
      where: { isCompleted: true },
      _sum: { price: true },
    });

    // Orders by category
    const ordersByCategory = await prisma.orders.findMany({
      where: { isCompleted: true },
      include: { gig: { select: { category: true } } },
    });

    const categoryStats = ordersByCategory.reduce((acc, order) => {
      const cat = order.gig.category;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      reports: {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue._sum.price || 0,
        categoryStats,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};


export const exportData = async (req, res) => {
  try {
    const [users, gigs, orders] = await Promise.all([
      prisma.user.findMany(),
      prisma.gigs.findMany(),
      prisma.orders.findMany({
        include: {
          buyer: { select: { username: true } },
          gig: { select: { title: true } },
        },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();

    // Users Sheet
    const userSheet = workbook.addWorksheet("Users");
    userSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Username", key: "username", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 15 },
      { header: "Created At", key: "createdAt", width: 25 },
    ];
    users.forEach((user) => userSheet.addRow(user));

    // Gigs Sheet
    const gigSheet = workbook.addWorksheet("Gigs");
    gigSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Title", key: "title", width: 40 },
      { header: "Category", key: "category", width: 20 },
      { header: "Price", key: "price", width: 10 },
      { header: "Created At", key: "createdAt", width: 25 },
    ];
    gigs.forEach((gig) => gigSheet.addRow(gig));

    // Orders Sheet
    const orderSheet = workbook.addWorksheet("Orders");
    orderSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Buyer", key: "buyer", width: 20 },
      { header: "Gig", key: "gig", width: 40 },
      { header: "Price", key: "price", width: 10 },
      { header: "Status", key: "status", width: 15 },
      { header: "Created At", key: "createdAt", width: 25 },
    ];
    orders.forEach((order) =>
      orderSheet.addRow({
        id: order.id,
        buyer: order.buyer?.username || "Unknown",
        gig: order.gig?.title || "Unknown",
        price: order.price,
        status: order.isCompleted ? "Completed" : "Pending",
        createdAt: order.createdAt,
      })
    );

    res.status(200);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Fiverr_Data_Export.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Error:", err);
    if (!res.headersSent) {
      return res.status(500).send("Internal Server Error during export");
    }
  }
};




export const getRevenueStats = async (req, res, next) => {
  try {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    const stats = await Promise.all(
      last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dailyRevenue = await prisma.orders.aggregate({
          where: {
            isCompleted: true,
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
          _sum: { price: true },
        });

        return {
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          revenue: dailyRevenue._sum.price || 0,
        };
      })
    );

    return res.status(200).json({ revenueStats: stats });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
}
