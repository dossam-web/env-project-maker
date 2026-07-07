import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { originalHypothesis, chatHistory, userMessage } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server API Key is not configured." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Construct the context from the chat history
    let historyText = "";
    if (chatHistory && chatHistory.length > 0) {
      historyText = chatHistory.map((msg: any) => `${msg.role === 'user' ? '학생' : 'AI'}: ${msg.content}`).join("\n");
    }

    const prompt = `
You are a friendly and encouraging environmental science educator.
The student is trying to refine their science inquiry project hypothesis.
Here is the current hypothesis they have:
${JSON.stringify(originalHypothesis, null, 2)}

Here is the conversation history so far:
${historyText}

The student now asks: "${userMessage}"

First, update the hypothesis based on the student's request. Keep it realistic for a high school level experiment.
Second, provide a brief, friendly, encouraging message explaining what you changed and asking if they like it.

Please provide the results in JSON format matching the schema exactly.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: "학생에게 건네는 친절한 피드백 메시지" },
              updatedHypothesis: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  hypothesis: { type: Type.STRING },
                  method: { type: Type.STRING },
                  variables: {
                    type: Type.OBJECT,
                    properties: {
                      independent: { type: Type.STRING },
                      dependent: { type: Type.STRING },
                      controlled: { type: Type.STRING }
                    },
                    required: ["independent", "dependent", "controlled"]
                  },
                  standard: { type: Type.STRING }
                },
                required: ["topic", "hypothesis", "method", "variables", "standard"]
              }
            },
            required: ["reply", "updatedHypothesis"]
          }
        }
      });
    } catch (modelErr) {
      console.error("gemini-3.1-pro failed, falling back to gemini-3.5-flash:", modelErr);
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              updatedHypothesis: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  hypothesis: { type: Type.STRING },
                  method: { type: Type.STRING },
                  variables: {
                    type: Type.OBJECT,
                    properties: {
                      independent: { type: Type.STRING },
                      dependent: { type: Type.STRING },
                      controlled: { type: Type.STRING }
                    },
                    required: ["independent", "dependent", "controlled"]
                  },
                  standard: { type: Type.STRING }
                },
                required: ["topic", "hypothesis", "method", "variables", "standard"]
              }
            },
            required: ["reply", "updatedHypothesis"]
          }
        }
      });
    }

    const outputText = response.text || "{}";
    const result = JSON.parse(outputText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Refine error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
