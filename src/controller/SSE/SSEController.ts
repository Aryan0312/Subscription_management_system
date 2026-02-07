import { Request, Response } from "express";
import { sseStore } from "../../utils/SSEStore.js";

// need to understand this 
export const adminSSEController = (req: any, res: Response) => {
  const adminId = req.user.admin_id; // from auth middleware

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  sseStore.addClient(adminId, res);

  res.write(`data: ${JSON.stringify({ status: "connected" })}\n\n`);

  req.on("close", () => {
    sseStore.removeClient(adminId);
  });
};
