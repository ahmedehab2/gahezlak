import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { CurrentUserPayload } from "../common/types/general-types";
import { Errors } from "../errors";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Not Authenticated" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || ""
    ) as CurrentUserPayload;

    req.user = decoded;
    next();
  } catch (error) {
    throw new Errors.UnauthenticatedError();
  }
};

export const isAllowed = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      throw new Errors.UnauthorizedError();
    }
    next();
  };
};
