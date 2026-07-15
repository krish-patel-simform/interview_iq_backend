import express from "express";
import {
  getAiResponse,
  removeCandaidate,
  setupCandidateInterview,
} from "../controller/aiController.js";

const AIRouter = express.Router();

AIRouter.route("/get-ai-response").post(getAiResponse);
AIRouter.route("/setup-interview").post(setupCandidateInterview);
AIRouter.route("/remove-candidate").post(removeCandaidate);

export default AIRouter;
