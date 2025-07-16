import axios from 'axios';

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
const IMGBB_API_KEY = process.env.IMGBB_API_KEY; 

export async function uploadImageToImgBB(imageBuffer: Buffer): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error('IMG_BB_API_KEY is not configured');
  }

  try {
    const formData = new FormData();
    formData.append('image', imageBuffer.toString('base64'));

    const response = await axios.post(
      `${IMGBB_API_URL}?key=${IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data.url; 
  } catch (error) {
    throw new Error('Failed to upload image to ImgBB');
  }
}