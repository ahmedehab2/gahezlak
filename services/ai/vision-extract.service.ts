import { Buffer } from "buffer";
import { pdf } from "pdf-to-img";
import { getOpenAIClient } from "../../config/openai";
import sharp from "sharp";

export interface MenuExtractionOptions {
  languageHint?: string;
  categoryHint?: string;
}

export interface ExtractedMenuItem {
  category?: string;
  name: string;
  description?: string;
  price?: number;
}

export interface MenuExtractionResult {
  items: ExtractedMenuItem[];
  errors: string[];
  warnings: string[];
}

// Convert PDF buffer to images
async function pdfToImages(
  pdfBuffer: Buffer,
  maxPages: number = 5
): Promise<Buffer[]> {
  const imageBuffers: Buffer[] = [];
  const document = await pdf(pdfBuffer, { scale: 2 });

  let count = 0;
  for await (const page of document) {
    imageBuffers.push(Buffer.from(page));
    if (++count >= maxPages) break;
  }

  return imageBuffers;
}

// Optimize image size and format
async function optimizeImageBuffer(
  img: Buffer,
  mimetype: string
): Promise<Buffer> {
  const image = sharp(img);
  const metadata = await image.metadata();

  if (
    (metadata.width && metadata.width > 1024) ||
    (metadata.height && metadata.height > 1024)
  ) {
    image.resize({
      width: 1024,
      height: 1024,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
    return await image.jpeg({ quality: 80 }).toBuffer();
  } else if (mimetype === "image/png") {
    return await image.png({ compressionLevel: 8 }).toBuffer();
  } else {
    return await image.toBuffer();
  }
}

// Extract items using OpenAI Vision
async function extractMenuFromImageWithAI(
  img: Buffer,
  options: MenuExtractionOptions = {},
  mimetype?: string
): Promise<ExtractedMenuItem[]> {
  const openai = getOpenAIClient();

  let prompt = `You are an expert at reading restaurant menus.\n`;
  prompt += `Given the attached image of a menu, extract all menu items and return them as a JSON array.\n`;
  prompt += `Each item should have: category (if found), name, description (if found), and price (as a number, if found).\n`;
  prompt += `Ignore any non-menu text.\n`;
  if (options.languageHint) {
    prompt += `The menu is in ${options.languageHint}.\n`;
  }
  if (options.categoryHint) {
    prompt += `Focus on the category: ${options.categoryHint}.\n`;
  }
  prompt += `Example output:\n`;
  prompt += `[{"category":"Appetizers","name":"Spring Rolls","description":"Crispy rolls with vegetables.","price":30},{"category":"Main Courses","name":"Grilled Chicken","description":"Served with rice and salad.","price":80}]`;

  const mime =
    mimetype === "image/jpeg" || mimetype === "image/jpg"
      ? "image/jpeg"
      : "image/png";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    temperature: 0.2,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Here is the menu image." },
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${img.toString("base64")}`,
            },
          },
        ],
      },
    ],
  });

  try {
    const content = response.choices[0].message.content || "";
    const jsonMatch =
      content.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ||
      content.match(/(\[\s*{[\s\S]*?}\s*])/);
    if (!jsonMatch) throw new Error("No JSON array found in AI response.");
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed))
      throw new Error("Parsed result is not an array.");
    return parsed;
  } catch (err) {
    throw new Error("Failed to parse AI response: " + (err as Error).message);
  }
}

// Main function
export async function extractMenuFromFile(
  fileBuffer: Buffer,
  fileType: string,
  options: MenuExtractionOptions = {}
): Promise<MenuExtractionResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let items: ExtractedMenuItem[] = [];

  if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
    errors.push(
      "Unsupported file type. Only images (JPG, PNG) and PDFs are allowed."
    );
    return { items, errors, warnings };
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    errors.push("No file provided or file is empty.");
    return { items, errors, warnings };
  }

  let imageBuffers: Buffer[] = [];
  let imageMimeType = fileType;

  if (fileType === "application/pdf") {
    imageMimeType = "image/png";
    try {
      imageBuffers = await pdfToImages(fileBuffer, 5);
      if (imageBuffers.length === 0) {
        errors.push("No images could be extracted from the PDF.");
        return { items, errors, warnings };
      }
      if (imageBuffers.length < 5) {
        warnings.push(`Processed ${imageBuffers.length} page(s) from the PDF.`);
      }
    } catch (err) {
      errors.push("Failed to convert PDF to images: " + (err as Error).message);
      return { items, errors, warnings };
    }
  } else {
    imageBuffers = [fileBuffer];
  }

  for (const img of imageBuffers) {
    try {
      const optimizedImg = await optimizeImageBuffer(img, imageMimeType);
      const aiItems = await extractMenuFromImageWithAI(
        optimizedImg,
        options,
        imageMimeType
      );
      if (aiItems.length === 0) {
        warnings.push("No menu items found in one of the images/pages.");
      }
      items.push(...aiItems);
    } catch (err) {
      warnings.push(
        "AI extraction failed for one image/page: " + (err as Error).message
      );
    }
  }

  return { items, errors, warnings };
}
