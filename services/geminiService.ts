
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale, Customer } from '../types';

const getGenAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to clean AI output which might contain markdown code blocks
const parseAIResponse = (text: string) => {
    try {
        let cleaned = text.trim();
        // Remove markdown code blocks if present
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
        }
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("Failed to parse AI JSON response:", text);
        return null;
    }
};

export const fetchMarketNews = async (): Promise<string> => {
  try {
    const ai = getGenAI();
    // Use Google Search tool for real news
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Find the single most important latest news headline related to grocery retail, food prices (vegetables, oil, grains), or FMCG market in India today. Return ONLY the headline text.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "Market news currently unavailable.";
  } catch (error) {
    console.error("Error fetching market news:", error);
    return "Market news currently unavailable.";
  }
};

export const fetchPriceVariationSuggestion = async (): Promise<string> => {
  try {
    const ai = getGenAI();
    // Use Google Search for real price trends
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Search for the latest price trends of essential grocery commodities (like vegetables, onions, tomatoes, oils, sugar, grains) in India. Identify one significant price change (increase or decrease). Summarize the news in one sentence. Then, on a new line starting with 'SUGGESTION:', suggest a percentage price change for that specific product category. Example output: 'Onion prices have surged by 20% due to supply shortage.\nSUGGESTION: Increase Vegetables product prices by 10%'",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "Could not fetch suggestion.";
  } catch (error) {
    console.error("Error fetching price variation:", error);
    return "Could not fetch price variation suggestion.";
  }
};

export const fetchRetailNewsInsights = async (): Promise<string> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Find 3 top trending news stories, government policy changes, or market shifts affecting the grocery and retail business in India right now. Return the result as a concise markdown bulleted list.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "No trending news found.";
  } catch (error) {
    console.error("News error:", error);
    return "Unable to fetch news trends.";
  }
};

export const askShopAI = async (context: { products: Product[], sales: Sale[], customers: Customer[] }, question: string): Promise<string> => {
    try {
        const ai = getGenAI();
        const prompt = `
          System Instruction: You are a helpful AI assistant for the "RG Shop Billing Pro" software. 
          Your name is "ProBot". You must answer questions based *only* on the JSON data provided below. 
          Do not invent information. If the answer isn't in the data, say so. Keep your answers concise and clear.
          Format your response using markdown for readability (e.g., use lists, bold text).

          Current Date: ${new Date().toLocaleDateString()}

          Shop Data:
          ${JSON.stringify(context)}

          User Question:
          ${question}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "I couldn't generate an answer.";
    } catch (error) {
        console.error("Error with Shop AI assistant:", error);
        return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    }
};

// --- New Features for "Unique/AI" Update ---

// Updated to accept Product objects to provide context (Name + Brand) and return productId
export const analyzeImageForBilling = async (base64Image: string, products: Product[]): Promise<{ productId: string; quantity: number }[]> => {
    try {
      const ai = getGenAI();
      
      // Simplify product list to save tokens but keep essential matching info
      const productContext = products.map(p => ({ id: p.id, name: p.name, brand: p.brand }));

      const prompt = `
        Look at this image of grocery items.
        
        Available Inventory: ${JSON.stringify(productContext)}
        
        Task:
        1. Identify the items in the image.
        2. Match them to the 'id' in the Available Inventory list.
        3. Use the Brand and Name to ensure the correct match (e.g., "Lays" image matches "Lays" brand in list).
        4. Count the quantity.
        
        Return ONLY a JSON array of objects with 'productId' and 'quantity'.
        If an item is not found in the inventory, ignore it.
        
        Example Output: [{"productId": "p1", "quantity": 2}, {"productId": "s5", "quantity": 1}]
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING },
                quantity: { type: Type.NUMBER }
              }
            }
          }
        }
      });
      
      const parsed = parseAIResponse(response.text || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Visual Billing Error:", error);
      return [];
    }
  }
  
  // Updated to return productId for exact matching
  export const processVoiceCommand = async (transcript: string, products: Product[]): Promise<{ type: string; productId?: string; quantity?: number; discount?: number } | null> => {
      try {
          const ai = getGenAI();
          
          // Provide ID, Name and Brand for better semantic matching
          const productContext = products.map(p => ({ id: p.id, name: p.name, brand: p.brand }));

          const prompt = `
            You are a Point of Sale voice assistant.
            User said: "${transcript}"
            
            Available Products: ${JSON.stringify(productContext)}
  
            Determine the intent.
            Possible intents: "ADD_ITEM", "REMOVE_ITEM", "CLEAR_BILL", "CHECKOUT", "DISCOUNT_BILL".
            
            Rules for ADD_ITEM:
            1. Search the 'Available Products' list.
            2. You MUST perform a fuzzy match (e.g., "Tomato" -> "Tomatoes", "Jeera" -> "Jeera / Cumin (100g)").
            3. **QUANTITY/WEIGHT CALCULATION**:
               - If user says a count (e.g., "2 packets", "2 pieces"), quantity is that number.
               - If user says a weight (e.g., "50 grams", "1kg", "500g") and the product name contains a unit size (e.g., "100g", "1kg"):
                 You must calculate the quantity.
                 Examples:
                 - User: "Add 200g Turmeric". Product: "Turmeric (100g)". Quantity = 2.
                 - User: "Add 1kg Sugar". Product: "Sugar (1kg)". Quantity = 1.
                 - User: "Add 1kg Sugar". Product: "Sugar (500g)". Quantity = 2.
                 - User: "Add 50g Jeera". Product: "Jeera (100g)". Quantity = 0.5.
                 - User: "Add 50 grams Pepper". Product: "Pepper (50g)". Quantity = 1.
            4. If no quantity is specified, default is 1.
            
            Return valid JSON only.
            Example: { "type": "ADD_ITEM", "productId": "p1", "quantity": 2 }
          `;
  
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      productId: { type: Type.STRING, nullable: true },
                      quantity: { type: Type.NUMBER, nullable: true },
                      discount: { type: Type.NUMBER, nullable: true },
                    }
                  }
              }
          });
          
          return parseAIResponse(response.text || "{}");
      } catch (error) {
          console.error("Voice Command Error:", error);
          return null;
      }
  };
  
  export const generateSmartInsights = async (sales: Sale[], products: Product[]): Promise<{
      stockPrediction: string;
      staffPerformance: string;
      salesHeatmap: { productName: string; score: number }[];
  }> => {
      try {
          const ai = getGenAI();
          
          // Simplify data to reduce token usage
          const recentSales = sales.slice(-50); 
          const productSummary = products.map(p => ({ name: p.name, stock: p.stock }));
  
          const prompt = `
            Analyze this sales data and product inventory for a retail shop.
            
            Sales Data: ${JSON.stringify(recentSales)}
            Inventory: ${JSON.stringify(productSummary)}
  
            1. Predict Stock Needs: Which 3 items are likely to run out soon based on trends?
            2. Staff Performance: Identify the most active employee ID based on transaction count.
            3. Sales Heatmap: Give a "hotness" score (1-100) for the top 5 selling products.
  
            Return JSON.
          `;
  
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      stockPrediction: { type: Type.STRING },
                      staffPerformance: { type: Type.STRING },
                      salesHeatmap: {
                          type: Type.ARRAY,
                          items: {
                              type: Type.OBJECT,
                              properties: {
                                  productName: { type: Type.STRING },
                                  score: { type: Type.NUMBER }
                              }
                          }
                      }
                    }
                  }
              }
          });
  
          const parsed = parseAIResponse(response.text || "{}");
          return parsed || { stockPrediction: "No data", staffPerformance: "No data", salesHeatmap: [] };
      } catch (error) {
          console.error("Smart Insights Error:", error);
          return {
              stockPrediction: "AI Analysis currently unavailable.",
              staffPerformance: "AI Analysis currently unavailable.",
              salesHeatmap: []
          };
      }
  };

  export const analyzeCustomerFace = async (base64Image: string): Promise<string> => {
    try {
      const ai = getGenAI();
      const prompt = `
        Analyze the face in this image. 
        Describe the person briefly in 5-6 words (Gender, approx age, distinctive features like glasses/beard/hair).
        Example: "Male, 30s, Glasses, Beard, Short hair".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      });

      return response.text || "Customer detected";
    } catch (error) {
      console.error("Face Analysis Error:", error);
      return "Customer detected (Analysis unavailable)";
    }
  };

  // Identify a customer by matching their current face image with stored text attributes of registered customers
  export const identifyCustomerFromImage = async (base64Image: string, customers: Customer[]): Promise<string | null> => {
    try {
        const ai = getGenAI();
        const candidateData = customers
            .filter(c => c.faceAttributes)
            .map(c => ({ id: c.id, description: c.faceAttributes }));

        if (candidateData.length === 0) return null;

        const prompt = `
            You are a Face Recognition system.
            
            I have provided an image of a person.
            Below is a list of registered customers with their visual descriptions:
            ${JSON.stringify(candidateData)}

            Task:
            1. Analyze the face in the image (Age, Gender, Hair, Accessories, etc.).
            2. Compare it against the provided descriptions.
            3. Find the best match.
            4. If a description matches reasonably well (e.g. correct gender, similar age range), return the ID.
            5. If NO description matches closely, return "null".
            
            Return ONLY a JSON object: { "matchedId": "c1" } or { "matchedId": null }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                { text: prompt }
            ],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        matchedId: { type: Type.STRING, nullable: true }
                    }
                }
            }
        });

        const parsed = parseAIResponse(response.text || "{}");
        return parsed?.matchedId || null;

    } catch (error) {
        console.error("Face ID Error:", error);
        return null;
    }
  };

  // --- UPS_SELLING ENGINE ---
  export const getSmartUpsellSuggestion = async (cartItemNames: string[]): Promise<string | null> => {
    if (cartItemNames.length === 0) return null;
    try {
        const ai = getGenAI();
        const prompt = `
            A customer is buying these items at a grocery store: ${cartItemNames.join(', ')}.
            
            Suggest ONE item they might have forgotten or that goes well with these. 
            Keep it very short (max 4 words).
            Example input: "Milk, Cereal". Output: "Bananas".
            Example input: "Chips, Coke". Output: "Dip or Salsa".
            
            Return ONLY the suggested item name.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text ? response.text.trim() : null;
    } catch (error) {
        return null;
    }
  };
