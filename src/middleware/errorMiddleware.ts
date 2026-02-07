import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("Error caught by Middleware: ", err);

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: err.message || "INTERNAL UNKNOWN SERVER ERROR"
    });
}