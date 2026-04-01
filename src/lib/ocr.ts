import Tesseract from 'tesseract.js';

export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    const result = await Tesseract.recognize(
      base64Image,
      'eng',
      { logger: m => console.log(m) }
    );
    return result.data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}
