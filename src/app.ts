import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./presentation/routes/auth.routes";
import { errorHandler } from "./presentation/middlewares/error.middleware";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "User Management API is running",
  });
});

app.use(errorHandler);

export default app;