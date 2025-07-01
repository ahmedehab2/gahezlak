import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";


export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Not Authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "")

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not Authenticated" });
  }
};

export const isAllowed = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    next();
  };
};
