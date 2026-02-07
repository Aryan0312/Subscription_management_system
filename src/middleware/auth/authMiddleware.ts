import { Request, Response, NextFunction } from "express";

// need to understand this 


export function allowedRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Login to continue!",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorised to access this!",
      });
    }

    next();
  };
}
