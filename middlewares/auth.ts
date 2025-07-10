import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
       res.status(401).json({ message: "Not Authenticated" });
       return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "")

    req.user = decoded;
    next();
  } catch (error) {
     res.status(401).json({ message: "Not Authenticated" });
     return
  }
};

export const isAllowed = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
       res.status(403).json({ message: "Not allowed" });
       return
    }
    next();
  };
};
