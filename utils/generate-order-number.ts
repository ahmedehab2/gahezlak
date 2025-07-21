import { Counters } from "../models/Counter";

export const generateOrderNumber = async (shopId: string): Promise<number> => {
  // Get sequence number for this shop
  const result = await Counters.findOneAndUpdate(
    { _id: `order_seq_${shopId}` },
    { $inc: { sequence_value: 1 } },
    {
      upsert: true,
      new: true,
    }
  );

  // Use last 3 digits of shop's MongoDB ID as shop number
  const shopNumber = (parseInt(shopId.slice(-3), 16) % 900) + 100;
  console.log(shopNumber);

  return shopNumber * 1000 + result?.sequence_value || 1;
};
