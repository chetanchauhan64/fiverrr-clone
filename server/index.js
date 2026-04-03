import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/Authroutes.js";
import cookieParser from "cookie-parser";
import { gigRoutes } from "./routes/GigRoutes.js";
import { orderRoutes } from "./routes/OrderRoutes.js";
import { messageRoutes } from "./routes/MessageRoutes.js";
import { dashboardRoutes } from "./routes/DashboardRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js";
import https from "https";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(
  cors({
    origin: process.env.ORIGIN.split(",").map((o) => o.trim().replace(/"/g, "")),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use("/uploads", express.static("uploads"));
app.use("/uploads/profiles", express.static("uploads/profiles"));

app.use(cookieParser());
app.use(express.json());

// Root route — friendly message when opening backend URL in browser
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Fiverr Clone API",
    status: "running",
    message: "Backend is live! Use the frontend at https://fiverrr-clone.vercel.app",
    health: "/health",
  });
});

// Health check endpoint — used by keep-alive ping and uptime monitors
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);

  // Self-ping every 10 minutes to prevent Render free tier cold starts
  if (process.env.PUBLIC_URL) {
    setInterval(() => {
      const url = `${process.env.PUBLIC_URL}/health`;
      https.get(url, (res) => {
        console.log(`[keep-alive] Pinged ${url} — status: ${res.statusCode}`);
      }).on("error", (err) => {
        console.warn(`[keep-alive] Ping failed: ${err.message}`);
      });
    }, 10 * 60 * 1000); // every 10 minutes
  }
});