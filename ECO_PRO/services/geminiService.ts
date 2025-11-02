
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  console.warn(
    "API_KEY environment variable not set. AI features will not work."
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const editImageWithGemini = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
    }

    throw new Error("No image was generated in the response.");
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw new Error("Failed to edit image. Please check the console for details.");
  }
};
