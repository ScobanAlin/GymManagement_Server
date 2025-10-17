import "dotenv/config";
import { createTables } from "./db";
import express from "express";
import cors from "cors";

import helloRoutes from "./routes/helloRoutes"

const app = express();
app.use(cors());
app.use(express.json());
const PORT = Number(process.env.PORT) || 3000;

app.use("/api", helloRoutes);

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