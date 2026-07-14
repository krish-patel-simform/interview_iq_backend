import "./config.ts";

import express, { type Request, type Response } from "express";
import AIRouter from "./routes/aiRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use("/api/ai", AIRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express & TypeScript Server!");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
