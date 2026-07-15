import "./config.js";
import express, {} from "express";
import AIRouter from "./routes/aiRoutes.js";
import cors from "cors";
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/api/ai", AIRouter);
app.get("/", (req, res) => {
    res.send("Hello from Express & TypeScript Server!");
});
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map