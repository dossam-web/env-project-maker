"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, ArrowRight, ArrowLeft, Search, CheckCircle2, FlaskConical, Download, Loader2, BookOpen } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState("");
  const [region, setRegion] = useState("");
  const [problem, setProblem] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  
  // Detail state
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailResult, setDetailResult] = useState<any>(null);
  
  // PDF settings state
  const [schoolName, setSchoolName] = useState("ㅇㅇ고등학교");
  const [programName, setProgramName] = useState("과학과제연구 탐구계획서");
  
  const pdfRef = useRef<HTMLDivElement>(null);

  const themes = [
    { id: "기후변화", label: "기후변화", icon: "🌍" },
    { id: "생물다양성", label: "생물다양성", icon: "🦋" },
    { id: "자원순환", label: "자원순환", icon: "♻️" },
    { id: "에너지", label: "에너지", icon: "⚡" },
    { id: "생활환경", label: "생활환경", icon: "🏡" },
    { id: "물환경", label: "물환경", icon: "💧" }
  ];

  const regions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];


  // Settings removed

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {

    setStep(3); // Loading step
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, problem, region })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "결과를 가져오는데 실패했습니다.");
      
      if (!data.hypotheses || !Array.isArray(data.hypotheses)) {
        throw new Error("AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.");
      }

      setResults(data);
      setStep(4); // Results step
    } catch (err: any) {
      setError(err.message);
      setStep(2); // Go back on error
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDetail = async (hypothesis: any) => {

    setStep(5); // Detail loading step
    setDetailLoading(true);
    setError("");

    try {
      const response = await fetch("/api/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis, theme, problem })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "상세 계획을 생성하는데 실패했습니다.");
      
      setDetailResult(data);
      setStep(6); // Detail result step
    } catch (err: any) {
      setError(err.message);
      setStep(4); // Go back to hypotheses on error
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined" || !pdfRef.current) return;
    
    // Dynamically import html2pdf only on client side
    const html2pdf = (await import("html2pdf.js")).default;
    
    const element = pdfRef.current;
    const opt: any = {
      margin: 15,
      filename: `${schoolName}_${programName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <>
      <button className="setting-btn" onClick={() => setShowSettings(true)} title="API 설정">
        <Settings size={20} />
      </button>

      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0, color: "var(--primary)" }}>⚙️ 설정</h3>
            

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--primary)" }}>📄 PDF 양식 설정</h4>
              <label className="form-label">학교명/소속</label>
              <input 
                type="text" 
                className="form-input" 
                value={schoolName} 
                onChange={e => setSchoolName(e.target.value)}
                placeholder="예: 한국과학고등학교" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">프로그램명</label>
              <input 
                type="text" 
                className="form-input" 
                value={programName} 
                onChange={e => setProgramName(e.target.value)}
                placeholder="예: 2024년 1학기 과학과제연구" 
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: "1.5rem" }}>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>닫기</button>

            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="glass-card">
          <h1 className="title">🌿 과학과제연구</h1>
          <p className="subtitle">나만의 환경 탐구 가설 찾기</p>

          {step < 4 && (
            <div className="wizard-steps">
              <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}></div>
              <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}></div>
              <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}></div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                <h3 style={{ marginBottom: "0.5rem" }}>지역(교육청) 선택</h3>
                <select 
                  className="form-input" 
                  style={{ maxWidth: "300px", margin: "0 auto", cursor: "pointer" }}
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="">전국 (전체)</option>
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.5rem" }}>선택한 지역의 환경교육 자료를 우선적으로 분석합니다.</p>
              </div>

              <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>어떤 환경 문제에 관심이 있나요?</h2>
              <div className="theme-grid">
                {themes.map(t => (
                  <div 
                    key={t.id} 
                    className={`theme-card ${theme === t.id ? 'selected' : ''}`}
                    onClick={() => setTheme(t.id)}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{t.icon}</div>
                    <div style={{ fontWeight: 600 }}>{t.label}</div>
                  </div>
                ))}
              </div>
              <button className="btn" onClick={handleNext} disabled={!theme}>
                다음 단계로 <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>내 주변에서 발견한 문제는 무엇인가요?</h2>
              <div className="form-group">
                <label className="form-label">문제 상황이나 평소 궁금했던 점을 자유롭게 적어주세요.</label>
                <textarea 
                  className="form-input" 
                  rows={5}
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  placeholder="예: 우리 학교 분리수거장에는 항상 플라스틱 컵이 제대로 분리되지 않고 버려져 있어서 악취가 난다."
                />
              </div>
              {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={handlePrev}>
                  <ArrowLeft size={18} /> 이전
                </button>
                <button className="btn" onClick={handleSubmit} disabled={!problem.trim()}>
                  탐구 주제 찾기 <Search size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div className="loading-spinner"></div>
              <h2>자료를 분석하고 있습니다...</h2>
              <p style={{ opacity: 0.8 }}>GEP-AI 환경자료와 관련 성취기준을 기반으로<br/>고등학생 수준에 맞는 탐구 가설을 생성 중입니다.</p>
            </div>
          )}

          {step === 4 && results && (
            <div>
              <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>✨ 추천 탐구 가설 및 주제</h2>
              
              {(results.hypotheses || []).map((item: any, idx: number) => (
                <div key={idx} className="result-card">
                  <div className="tag">추천 {idx + 1}</div>
                  <h3>{item.topic}</h3>
                  
                  <h4><FlaskConical size={16} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "-2px" }}/>가설</h4>
                  <p style={{ fontWeight: 600, color: "var(--foreground)", background: "rgba(34, 197, 94, 0.1)", padding: "1rem", borderRadius: "0.5rem" }}>
                    {item.hypothesis}
                  </p>
                  
                  <h4><CheckCircle2 size={16} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "-2px" }}/>탐구 방법 (실험 계획)</h4>
                  <p>{item.method}</p>

                  {item.variables && (
                    <div style={{ background: "rgba(59, 130, 246, 0.05)", padding: "1rem", borderRadius: "0.5rem", marginTop: "1rem" }}>
                      <h5 style={{ margin: "0 0 0.5rem 0", color: "var(--primary)", fontSize: "0.95rem" }}>📊 실험 변인</h5>
                      <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem", lineHeight: 1.5, color: "var(--foreground)" }}>
                        <li><strong>독립변인:</strong> {item.variables.independent}</li>
                        <li><strong>종속변인:</strong> {item.variables.dependent}</li>
                        <li><strong>통제변인:</strong> {item.variables.controlled}</li>
                      </ul>
                    </div>
                  )}

                  <div style={{ fontSize: "0.85rem", opacity: 0.7, borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", marginTop: "1rem", marginBottom: "1rem" }}>
                    <strong>참고 자료/성취기준:</strong> {item.standard}
                  </div>
                  
                  <button className="btn" style={{ width: "100%" }} onClick={() => handleGenerateDetail(item)}>
                    이 가설로 상세 계획서 생성하기 <ArrowRight size={18} />
                  </button>
                </div>
              ))}

              <button className="btn btn-secondary" style={{ marginTop: "1rem" }} onClick={() => { setStep(1); setTheme(""); setProblem(""); setResults(null); }}>
                처음부터 다시하기
              </button>
            </div>
          )}

          {step === 5 && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div className="loading-spinner"></div>
              <h2>상세 실험 계획서를 작성하고 있습니다...</h2>
              <p style={{ opacity: 0.8 }}>변인 설정, 재료 목록, 주차별 일정, 선행연구 등을<br/>종합적으로 구성 중입니다. (약 10~20초 소요)</p>
            </div>
          )}

          {step === 6 && detailResult && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <button className="btn btn-secondary" onClick={() => setStep(4)}>
                  <ArrowLeft size={18} /> 가설 목록으로
                </button>
                <button className="btn" onClick={handleDownloadPDF} style={{ background: "var(--primary)", color: "white" }}>
                  <Download size={18} /> PDF 다운로드
                </button>
              </div>

              <div className="pdf-container" style={{ background: "white", padding: "2rem", borderRadius: "8px", color: "#333", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                {/* PDF Content Area */}
                <div ref={pdfRef} style={{ padding: "10px" }}>
                  <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "1rem", marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", margin: "0 0 0.5rem 0", color: "#111" }}>{programName}</h1>
                    <h2 style={{ fontSize: "1.2rem", margin: 0, color: "#555", fontWeight: "normal" }}>{schoolName}</h2>
                  </div>

                  <h3 style={{ fontSize: "1.5rem", color: "#111", marginBottom: "1rem" }}>{detailResult.title}</h3>
                  
                  <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "4px", borderLeft: "4px solid #3b82f6" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#1e40af", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FlaskConical size={18} /> 탐구 가설
                    </h4>
                    <p style={{ margin: 0, fontWeight: "bold" }}>{detailResult.hypothesis}</p>
                  </div>

                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ borderBottom: "1px solid #ddd", paddingBottom: "0.5rem", color: "#333" }}>1. 변인 설정</h4>
                    <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0", lineHeight: 1.6 }}>
                      <li><strong>독립변인:</strong> {detailResult.variables.independent}</li>
                      <li><strong>종속변인:</strong> {detailResult.variables.dependent}</li>
                      <li><strong>통제변인:</strong> {detailResult.variables.controlled}</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ borderBottom: "1px solid #ddd", paddingBottom: "0.5rem", color: "#333" }}>2. 탐구/실험 설계 (대조군/실험군)</h4>
                    <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{detailResult.experimentDesign}</p>
                  </div>

                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ borderBottom: "1px solid #ddd", paddingBottom: "0.5rem", color: "#333" }}>3. 실험 재료 및 예산 (예상)</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9" }}>
                          <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "left" }}>재료명</th>
                          <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "left" }}>수량</th>
                          <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "left" }}>예상 가격</th>
                          <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "left" }}>추천 구매처</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailResult.materials.map((m: any, i: number) => (
                          <tr key={i}>
                            <td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{m.name}</td>
                            <td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{m.quantity}</td>
                            <td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{m.price}</td>
                            <td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{m.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ borderBottom: "1px solid #ddd", paddingBottom: "0.5rem", color: "#333" }}>4. 주차별 탐구 일정</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9" }}>
                          <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "left", width: "20%" }}>주차</th>
                          <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "left" }}>수행 내용</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailResult.schedule.map((s: any, i: number) => (
                          <tr key={i}>
                            <td style={{ border: "1px solid #cbd5e1", padding: "8px", fontWeight: "bold" }}>{s.week}</td>
                            <td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{s.task}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginBottom: "2rem", padding: "1rem", background: "#fff5f5", borderRadius: "4px", borderLeft: "4px solid #ef4444" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#b91c1c" }}>⚠️ 안전 유의사항</h4>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>{detailResult.safety}</p>
                  </div>

                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ borderBottom: "1px solid #ddd", paddingBottom: "0.5rem", color: "#333", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <BookOpen size={18} /> 참고문헌 및 선행연구
                    </h4>
                    <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0", lineHeight: 1.6 }}>
                      {detailResult.references.map((r: any, i: number) => (
                        <li key={i} style={{ marginBottom: "0.5rem" }}>
                          <strong>{r.title}</strong> ({r.author}, {r.year})
                          <br />
                          <a href={r.url.startsWith('http') ? r.url : `https://scholar.google.co.kr/scholar?q=${encodeURIComponent(r.url)}`} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontSize: "0.9em" }}>
                            {r.url.startsWith('http') ? '링크 보기' : `검색: ${r.url}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
