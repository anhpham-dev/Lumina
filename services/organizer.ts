import { Type } from "@google/genai";
import { Book } from "../types";
import { getGenAI } from "./gemini";

export const organizeLibrary = async (books: Book[]): Promise<Map<string, Partial<Book>>> => {
  if (books.length === 0) return new Map();

  const ai = await getGenAI();
  if (!ai) return new Map();

  // Prepare a lightweight list for the AI (avoid sending full descriptions/binary data)
  const bookList = books.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    fileName: b.fileName,
    currentSeries: b.seriesTitle,
    currentGroup: b.group
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a digital librarian. I will provide a list of books. 
      Your task is to identify relationships between them and suggest "Series" and "Groups".
      
      Rules:
      1. Group books from the same series together using 'seriesTitle'.
      2. Infer 'seriesIndex' if evident from the title (e.g. "Harry Potter 1" -> Index "1").
      3. If books share a common theme (e.g. "Cookbooks", "Programming", "History") or Author, assign them a 'group' name.
      4. If a book already has good metadata, keep it, but you can refine it if it helps consistency.
      5. Return a map of ID -> Updates.
      
      Books: ${JSON.stringify(bookList)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            updates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  seriesTitle: { type: Type.STRING },
                  seriesIndex: { type: Type.STRING },
                  group: { type: Type.STRING },
                },
                required: ["id"],
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{ "updates": [] }');
    const updateMap = new Map<string, Partial<Book>>();
    
    if (result.updates && Array.isArray(result.updates)) {
        result.updates.forEach((u: any) => {
            if (u.id) {
                // Filter out empty strings to avoid overwriting with empty
                const cleanUpdate: Partial<Book> = {};
                if (u.seriesTitle) cleanUpdate.seriesTitle = u.seriesTitle;
                if (u.seriesIndex) cleanUpdate.seriesIndex = u.seriesIndex;
                if (u.group) cleanUpdate.group = u.group;
                
                if (Object.keys(cleanUpdate).length > 0) {
                    updateMap.set(u.id, cleanUpdate);
                }
            }
        });
    }

    return updateMap;

  } catch (error) {
    console.error("Auto-organize failed:", error);
    return new Map();
  }
};

export const suggestGroupName = async (books: Book[]): Promise<string> => {
  if (books.length === 0) return '';
  
  const ai = await getGenAI();
  if (!ai) return '';

  // Use a subset to save tokens, just need context
  const subset = books.slice(0, 15).map(b => ({
    title: b.title,
    author: b.author,
    fileName: b.fileName
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest a single, concise group/collection name for these books (e.g., "Fantasy", "Cooking", "Project Docs"). Return ONLY the name in the JSON property.
      Books: ${JSON.stringify(subset)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                groupName: { type: Type.STRING }
            }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result.groupName || '';

  } catch (error) {
    console.error("Group suggestion failed:", error);
    return '';
  }
};