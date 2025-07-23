import { Buffer } from "buffer";
import { PdfConverter } from "pdf-poppler";
import { getOpenAIClient, AI_CONFIG } from "../../config/openai";
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

/**
 * Convert a PDF buffer to an array of image buffers (maxPages).
 * Uses pdf-poppler to convert each page to a PNG buffer.
 */
async function pdfToImages(
  pdfBuffer: Buffer,
  maxPages: number = 5
): Promise<Buffer[]> {
  const fs = await import("fs/promises");
  const os = await import("os");
  const path = await import("path");
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf2img-"));
  const pdfPath = path.join(tmpDir, "input.pdf");
  await fs.writeFile(pdfPath, pdfBuffer);
  const converter = new PdfConverter(pdfPath);
  const imageBuffers: Buffer[] = [];
  try {
    const info = await converter.info();
    const pageCount = Math.min(info.pages, maxPages);
    for (let i = 1; i <= pageCount; i++) {
      const outputPath = path.join(tmpDir, `page-${i}.png`);
      await converter.convertPage(i, {
        format: "png",
        out_dir: tmpDir,
        out_prefix: `page-${i}`,
        page: i,
        scale: 2,
      });
      const imgBuf = await fs.readFile(outputPath);
      imageBuffers.push(imgBuf);
    }
  } finally {
    // Clean up temp files
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
  return imageBuffers;
}

/**
 * Resize and compress an image buffer to a max of 1024x1024px (preserve aspect ratio).
 * Returns the optimized image buffer (same format as input).
 */
async function optimizeImageBuffer(
  img: Buffer,
  mimetype: string
): Promise<Buffer> {
  const image = sharp(img);
  const metadata = await image.metadata();
  // Only resize if larger than 1024px in any dimension
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
  // Compress (for JPEG)
  if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
    return await image.jpeg({ quality: 80 }).toBuffer();
  } else if (mimetype === "image/png") {
    return await image.png({ compressionLevel: 8 }).toBuffer();
  } else {
    // Default: just return the (possibly resized) buffer
    return await image.toBuffer();
  }
}

/**
 * Send an image buffer to OpenAI GPT-4 Vision with a menu extraction prompt.
 * Returns an array of ExtractedMenuItem or throws on error.
 */
async function extractMenuFromImageWithAI(
  img: Buffer,
  options: MenuExtractionOptions = {},
  mimetype?: string
): Promise<ExtractedMenuItem[]> {
  const openai = getOpenAIClient();
  // Build the prompt
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
  prompt += `[
  { "category": "Appetizers", "name": "Spring Rolls", "description": "Crispy rolls with vegetables.", "price": 30 },
  { "category": "Main Courses", "name": "Grilled Chicken", "description": "Served with rice and salad.", "price": 80 }
]`;

  // Detect mimetype for data URL
  let mime = "image/png";
  if (mimetype && (mimetype === "image/jpeg" || mimetype === "image/jpg")) {
    mime = "image/jpeg";
  }

  // Call OpenAI GPT-4 Vision
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    temperature: 0.2,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${img.toString("base64")}` },
          },
        ],
      },
    ],
  });

  // Parse the response
  let items: ExtractedMenuItem[] = [];
  try {
    const content = response.choices[0].message.content || "";
    // Find the first JSON array in the response
    const jsonMatch = content.match(/\[.*\]/s);
    if (!jsonMatch) throw new Error("No JSON array found in AI response.");
    items = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(items))
      throw new Error("AI response is not a JSON array.");
  } catch (err) {
    throw new Error("Failed to parse AI response: " + (err as Error).message);
  }
  return items;
}

/**
 * Extract menu items from an image or PDF using a multimodal AI model (e.g., GPT-4 Vision).
 * Handles images directly; for PDFs, converts up to 5 pages to images.
 * Returns structured menu data and any errors/warnings.
 */
export async function extractMenuFromFile(
  fileBuffer: Buffer,
  fileType: string,
  options: MenuExtractionOptions = {}
): Promise<MenuExtractionResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let items: ExtractedMenuItem[] = [];

  // 1. Validate file type
  if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
    errors.push(
      "Unsupported file type. Only images (JPG, PNG) and PDFs are allowed."
    );
    return { items, errors, warnings };
  }

  // 2. Validate file buffer
  if (!fileBuffer || fileBuffer.length === 0) {
    errors.push("No file provided or file is empty.");
    return { items, errors, warnings };
  }

  // 3. Handle PDF: convert to images (max 5 pages)
  let imageBuffers: Buffer[] = [];
  if (fileType === "application/pdf") {
    try {
      imageBuffers = await pdfToImages(fileBuffer, 5);
      if (imageBuffers.length === 0) {
        errors.push("No images could be extracted from the PDF.");
        return { items, errors, warnings };
      }
      if (imageBuffers.length < 5) {
        warnings.push(
          `Only ${imageBuffers.length} page(s) extracted from PDF.`
        );
      }
    } catch (err) {
      errors.push("Failed to convert PDF to images: " + (err as Error).message);
      return { items, errors, warnings };
    }
  } else {
    // Single image
    imageBuffers = [fileBuffer];
  }

  // 4. For each image, send to AI model with prompt
  for (const img of imageBuffers) {
    try {
      // Optimize image before sending to AI
      const optimizedImg = await optimizeImageBuffer(img, fileType);
      const aiItems = await extractMenuFromImageWithAI(
        optimizedImg,
        options,
        fileType
      );
      if (aiItems.length === 0) {
        warnings.push("No menu items found in one of the images.");
      }
      items.push(...aiItems);
    } catch (err) {
      warnings.push(
        "AI extraction failed for one image: " + (err as Error).message
      );
    }
  }

  // 5. Aggregate and return
  return { items, errors, warnings };
}
