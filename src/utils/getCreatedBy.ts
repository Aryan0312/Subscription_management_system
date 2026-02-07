import { ApiError } from "../utils/apiError.js";

export const getCreatedBy = (req: any) => {
  const user = req.session?.user;

  if (!user || !user.admin_id) {
    throw new ApiError(401, "Session expired or unauthorized");
  }

  return user.admin_id;
};
