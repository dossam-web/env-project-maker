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
6. **참고문헌/선행연구**: 관련 논문, 보고서, 교육자료 등 3~5개 (제목, 저자/기관, 연도, URL 또는 검색 키워드 포함)

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
        model: "gemini-3.1-pro",
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
                description: "참고문헌/선행연구 목록",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "논문/자료 제목" },
                    author: { type: Type.STRING, description: "저자 또는 기관" },
                    year: { type: Type.STRING, description: "발행 연도" },
                    url: { type: Type.STRING, description: "URL 또는 검색 키워드" }
                  },
                  required: ["title", "author", "year", "url"]
                }
              }
            },
            required: ["title", "hypothesis", "variables", "experimentDesign", "materials", "schedule", "safety", "references"]
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
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    year: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["title", "author", "year", "url"]
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
