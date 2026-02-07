import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";


export const handleUserLogout = asyncHandler(async(req:Request,res:Response)=>{
    
    req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }

    res.clearCookie("connect.sid"); 

    return res.json({
      success: true,
      message: "Logged out successfully"
    });
  });
})