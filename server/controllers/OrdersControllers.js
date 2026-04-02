import { prisma } from "../utils/prisma.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createOrder = async (req, res, next) => {
  try {
    if (req.body.gigId) {
      const { gigId } = req.body;
      const gig = await prisma.gigs.findUnique({
        where: { id: parseInt(gigId) },
      });

      if (!gig) {
        return res.status(404).send("Gig not found.");
      }

      if (gig.userId === req.userId) {
        return res.status(403).send("You cannot purchase your own gig.");
      }

      // Calculate total price: Subtotal + 15% Service Fee + 18% GST on (Subtotal + Service Fee)
      const subtotal = gig.price;
      let serviceFee = parseFloat((subtotal * 0.15).toFixed(2));
      let gst = parseFloat(((subtotal + serviceFee) * 0.18).toFixed(2));
      let total = parseFloat((subtotal + serviceFee + gst).toFixed(2));
      
      // Stripe amount must be in paisa for INR. Minimum is 50 cents (approx ₹42)
      if (total < 42) {
        // Adjust total to 42 and shift the difference to serviceFee
        const originalTotal = total;
        total = 42;
        serviceFee = parseFloat((serviceFee + (total - originalTotal)).toFixed(2));
      }

      const amountInPaisa = Math.round(total * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPaisa,
        currency: "inr",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      await prisma.orders.create({
        data: {
          paymentIntent: paymentIntent.id,
          price: Math.round(total),
          buyer: { connect: { id: parseInt(req?.userId) } },
          gig: { connect: { id: parseInt(gig?.id) } },
        },
      });

      res.status(200).send({
        clientSecret: paymentIntent.client_secret,
        gig,
        total,
        serviceFee,
      });
    } else {
      res.status(400).send("Gig id is required.");
    }
  } catch (err) {
    console.error("Error creating order:", err);
    return res.status(500).send("Internal Server Error");
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    if (req.body.paymentIntent) {
      console.log("Confirming order for PI:", req.body.paymentIntent);
      const paymentIntent = await stripe.paymentIntents.retrieve(req.body.paymentIntent);
      console.log("Stripe PI Status:", paymentIntent.status);
      
      if (paymentIntent.status === "succeeded") {
        const order = await prisma.orders.findUnique({
          where: { paymentIntent: req.body.paymentIntent }
        });

        if (!order) {
          console.error("Order not found in DB for PI:", req.body.paymentIntent);
          return res.status(404).send("Order record not found.");
        }

        await prisma.orders.update({
          where: { paymentIntent: req.body.paymentIntent },
          data: { isCompleted: true },
        });
        return res.status(200).send("Order confirmed.");
      } else {
        return res.status(400).send(`Payment not successful. Status: ${paymentIntent.status}`);
      }
    }
    return res.status(400).send("Payment intent ID is required.");
  } catch (err) {
    console.error("Error in confirmOrder:", err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getBuyerOrders = async (req, res, next) => {
  try {
    if (req.userId) {
      const orders = await prisma.orders.findMany({
        where: { buyerId: parseInt(req.userId), isCompleted: true },
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