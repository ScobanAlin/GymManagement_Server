import "dotenv/config";
import { createTables } from "./db";
import express from "express";
import cors from "cors";

import loginRoutes from "./routes/loginRoutes";
import registerRoutes from "./routes/registerRoutes";
import userRoutes from "./routes/userRoutes";
import gymRoutes from "./routes/gymRoutes";
import groupRoutes from "./routes/groupRoutes";
import classRoutes from "./routes/classRoutes";
import studentRoutes from "./routes/studentRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import reportRoutes from "./routes/reportRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import subscriptionTypeRoutes from "./routes/subscriptionTypeRoutes";
import emailRoutes from "./routes/emailRoutes";
import populateDatabase from "./population-scripts";
import { populate } from "dotenv";




const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:3000"]
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



app.use(express.json());
const PORT = Number(process.env.PORT) || 4000;

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", loginRoutes);
app.use("/api", registerRoutes);
app.use("/api", userRoutes);
app.use("/api", gymRoutes);
app.use("/api", groupRoutes);
app.use("/api", classRoutes);
app.use("/api", studentRoutes);
app.use("/api", paymentRoutes);
app.use("/api", notificationRoutes);
app.use("/api", reportRoutes);
app.use("/api", attendanceRoutes);
app.use("/api", subscriptionTypeRoutes);
app.use("/api", emailRoutes);
createTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to initialize database tables:", err);
    process.exit(1);
  });


export default app;