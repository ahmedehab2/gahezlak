import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { CurrentUserPayload } from "../common/types/general-types";
import { Errors } from "../errors";
import { Shops } from "../models/Shop";
import { NotAllowedError } from "../errors/not-allowed-error";
import { errMsg } from "../common/err-messages";

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

export const isShopOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId; // Use userId from JWT
    if (!userId) {
      throw new NotAllowedError(errMsg.USER_NOT_AUTHENTICATED, req.lang);
    }
    const shopId = req.params.shopId || req.body.shopId || req.user?.shopId;
    if (!shopId) {
      throw new NotAllowedError(errMsg.SHOP_NOT_FOUND, req.lang);
    }
    const shop = await Shops.findById(shopId);
    if (!shop) {
      throw new NotAllowedError(errMsg.SHOP_NOT_FOUND, req.lang);
    }
    if (shop.ownerId.toString() !== userId.toString()) {
      throw new NotAllowedError(errMsg.NOT_ALLOWED_ACTION, req.lang);
    }
    next();
  } catch (err) {
    next(err);
  }
};
