import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const maxDuration = 60; // Set Vercel max execution time to 60 seconds

export async function POST(req: Request) {
  try {
    const { hypothesis, theme, problem } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server API Key is not configured." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert environmental science educator for Korean high school students.
A student has selected the following inquiry topic and hypothesis for their "과학과제연구" project:

**대주제:** ${theme}
**문제 인식:** ${problem}
**탐구 제목:** ${hypothesis.topic}
**가설:** ${hypothesis.hypothesis}
**탐구 방법 개요:** ${hypothesis.method}

이 가설을 바탕으로 고등학교에서 실현 가능한 상세 실험 계획서를 작성해주세요.

## 필수 포함 항목
1. **변인 설정**: 독립변인, 종속변인, 통제변인을 명확히 구분
2. **대조군/실험군 설계**: 구체적인 실험 조건 설명
3. **실험 재료 목록**: 각 재료의 예상 가격(원)과 구매처(사이언스스타, 한솔교구, 쿠팡, 다이소 등 실제 구매 가능한 곳) 포함
4. **주차별 실험 일정**: 16주(1학기) 기준, 각 주차별 수행 내용
5. **안전 유의사항**: 해당 실험에서 주의해야 할 안전 수칙
6. **참고문헌/선행연구**: (가짜 논문 지어내기 절대 금지) 학생들이 직접 RISS, DBpia, Google Scholar 등에서 검색하여 실제 선행 연구를 스스로 찾을 수 있도록 도울 수 있는 **추천 검색 키워드(검색어)와 해당 키워드를 추천하는 이유(검색 팁)**를 2~3개 제안하세요. 절대 허구의 논문 제목이나 가짜 링크를 생성하지 마세요.

## 안전 규정 (반드시 준수)
- 메탄올, 벤젠, 클로로포름, 포름알데히드 등 발암·맹독성 약품 사용 금지
- 척추동물 해부실험, 동물 고통 유발 실험 금지
- 진한 산/염기는 묽은 용액으로 대체 권장
- 가정용 전원(220V) 직접 사용 금지

## 실현 가능성
- 고등학교 과학실 보유 장비(현미경, pH미터, 전자저울, 온도계 등)로 수행 가능해야 함
- 재료 총 예산은 10만원 이내 권장

모든 텍스트는 한국어로 작성하세요.
Please provide the results in JSON format matching the schema exactly.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "탐구 프로젝트 제목" },
              hypothesis: { type: Type.STRING, description: "검증할 가설" },
              variables: {
                type: Type.OBJECT,
                properties: {
                  independent: { type: Type.STRING, description: "독립변인" },
                  dependent: { type: Type.STRING, description: "종속변인" },
                  controlled: { type: Type.STRING, description: "통제변인" }
                },
                required: ["independent", "dependent", "controlled"]
              },
              experimentDesign: { type: Type.STRING, description: "대조군/실험군 설계 상세 설명" },
              materials: {
                type: Type.ARRAY,
                description: "실험 재료 목록",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "재료명" },
                    quantity: { type: Type.STRING, description: "수량" },
                    price: { type: Type.STRING, description: "예상 가격 (원)" },
                    source: { type: Type.STRING, description: "구매처" }
                  },
                  required: ["name", "quantity", "price", "source"]
                }
              },
              schedule: {
                type: Type.ARRAY,
                description: "주차별 일정 (16주)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    week: { type: Type.STRING, description: "주차 (예: 1~2주차)" },
                    task: { type: Type.STRING, description: "수행 내용" }
                  },
                  required: ["week", "task"]
                }
              },
              safety: { type: Type.STRING, description: "안전 유의사항" },
              references: {
                type: Type.ARRAY,
                description: "추천 검색 키워드 및 검색 팁 목록",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING, description: "추천 검색 키워드" },
                    reason: { type: Type.STRING, description: "키워드 추천 이유 및 검색 팁" }
                  },
                  required: ["keyword", "reason"]
                }
              }
            },
            required: ["title", "hypothesis", "variables", "experimentDesign", "materials", "schedule", "safety", "references"]
          }
        }
      });
    } catch (modelErr) {
      console.error("gemini-3.5-flash failed, falling back to gemini-3.5-flash fallback:", modelErr);
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              hypothesis: { type: Type.STRING },
              variables: {
                type: Type.OBJECT,
                properties: {
                  independent: { type: Type.STRING },
                  dependent: { type: Type.STRING },
                  controlled: { type: Type.STRING }
                },
                required: ["independent", "dependent", "controlled"]
              },
              experimentDesign: { type: Type.STRING },
              materials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    price: { type: Type.STRING },
                    source: { type: Type.STRING }
                  },
                  required: ["name", "quantity", "price", "source"]
                }
              },
              schedule: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    week: { type: Type.STRING },
                    task: { type: Type.STRING }
                  },
                  required: ["week", "task"]
                }
              },
              safety: { type: Type.STRING },
              references: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["keyword", "reason"]
                }
              }
            },
            required: ["title", "hypothesis", "variables", "experimentDesign", "materials", "schedule", "safety", "references"]
          }
        }
      });
    }

    const outputText = response.text || "{}";
    const result = JSON.parse(outputText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Detail generate error:", error);
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
