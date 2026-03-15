import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createOrder = async (req, res, next) => {
  try {
    if (req.body.gigId) {
      const { gigId } = req.body;
      const prisma = new PrismaClient();
      const gig = await prisma.gigs.findUnique({
        where: { id: parseInt(gigId) },
      });
      const paymentIntent = await stripe.paymentIntents.create({
        amount: gig?.price * 100,
        currency: "usd",
        payment_method_types: ["card"],
      });
      await prisma.orders.create({
        data: {
          paymentIntent: paymentIntent.id,
          price: gig?.price,
          buyer: { connect: { id: req?.userId } },
          gig: { connect: { id: gig?.id } },
        },
      });
      res.status(200).send({
        clientSecret: paymentIntent.client_secret,
      });
    } else {
      res.status(400).send("Gig id is required.");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    if (req.body.paymentIntent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(req.body.paymentIntent);
      if (paymentIntent.status === "succeeded") {
        const prisma = new PrismaClient();
        await prisma.orders.update({
          where: { paymentIntent: req.body.paymentIntent },
          data: { isCompleted: true },
        });
        return res.status(200).send("Order confirmed.");
      } else {
        return res.status(400).send("Payment not successful.");
      }
    }
    return res.status(400).send("Payment intent ID is required.");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getBuyerOrders = async (req, res, next) => {
  try {
    if (req.userId) {
      const prisma = new PrismaClient();
      const orders = await prisma.orders.findMany({
        where: { buyerId: req.userId, isCompleted: true },
        include: { gig: true },
      });
      return res.status(200).json({ orders });
    }
    return res.status(400).send("User id is required.");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getSellerOrders = async (req, res, next) => {
  try {
    if (req.userId) {
      const prisma = new PrismaClient();
      const orders = await prisma.orders.findMany({
        where: {
          gig: {
            createdBy: {
              id: parseInt(req.userId),
            },
          },
          isCompleted: true,
        },
        include: {
          gig: true,
          buyer: true,
        },
      });
      return res.status(200).json({ orders });
    }
    return res.status(400).send("User id is required.");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};