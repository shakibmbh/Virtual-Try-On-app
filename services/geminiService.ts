import { GoogleGenAI, Modality } from "@google/genai";

export const performVirtualTryOn = async (
  personImageBase64: string,
  clothingImageBase64: string,
  personMimeType: string,
  clothingMimeType: string
): Promise<{ imageBase64: string | null; text: string | null }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
Objective: Transfer the garment from Image 2 onto the person in Image 1.

Input Image 1: Person photo (the model).
Input Image 2: Garment photo (standalone clothing or clothing worn by someone else).

Instructions:

Detect the garment in Image 2 and replicate it exactly — preserve shape, fabric, color, patterns, and textures.

Overlay this garment onto the person in Image 1, replacing their original clothing.

Ensure the garment naturally fits the body, pose, and proportions of the person.

Match lighting, shading, and perspective so the garment blends seamlessly into Image 1.

Hard Constraints (Do Not Break):

Keep the person’s face, hair, skin, body shape, and pose unchanged.

Keep the background of Image 1 unchanged.

Do not modify or add extra details to the garment — replicate exactly what appears in Image 2.

Do not output anything except the final edited image.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: personImageBase64,
            mimeType: personMimeType,
          },
        },
        {
          inlineData: {
            data: clothingImageBase64,
            mimeType: clothingMimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let imageBase64: string | null = null;
  let text: string | null = null;

  if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
        } else if (part.text) {
          text = part.text;
        }
      }
  }

  return { imageBase64, text };
};

export const refineImage = async (
  imageBase64: string,
  mimeType: string,
  userPrompt: string
): Promise<{ imageBase64: string | null; text: string | null }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Your task is to edit the provided image based on the user's instruction.
  - Apply the user's request precisely.
  - Only change what is requested. Preserve all other aspects of the image, including the person, background, and unmodified parts of the clothing.
  - Output ONLY the final, edited image. Do not include any text.

  User instruction: "${userPrompt}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let newImageBase64: string | null = null;
  let text: string | null = null;

  if (response.candidates && response.candidates.length > 0) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        newImageBase64 = part.inlineData.data;
      } else if (part.text) {
        text = part.text;
      }
    }
  }

  return { imageBase64: newImageBase64, text };
};
