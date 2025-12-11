import { GoogleGenAI, Type } from "@google/genai";
import { BookMetadata } from "../types";

export const getGenAI = async (): Promise<GoogleGenAI | null> => {
  // Use process.env.API_KEY exclusively as per guidelines
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === '') return null;
  return new GoogleGenAI({ apiKey });
};

export const extractMetadata = async (fileName: string): Promise<BookMetadata> => {
  try {
    const ai = await getGenAI();
    
    // Fallback if no API key is configured
    if (!ai) {
        console.warn("Gemini API Key missing. Skipping AI extraction.");
        throw new Error("API Key missing");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract or infer standard book metadata from the following filename: "${fileName}". 
      If the filename contains series information (e.g. "Book 1", "Vol 2", or numbers), extract the Series Title and the Series Index/Volume Number.
      If the filename suggests a specific collection or group (e.g. "Cooking", "Textbooks", "Project Docs"), infer a 'group' name.
      Infer the language code (e.g. 'en', 'fr', 'es', 'vi') if evident, otherwise default to 'en'.
      If the filename indicates status (e.g. "Completed", "Ongoing"), extract it.
      If the filename is ambiguous, provide the most likely famous book match or generic details. 
      Ensure the description is a concise summary (max 150 characters).
      Genre should be a single category like "Sci-Fi", "Fiction", "History", etc.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            description: { type: Type.STRING },
            releaseDate: { type: Type.STRING, description: "YYYY-MM-DD or YYYY" },
            genre: { type: Type.STRING },
            language: { type: Type.STRING, description: "ISO 639-1 language code (e.g. en, fr, vi)" },
            seriesTitle: { type: Type.STRING, description: "The name of the series this book belongs to, if any." },
            seriesIndex: { type: Type.STRING, description: "The volume number or index within the series (e.g., '1', '2.5')." },
            group: { type: Type.STRING, description: "A broader collection name (e.g. 'Classics', 'Work')." },
            status: { type: Type.STRING, description: "Publication status if evident (e.g. 'Ongoing', 'Completed')." }
          },
          required: ["title", "author", "description", "releaseDate", "genre"],
        },
      },
    });

    const jsonText = response.text || '{}';
    return JSON.parse(jsonText) as BookMetadata;

  } catch (error) {
    console.error("Gemini metadata extraction failed:", error);
    // Fallback if AI fails or no key
    return {
      title: fileName,
      author: 'Unknown Author',
      description: 'No description available.',
      releaseDate: new Date().getFullYear().toString(),
      genre: 'General',
      language: 'en',
      seriesTitle: '',
      seriesIndex: '',
      group: '',
      status: ''
    };
  }
};