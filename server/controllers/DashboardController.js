import { PrismaClient } from "@prisma/client";

export const getSellerData = async (req, res, next) => {
    try {
        if (req.userId) {
            const prisma = new PrismaClient();
            const parsedUserId = parseInt(req.userId);
            const gigs = await prisma.gigs.count({ where: { userId: parsedUserId } });
            const {
                _count: { id: orders },
            } = await prisma.orders.aggregate({
                where: {
                    isCompleted: true,
                    gig: {
                        createdBy: {
                            id: parsedUserId,
                        },
                    },
                },
                _count: {
                    id: true,
                },
            });
            const unreadMessages = await prisma.message.count({
                where: {
                    recipientId: parsedUserId,
                    isRead: false,
                },
            });

            const today = new Date();
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const thisYear = new Date(today.getFullYear(), 0, 1);

            const {
                _sum: { price: revenue },
            } = await prisma.orders.aggregate({
                where: {
                    gig: {
                        createdBy: {
                            id: parsedUserId,
                        },
                    },
                    isCompleted: true,
                    createdAt: {
                        gte: thisYear,
                    },
                },
                _sum: {
                    price: true,
                },
            });

            const {
                _sum: { price: dailyRevenue },
            } = await prisma.orders.aggregate({
                where: {
                    gig: {
                        createdBy: {
                            id: parsedUserId,
                        },
                    },
                    isCompleted: true,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
                _sum: {
                    price: true,
                },
            });

            const {
                _sum: { price: monthlyRevenue },
            } = await prisma.orders.aggregate({
                where: {
                    gig: {
                        createdBy: {
                            id: parsedUserId,
                        },
                    },
                    isCompleted: true,
                    createdAt: {
                        gte: thisMonth,
                    },
                },
                _sum: {
                    price: true,
                },
            });
            return res.status(200).json({
                dashboardData: {
                    orders,
                    gigs,
                    unreadMessages,
                    dailyRevenue: dailyRevenue || 0,
                    monthlyRevenue: monthlyRevenue || 0,
                    revenue: revenue || 0,
                },
            });
        }
        return res.status(400).send("User id is required.");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};