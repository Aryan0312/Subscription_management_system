import "express-session";
import { Request } from "express";

// need to understand this 


declare module "express-session" {
  export interface SessionData {
    user?: {
      user_id: number;
      email: string;
      fname: string;
      lname: string;
      role: string; // 👈 SINGLE ROLE
    };
  }
}

interface SessionUser {
  user_id: number;
  email: string;
  fname: string;
  lname: string;
  role: string;
}

export function createSession(user: SessionUser, req: Request) {
  req.session.user = {
    user_id: user.user_id,
    email: user.email,
    fname: user.fname,
    lname: user.lname,
    role: user.role,
  };
}

export function getSession(req: Request) {
  return req.session.user ?? null;
}
