import { GoogleGenAI, Type } from "@google/genai";
import { SocialPost, ScandalStrategy, GroundingChunk } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to get location
const getCurrentLocation = (): Promise<{latitude: number, longitude: number} | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => resolve(null)
    );
  });
};

/**
 * FAST: Use Gemini Flash-Lite to simulate scraping social media based on a topic.
 */
export const simulateScraping = async (topic: string, location: string): Promise<SocialPost[]> => {
  try {
    const prompt = `
      Generate 5 realistic, angry, or concerned social media posts (in Polish) regarding "${topic}" in "${location}".
      The posts should sound like real citizens complaining.
      Return JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              author: { type: Type.STRING },
              content: { type: Type.STRING },
              platform: { type: Type.STRING, enum: ['twitter', 'facebook', 'instagram'] },
              likes: { type: Type.INTEGER },
              sentiment: { type: Type.STRING, enum: ['negative', 'neutral', 'positive'] }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as SocialPost[];
  } catch (error) {
    console.error("Scraping simulation failed", error);
    return [];
  }
};

/**
 * MEDIUM: Use Gemini Flash + Maps Grounding to find context.
 */
export const getContextualData = async (query: string): Promise<{ text: string; chunks: GroundingChunk[] }> => {
  try {
    const coords = await getCurrentLocation();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find real locations related to: ${query}. Are there any schools, hospitals, or government buildings nearby that make this issue worse? Provide a short summary.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: coords ? {
          retrievalConfig: {
            latLng: {
              latitude: coords.latitude,
              longitude: coords.longitude
            }
          }
        } : undefined
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    return {
      text: response.text || "No location data found.",
      chunks
    };
  } catch (error) {
    console.error("Maps grounding failed", error);
    return { text: "Could not fetch map data.", chunks: [] };
  }
};

/**
 * MULTIMODAL: Analyze an uploaded image to diagnose the city issue.
 */
export const analyzeCityImage = async (base64Image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png handling
              data: base64Image
            }
          },
          {
            text: "Analyze this image of a city issue. 1. Identify the specific problem (e.g., potholes, illegal dumping, broken infrastructure). 2. Estimate the severity (Low/Medium/High/Critical). 3. Identify any potential safety hazards. 4. Suggest which city department handles this. Reply in Polish, concise."
          }
        ]
      }
    });
    return response.text || "Nie udało się przeanalizować zdjęcia.";
  } catch (error) {
    console.error("Image analysis failed", error);
    return "Błąd analizy obrazu.";
  }
};

/**
 * SLOW & SMART: Use Gemini 3 Pro with Thinking Mode to craft the "Scandal".
 */
export const generateScandalCampaign = async (
  topic: string, 
  posts: SocialPost[], 
  mapContext: string,
  imageAnalysis?: string
): Promise<ScandalStrategy> => {
  try {
    const postsText = posts.map(p => `"${p.content}" (- ${p.author})`).join("\n");
    const visualContext = imageAnalysis ? `DOWÓD WIDEO/FOTO (Analiza AI): ${imageAnalysis}` : "Brak dowodów wizualnych.";
    
    const prompt = `
      ACT AS: A ruthless, highly effective city activist and campaign manager.
      GOAL: Force the city authorities to fix the issue: "${topic}".
      
      INPUT DATA:
      1. Citizen Complaints:
      ${postsText}
      
      2. Location Context:
      ${mapContext}

      3. Visual Evidence:
      ${visualContext}
      
      TASK:
      Create a "Scandal Campaign" strategy. You must exaggerate the consequences, appeal to emotions (fear, anger, pride), and directly attack the incompetence of the administration.
      The tone should be ALARMIST but credible enough to go viral.
      
      ALSO GENERATE OFFICIAL COMPLAINTS AND SOCIAL CONTENT.

      OUTPUT JSON with:
      - headline: A clickbait, sensational headline (Polish).
      - articleContent: A short, fiery blog post/press release (Markdown supported, Polish).
      - hashtags: 5 viral hashtags.
      - targetAuthority: Who is to blame? (Department or Official Title).
      - pressurePoints: List of 3 strategic angles to attack (e.g., "Child Safety", "Waste of Tax Money").
      - officialComplaint: Object with { subject, recipient (generic dept), body (formal but firm complaint email) }.
      - socialContent: Object with { twitterPost (short, punchy, uses hashtags), facebookPost (longer, engaging, asking for shares) }.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
            thinkingBudget: 32768
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            articleContent: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetAuthority: { type: Type.STRING },
            pressurePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            officialComplaint: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    recipient: { type: Type.STRING },
                    body: { type: Type.STRING }
                }
            },
            socialContent: {
                type: Type.OBJECT,
                properties: {
                    twitterPost: { type: Type.STRING },
                    facebookPost: { type: Type.STRING }
                }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text generated");
    return JSON.parse(text) as ScandalStrategy;

  } catch (error) {
    console.error("Scandal generation failed", error);
    throw error;
  }
};