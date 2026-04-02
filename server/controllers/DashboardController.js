import { prisma } from "../utils/prisma.js";

export const getSellerData = async (req, res, next) => {
    try {
        if (req.userId) {
            const parsedUserId = parseInt(req.userId);
            
            const today = new Date();
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const thisYear = new Date(today.getFullYear(), 0, 1);
            const dailyStart = new Date(new Date().setHours(0, 0, 0, 0));

            // Run database queries concurrently to optimize performance
            const [
                gigsCount, 
                ordersCount, 
                unreadMessagesCount, 
                revenueAgg, 
                dailyRevenueAgg, 
                monthlyRevenueAgg
            ] = await Promise.all([
                prisma.gigs.count({ where: { userId: parsedUserId } }),
                prisma.orders.count({
                    where: {
                        isCompleted: true,
                        gig: { createdBy: { id: parsedUserId } },
                    },
                }),
                prisma.message.count({
                    where: {
                        recipientId: parsedUserId,
                        isRead: false,
                    },
                }),
                prisma.orders.aggregate({
                    where: {
                        gig: { createdBy: { id: parsedUserId } },
                        isCompleted: true,
                        createdAt: { gte: thisYear },
                    },
                    _sum: { price: true },
                }),
                prisma.orders.aggregate({
                    where: {
                        gig: { createdBy: { id: parsedUserId } },
                        isCompleted: true,
                        createdAt: { gte: dailyStart },
                    },
                    _sum: { price: true },
                }),
                prisma.orders.aggregate({
                    where: {
                        gig: { createdBy: { id: parsedUserId } },
                        isCompleted: true,
                        createdAt: { gte: thisMonth },
                    },
                    _sum: { price: true },
                }),
            ]);

            // Nest results under dashboardData to match frontend's expected format
            return res.status(200).json({
                dashboardData: {
                    gigs: gigsCount,
                    orders: ordersCount,
                    unreadMessages: unreadMessagesCount,
                    revenue: revenueAgg._sum.price || 0,
                    dailyRevenue: dailyRevenueAgg._sum.price || 0,
                    monthlyRevenue: monthlyRevenueAgg._sum.price || 0,
                }
            });
        }
        return res.status(400).send("User id is required.");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};