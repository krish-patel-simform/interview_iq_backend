import express from "express";
import { getAiResponse } from "../controller/aiController.js";
const AIRouter = express.Router();
AIRouter.route("/get-ai-response").post(getAiResponse);
export default AIRouter;
//# sourceMappingURL=aiRoutes.js.map