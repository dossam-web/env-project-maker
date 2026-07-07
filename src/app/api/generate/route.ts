import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const maxDuration = 60; // Set Vercel max execution time to 60 seconds

export async function POST(req: Request) {
  try {
    const { theme, problem, region, subRegion } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server API Key is not configured." }, { status: 500 });
    }

    // Connect to MCP (Streamable HTTP - stateless)
    let mcpClient: Client | null = null;
    let connected = false;
    let attempts = 0;
    let lastError: any = null;

    while (!connected && attempts < 3) {
      try {
        attempts++;
        mcpClient = new Client({ name: "eco-inquiry", version: "1.0.0" }, { capabilities: {} });
        const transport = new StreamableHTTPClientTransport(
          new URL("https://gepai-mcp.vercel.app/mcp")
        );
        // 5초 타임아웃 적용
        const connectPromise = mcpClient.connect(transport);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("MCP Connection Timeout")), 5000));
        await Promise.race([connectPromise, timeoutPromise]);
        
        connected = true;
      } catch (err: any) {
        lastError = err;
        console.warn(`MCP Connection attempt ${attempts} failed:`, err.message);
        if (attempts < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!connected || !mcpClient) {
      console.warn(`데이터 서버(MCP) 연결에 3회 실패했습니다. 일반 AI 지식을 사용하여 진행합니다. (오류: ${lastError?.message || 'Timeout'})`);
    }

    let resourcesText = "";
    
    // Fetch relevant materials from MCP
    if (connected && mcpClient) {
      try {
        const searchArgs: any = { query: problem, school_level: "고등학교" };
        if (region) {
          searchArgs.office = region;
        }
        const searchRes: any = await mcpClient.callTool({
          name: "search_resources",
          arguments: searchArgs
        });
        resourcesText += "=== Resources ===\n" + JSON.stringify(searchRes.content, null, 2) + "\n";
      } catch (e) {
        console.warn("search_resources failed:", e);
      }
    }

    if (connected && mcpClient) {
      try {
        const standardsRes: any = await mcpClient.callTool({
          name: "search_standards",
          arguments: { query: theme, school_level: "고등학교" }
        });
        resourcesText += "=== Standards ===\n" + JSON.stringify(standardsRes.content, null, 2) + "\n";
      } catch (e) {
        console.warn("search_standards failed:", e);
      }
    }

    // Call Gemini to generate hypotheses
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert environmental science educator for Korean high school students.
The student is doing a "과학과제연구" (Science Inquiry/Research) project.
They chose the theme "${theme}" and described their problem/observation as: "${problem}".
${region ? `해당 학생의 거주 지역은 "${region}"${subRegion ? ` "${subRegion}"` : ''}입니다. 이 지역의 지리적 환경 특성, 특산품 뿐만 아니라 인근의 주요 환경시설(예: 소각장, 매립지, 정수장, 생태공원, 산업단지 등)이나 지역사회가 안고 있는 환경적 과제 등 다양한 지역 요소를 종합적으로 반영하여 학생 수준에 맞는 독창적인 주제를 추천해주세요.` : ''}

Using the following MCP database context, generate 3-4 appropriate inquiry topics and hypotheses.

## 핵심 조건
- 단순 검증실험이 아닌, 학생이 스스로 세운 독창적 가설을 검증하는 탐구실험이어야 합니다.
- 모든 텍스트는 한국어로 작성합니다.

## 고등학교 실험 안전 규정 (반드시 준수)
아래에 해당하는 실험은 절대 추천하지 마세요:
- **사용 금지 약품:** 메탄올, 벤젠, 클로로포름, 포름알데히드(포르말린), 수은, 크롬산, 사염화탄소, 아질산나트륨 등 발암물질·맹독성 약품
- **금지 실험:** 척추동물 해부실험(개구리, 쥐 등), 살아있는 동물에 대한 고통 유발 실험, 방사성 동위원소 사용 실험, 고압가스(수소, 아세틸렌) 실험
- **제한 약품:** 진한 황산·진한 질산·진한 염산은 반드시 교사 감독 하 소량만 사용 (가능하면 묽은 용액으로 대체 권장)
- **전기 안전:** 가정용 전원(220V) 직접 사용 금지, 저전압 전원장치(DC 12V 이하) 사용 권장

## 실현 가능성 조건 (반드시 준수)
- 실험 재료는 일반 과학 교구 업체(사이언스스타, 한솔교구 등)나 온라인 쇼핑몰에서 구매 가능한 것만 사용
- 고가의 전문 분석장비(SEM, GC-MS, 분광광도계 등)가 필요한 실험은 피하고, 고등학교 과학실에서 보유 가능한 장비(현미경, pH미터, 전자저울, 디지털 온도계, 간이 분광기 등)로 수행 가능해야 함
- 실험 기간이 1학기(약 4개월) 이내에 완료 가능해야 함
- 야외 현장조사가 필요한 경우, 학교 주변 또는 근교에서 수행 가능한 범위여야 함

## 추천 실험 방법 예시 (이런 방향을 권장)
- 식물 성장 비교 실험, 수질/토양 분석(간이 키트 활용), 미생물 배양, 센서 기반 환경 데이터 수집
- 설문조사·인식 조사 병행 연구, 앱/센서를 활용한 시민과학형 탐구
- 대조군·실험군 설계가 명확한 비교 실험

Context Data from gepai-mcp:
${resourcesText || "No additional context found. Use your general knowledge."}

Please provide the results in JSON format matching the schema exactly.
`;


    // Try gemini-3.1-pro first, if not available fallback to gemini-3.5-flash
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
              hypotheses: {
                type: Type.ARRAY,
                description: "List of recommended hypotheses and inquiry projects",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING, description: "탐구 프로젝트 제목" },
                    hypothesis: { type: Type.STRING, description: "검증할 구체적인 가설" },
                    method: { type: Type.STRING, description: "가설을 검증하기 위한 탐구/실험 설계 요약" },
                    variables: {
                      type: Type.OBJECT,
                      description: "실험 변인 설정",
                      properties: {
                        independent: { type: Type.STRING, description: "독립변인" },
                        dependent: { type: Type.STRING, description: "종속변인" },
                        controlled: { type: Type.STRING, description: "통제변인" }
                      },
                      required: ["independent", "dependent", "controlled"]
                    },
                    standard: { type: Type.STRING, description: "관련된 성취기준 혹은 참고 자료" }
                  },
                  required: ["topic", "hypothesis", "method", "variables", "standard"]
                }
              }
            },
            required: ["hypotheses"]
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
              hypotheses: {
                type: Type.ARRAY,
                description: "List of recommended hypotheses and inquiry projects",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING, description: "탐구 프로젝트 제목" },
                    hypothesis: { type: Type.STRING, description: "검증할 구체적인 가설" },
                    method: { type: Type.STRING, description: "가설을 검증하기 위한 탐구/실험 설계 요약" },
                    variables: {
                      type: Type.OBJECT,
                      description: "실험 변인 설정",
                      properties: {
                        independent: { type: Type.STRING, description: "독립변인" },
                        dependent: { type: Type.STRING, description: "종속변인" },
                        controlled: { type: Type.STRING, description: "통제변인" }
                      },
                      required: ["independent", "dependent", "controlled"]
                    },
                    standard: { type: Type.STRING, description: "관련된 성취기준 혹은 참고 자료" }
                  },
                  required: ["topic", "hypothesis", "method", "variables", "standard"]
                }
              }
            },
            required: ["hypotheses"]
          }
        }
      });
    }

    const outputText = response.text || "{}";
    const result = JSON.parse(outputText);
    return NextResponse.json({ hypotheses: result.hypotheses || [] });
  } catch (error: any) {
    console.error("Generate error:", error);
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
      errorMessage = "데이터베이스 서버 또는 AI 서버와의 네트워크 통신에 실패했습니다. 인터넷 연결 상태를 확인해 주세요.";
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
