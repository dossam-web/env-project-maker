import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export async function POST(req: Request) {
  try {
    const { theme, problem, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    // Connect to MCP
    const transport = new SSEClientTransport(new URL("https://gepai-mcp.vercel.app/sse"));
    const mcpClient = new Client({ name: "eco-inquiry", version: "1.0.0" }, { capabilities: {} });
    await mcpClient.connect(transport);

    let resourcesText = "";
    
    // Fetch relevant materials from MCP
    try {
      const searchRes: any = await mcpClient.callTool({
        name: "search_resources",
        arguments: { query: problem, school_level: "고등학교" }
      });
      resourcesText += "=== Resources ===\n" + JSON.stringify(searchRes.content, null, 2) + "\n";
    } catch (e) {
      console.warn("search_resources failed:", e);
    }

    try {
      const standardsRes: any = await mcpClient.callTool({
        name: "search_standards",
        arguments: { query: theme, school_level: "고등학교" }
      });
      resourcesText += "=== Standards ===\n" + JSON.stringify(standardsRes.content, null, 2) + "\n";
    } catch (e) {
      console.warn("search_standards failed:", e);
    }

    // Call Gemini to generate hypotheses
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert environmental science educator for high school students.
The student is doing a "과학과제연구" (Science Inquiry/Research) project.
They chose the theme "${theme}" and described their problem/observation as: "${problem}".

Using the following MCP database context, generate 3-4 appropriate inquiry topics and hypotheses.
The experiment should NOT be a simple verification experiment, but a creative and rigorous inquiry suitable for high school students.
All text must be in Korean.

Context Data from gepai-mcp:
${resourcesText || "No additional context found. Use your general knowledge."}

Please provide the results in JSON format matching the schema exactly.
`;

    // Try gemini-3.1-pro first, if not available fallback to gemini-2.5-pro
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hypotheses: {
                type: Type.ARRAY,
                description: "List of recommended hypotheses and inquiry projects",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING, description: "탐구 프로젝트 제목" },
                    hypothesis: { type: Type.STRING, description: "검증할 구체적인 가설" },
                    method: { type: Type.STRING, description: "가설을 검증하기 위한 탐구/실험 설계 요약" },
                    standard: { type: Type.STRING, description: "관련된 성취기준 혹은 참고 자료" }
                  },
                  required: ["topic", "hypothesis", "method", "standard"]
                }
              }
            },
            required: ["hypotheses"]
          }
        }
      });
    } catch (modelErr) {
      console.error("gemini-2.5-pro failed, falling back to gemini-1.5-pro:", modelErr);
      response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    }

    const outputText = response.text || "{}";
    const result = JSON.parse(outputText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
