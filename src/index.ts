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
import populateDatabase from "./population-scripts";
import { populate } from "dotenv";




const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



app.use(express.json());
const PORT = Number(process.env.PORT) || 4000;

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