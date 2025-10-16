import "dotenv/config";
import express from "express";

import helloRoutes from "./routes/helloRoutes"

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use("/api", helloRoutes);

app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });

export default app;