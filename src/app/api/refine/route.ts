import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const maxDuration = 60; // Set Vercel max execution time to 60 seconds

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

The student now asks: "${userMessage}"

First, evaluate if the student's request is an appropriate, safe, and scientifically valid request to modify the science inquiry project. If it is completely irrelevant, dangerous (e.g. using restricted chemicals or unethical animal testing), or not suitable, set "isValid" to false and provide a friendly "reply" explaining why it cannot be changed, leaving the "updatedHypothesis" the same as the original.
If the request is valid, set "isValid" to true, update the hypothesis based on the student's request (keep it realistic for high school), and provide a brief, friendly, encouraging "reply" explaining what you changed.

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
              isValid: { type: Type.BOOLEAN, description: "요청이 적절하고 안전한지 여부" },
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
              isValid: { type: Type.BOOLEAN },
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
    console.error("Refine generate error:", error);
    let errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";
    if (errorMessage.includes("429") || errorMessage.includes("exceeded your current quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      if (errorMessage.toLowerCase().includes("perday") || errorMessage.toLowerCase().includes("daily")) {
        errorMessage = "AI 서버의 일일(하루) 사용량 한도를 초과했습니다 (무료 요금제 한도 도달). 내일 다시 이용하시거나, 구글 AI Studio에서 결제 계정을 연동해 주세요.";
      } else {
        const match = errorMessage.match(/retry in ([\d\.]+)s/i);
        if (match && match[1]) {
          const seconds = Math.ceil(parseFloat(match[1]));
          errorMessage = `AI 서버의 분당 사용량 한도를 초과했습니다. 약 ${seconds}초 후에 다시 시도해 주세요.`;
        } else {
          errorMessage = "AI 서버의 분당 사용량 한도를 초과했습니다. 약 1분 후에 다시 시도해 주세요.";
        }
      }
    } else if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
      errorMessage = "입력된 Gemini API 키가 올바르지 않습니다. 키 값을 다시 확인해 주세요.";
    } else if (errorMessage.includes("fetch failed") || errorMessage.includes("failed to fetch")) {
      errorMessage = "네트워크 통신에 실패했습니다. 인터넷 연결 상태를 확인해 주세요.";
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
