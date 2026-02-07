import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getSession } from "../../service/authService.js";
import { ApiError } from "../../utils/apiError.js";

// need to understand and change this 

export const getUserDetails = asyncHandler(
  async (req: Request, res: Response) => {

    const user = getSession(req);

    if (!user) {
      throw new ApiError(401, "User is not authorized, login again!");
    }

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully!",
      data: {
        user_id: user.user_id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        role: user.role, 
      }
    });
  }
);
