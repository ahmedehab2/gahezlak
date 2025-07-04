import { CreateOrder,UpdateOrderStatus,CancelledOrder,GetOrdersByShop } from "../services/order.service";
import { NextFunction, Request, Response } from "express";
import {io} from '../../sockets/socketServer';

export const CreateOrderController=async(req:Request,res:Response,next:NextFunction)=>{
    try{
       const orderData=req.body;
       const newOrder=await CreateOrder(orderData);
       io.emit("newOrder",newOrder);
       res.status(201).json({
              success:true,
              message:"Order created successfully",
              data:newOrder
       });
    }
    catch(error){
        next(error);
    }
}

export const UpdateOrderStatusController=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const orderId=req.params.id;
        const {status}=req.body;
        const updatedOrderStatus=await UpdateOrderStatus(orderId,status);
        io.emit("orderStatusUpdated",updatedOrderStatus);
        res.status(200).json({
            success:true,
            message:"Order status updated successfully",
            data:updatedOrderStatus
        });
    }
    catch(error){
        next(error);
    }
}

export const CancelledOrderController=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const orderId=req.params.id;
        const {status}=req.body;
        const cancelledOrder=await CancelledOrder(orderId,status);
        io.emit("orderCancelled",cancelledOrder);
        res.status(200).json({
            success:true,
            message:"Order cancelled successfully",
            data:cancelledOrder
        });
    }
    catch(error){
        next(error);
    }
}

export const GetOrdersByShopController=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const shopId=req.params.shopId;
        const {orders,totalCount}=await GetOrdersByShop(shopId);
        res.status(200).json({
            success:true,
            message:"Orders retrieved successfully",
            data:{orders, totalCount}
        });
    }
    catch(error){
        next(error);
    }
}