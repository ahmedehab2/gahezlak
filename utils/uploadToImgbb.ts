import { errMsg } from "../common/err-messages";
import { Errors } from "../errors";

async function uploadToImgbb(file: Express.Multer.File): Promise<any> {
  //Todo: Define a proper return type
  const formData = new FormData();

  formData.append("image", file.buffer.toString("base64"));
  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_KEY}`,
    {
      method: "POST",
      body: formData,
    }
  );
  if (!response.ok) {
    throw new Errors.BadRequestError(errMsg.IMAGE_UPLOAD_FAILED);
  }
  const data = await response.json();

  return data;
}
export default uploadToImgbb;
