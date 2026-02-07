import { sseStore } from "./SSEStore.js";
import { ApiError } from "../utils/apiError.js";


// need to understand this 


export const sendAdminNotification = (
  adminId: string,
  payload: any
) => {
  const res = sseStore.getClient(adminId);

  // admin not connected
  if (!res) {
    throw new ApiError(404, `Admin ${adminId} not connected to SSE`);
  }

  // SSE connection already closed
  if (res.writableEnded) {
    sseStore.removeClient(adminId);
    throw new ApiError(410, `SSE connection closed for admin ${adminId}`);
  }

  // 🔥 add timestamp
  const dataWithTime = {
    ...payload,
    timestamp: new Date().toISOString(), // standard + frontend-friendly
  };

  try {
    res.write(`data: ${JSON.stringify(dataWithTime)}\n\n`);
  } catch (err) {
    sseStore.removeClient(adminId);
    throw new ApiError(500, "Failed to send SSE notification");
  }
};
