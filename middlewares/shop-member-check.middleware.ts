import { Request, Response, NextFunction } from "express";
import { NotAllowedError } from "../errors/not-allowed-error";
import { errMsg } from "../common/err-messages";
import { Shops } from "../models/Shop";
import { getUserShop } from "../services/shop.service";

type AccessLevel = "owner" | "member";

export const checkShopAccess = (accessLevel: AccessLevel = "member") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    console.log(req.user);
    console.log("userId", userId);
    const shopId = req.params?.shopId || req.body?.shopId || req.user?.shopId;

    if (!shopId) {
      throw new NotAllowedError(errMsg.SHOP_NOT_FOUND, req.lang);
    }

    if (accessLevel === "owner") {
      // Check if user is the shop owner
      const shop = await Shops.findOne({
        $and: [{ ownerId: userId }, { _id: shopId }],
      }).lean();

      if (!shop) {
        throw new NotAllowedError(errMsg.SHOP_NOT_FOUND, req.lang);
      }
    } else {
      // Check if user is either owner or member
      const shop = await getUserShop(userId!);
      if (!shop) {
        throw new NotAllowedError(errMsg.SHOP_NOT_FOUND, req.lang);
      }
    }

    next();
  };
};

// Export convenience middleware instances for common use cases
export const isShopOwner = checkShopAccess("owner");
export const isShopMember = checkShopAccess("member");
