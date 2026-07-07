"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Search, CheckCircle2, FlaskConical, Download, Loader2, BookOpen, MessageSquare, Copy } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState("");
  const [region, setRegion] = useState("");
  const [subRegion, setSubRegion] = useState("");
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  
  // Detail state
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailResult, setDetailResult] = useState<any>(null);
  
  // Chatbot states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  // Contact modal states
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("오류 제보");
  const [feedbackContent, setFeedbackContent] = useState("");
  
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleFeedbackSubmit = () => {
    if (!feedbackContent.trim()) {
      alert("피드백 내용을 입력해주세요.");
      return;
    }
    const subject = encodeURIComponent(`[EcoInquiry 피드백] ${feedbackType}`);
    const body = encodeURIComponent(
      `안녕하세요, EcoInquiry 개발자님.\n\n` +
      `[피드백 유형]: ${feedbackType}\n` +
      `[내용]:\n${feedbackContent}\n\n` +
      `----------------------------------------\n` +
      `* OS: ${navigator.userAgent}\n` +
      `* 시간: ${new Date().toLocaleString()}\n`
    );
    
    window.location.href = `mailto:akanffl@gmail.com?subject=${subject}&body=${body}`;
    setIsContactOpen(false);
    setFeedbackContent("");
  };

  const themes = [
    { id: "기후변화", label: "기후변화", icon: "🌍" },
    { id: "생물다양성", label: "생물다양성", icon: "🦋" },
    { id: "자원순환", label: "자원순환", icon: "♻️" },
    { id: "에너지", label: "에너지", icon: "⚡" },
    { id: "생활환경", label: "생활환경", icon: "🏡" },
    { id: "물환경", label: "물환경", icon: "💧" }
  ];

  const regions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

  const subRegionsMap: Record<string, string[]> = {
    "서울": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    "부산": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
    "대구": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구", "군위군"],
    "인천": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
    "광주": ["광산구", "남구", "동구", "북구", "서구"],
    "대전": ["대덕구", "동구", "서구", "유성구", "중구"],
    "울산": ["남구", "동구", "북구", "울주군", "중구"],
    "세종": ["세종시"],
    "경기": ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
    "강원": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
    "충북": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
    "충남": ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
    "전북": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
    "전남": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
    "경북": ["경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
    "경남": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
    "제주": ["서귀포시", "제주시"]
  };



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
        body: JSON.stringify({ theme, problem, region, subRegion })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해 주세요. (게이트웨이 타임아웃 또는 서버 오류)");
      }
      
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

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("상세 계획을 생성하는 데 시간이 너무 오래 걸립니다. AI 모델의 응답이 늦어지고 있으니 잠시 후 다시 시도해 주세요.");
      }
      
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
      filename: `EcoInquiry_탐구계획서.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleCopyHWP = () => {
    if (!detailResult || !pdfRef.current) return;
    const html = pdfRef.current.innerHTML;
    try {
      const blob = new Blob([html], { type: 'text/html' });
      // Use window.ClipboardItem fallback
      const ClipboardItemCtor = (window as any).ClipboardItem;
      if (ClipboardItemCtor) {
        const clipboardItem = new ClipboardItemCtor({ 'text/html': blob });
        navigator.clipboard.write([clipboardItem]).then(() => {
          alert("한글(HWP) 복사가 완료되었습니다. 빈 문서에 붙여넣기(Ctrl+V) 하세요!");
        });
      } else {
        alert("이 브라우저에서는 클립보드 복사를 지원하지 않습니다.");
      }
    } catch (e) {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  const handleChatSubmit = async (idx: number, item: any) => {
    if (!chatInput.trim()) return;
    
    const userMsg = { role: "user", content: chatInput };
    const currentHistory = [...chatHistory, userMsg];
    setChatHistory(currentHistory);
    setChatInput("");
    setIsChatting(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalHypothesis: item, chatHistory: currentHistory, userMessage: userMsg.content })
      });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error("챗봇 서버와의 통신이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.");
      }
      
      if (!res.ok) throw new Error(data.error);

      const aiMsg = { role: "ai", content: data.reply };
      setChatHistory([...currentHistory, aiMsg]);
      
      if (data.isValid) {
        const newResults = { ...results };
        newResults.hypotheses[idx] = data.updatedHypothesis;
        setResults(newResults);
      }
    } catch (err: any) {
      alert("수정에 실패했습니다: " + err.message);
      setChatHistory(chatHistory);
    } finally {
      setIsChatting(false);
    }
  };


  return (
    <>
      <div className="container">
        <div className="glass-card">
          <h1 className="title">🌿 EcoInquiry</h1>
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
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                  <select 
                    className="form-input region-select" 
                    style={{ maxWidth: "300px", margin: 0, cursor: "pointer" }}
                    value={region}
                    onChange={(e) => {
                      setRegion(e.target.value);
                      setSubRegion(""); // Reset sub-region when region changes
                    }}
                  >
                    <option value="">전국 (전체)</option>
                    {regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  {region && subRegionsMap[region] && (
                    <select 
                      className="form-input region-select" 
                      style={{ maxWidth: "300px", margin: 0, cursor: "pointer" }}
                      value={subRegion}
                      onChange={(e) => setSubRegion(e.target.value)}
                    >
                      <option value="">시/군/구 선택 (선택 안함)</option>
                      {subRegionsMap[region].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  )}
                </div>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.5rem" }}>
                  지역을 구체적으로 선택할수록, 해당 지역의 특산품이나 환경적 특징을 반영한 맞춤형 주제가 추천됩니다.
                </p>
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
              
              {error && (
                <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", textAlign: "center", fontWeight: "bold" }}>
                  ⚠️ {error}
                </div>
              )}

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
                  
                  <button className="btn btn-secondary" style={{ width: "100%", marginTop: "0.5rem" }} onClick={() => {
                    if (editingIndex === idx) {
                      setEditingIndex(null);
                    } else {
                      setEditingIndex(idx);
                      setChatHistory([]);
                      setChatInput("");
                    }
                  }}>
                    <MessageSquare size={18} /> {editingIndex === idx ? "챗봇 닫기" : "AI와 대화하며 가설 다듬기"}
                  </button>

                  {editingIndex === idx && (
                    <div style={{ marginTop: "1rem", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "1rem", background: "rgba(255, 255, 255, 0.8)" }}>
                      <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "1rem", fontSize: "0.9rem" }}>
                        {chatHistory.length === 0 && <p style={{ color: "#666", textAlign: "center", margin: "1rem 0" }}>어떤 부분을 수정하고 싶으신가요?<br/>(예: 독립변인을 온도로 바꿔줘)</p>}
                        {chatHistory.map((msg, i) => (
                          <div key={i} style={{ marginBottom: "0.5rem", textAlign: msg.role === "user" ? "right" : "left" }}>
                            <span style={{ display: "inline-block", background: msg.role === "user" ? "var(--primary)" : "#f1f5f9", color: msg.role === "user" ? "white" : "black", padding: "0.5rem 1rem", borderRadius: "1rem", maxWidth: "90%", textAlign: "left", whiteSpace: "pre-wrap" }}>
                              {msg.content}
                            </span>
                          </div>
                        ))}
                        {isChatting && <div style={{ textAlign: "left" }}><span style={{ display: "inline-block", background: "#f1f5f9", padding: "0.5rem 1rem", borderRadius: "1rem" }}><Loader2 size={14} className="animate-spin" /> 수정 중...</span></div>}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input type="text" className="form-input" style={{ flex: 1, minWidth: 0, margin: 0, background: "white", color: "#111", border: "1px solid #ccc" }} placeholder="예: 독립변인을 온도로 바꿔줘" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleChatSubmit(idx, item)} disabled={isChatting} />
                        <button className="btn" style={{ flexShrink: 0, whiteSpace: "nowrap", padding: "0.75rem 1.5rem", width: "auto" }} onClick={() => handleChatSubmit(idx, item)} disabled={isChatting || !chatInput.trim()}>전송</button>
                      </div>
                    </div>
                  )}
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
                <div style={{ display: 'flex', gap: "0.5rem" }}>
                  <button className="btn" onClick={handleCopyHWP} style={{ background: "#2563eb", color: "white" }}>
                    <Copy size={18} /> HWP(한글) 복사
                  </button>
                  <button className="btn" onClick={handleDownloadPDF} style={{ background: "var(--primary)", color: "white" }}>
                    <Download size={18} /> PDF 다운로드
                  </button>
                </div>
              </div>

              <div className="pdf-container" style={{ background: "white", padding: "2rem", borderRadius: "8px", color: "#333", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                {/* PDF Content Area */}
                <div ref={pdfRef} style={{ padding: "10px" }}>
                  <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "1rem", marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", margin: "0", color: "#111" }}>EcoInquiry 탐구계획서</h1>
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
                      {!detailResult.references || detailResult.references.length === 0 || detailResult.references[0].title.includes("관련자료 없음") ? (
                        <li style={{ listStyle: "none", color: "#666" }}>해당 주제와 직접적으로 연관된 신뢰할 수 있는 학술 논문/자료를 찾지 못했습니다.</li>
                      ) : (
                        detailResult.references.map((r: any, i: number) => {
                          const isDbpiaMain = r.url.includes('dbpia.co.kr') && r.url.length < 35;
                          const linkHref = isDbpiaMain 
                            ? `https://www.dbpia.co.kr/search/topSearch?searchOption=all&query=${encodeURIComponent(r.title)}`
                            : (r.url.startsWith('http') ? r.url : `https://scholar.google.co.kr/scholar?q=${encodeURIComponent(r.title)}`);
                          return (
                            <li key={i} style={{ marginBottom: "0.5rem" }}>
                              <strong>{r.title}</strong> ({r.author}, {r.year})
                              <br />
                              <a href={linkHref} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontSize: "0.9em" }}>
                                {isDbpiaMain ? 'DBpia에서 검색하기' : (r.url.startsWith('http') ? '링크 보기' : `검색: ${r.url}`)}
                              </a>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
        
        <footer style={{ textAlign: "center", marginTop: "2rem", padding: "1rem", fontSize: "0.85rem", opacity: 0.7 }}>
          <p style={{ margin: "0.2rem 0" }}>Made by 김도형 (청학고등학교)</p>
          <p style={{ margin: "0.2rem 0" }}>Powered by 공주대 환경교육과 이재영 교수 연구팀 GEP-AI</p>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsContactOpen(true)} 
            style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", width: "auto", padding: "0.5rem 1rem", fontSize: "0.8rem" }}
          >
            <MessageSquare size={14} /> 개발자에게 문의 / 피드백
          </button>
        </footer>

        {isContactOpen && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "1rem"
          }}>
            <div className="glass-card" style={{ maxWidth: "500px", width: "100%", padding: "2rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)", textAlign: "left" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--primary)" }}>📬 개발자에게 문의 / 피드백</h3>
              <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "1.5rem" }}>
                서비스 이용 중 불편한 점이나 제안 사항을 메일로 알려주세요.
              </p>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" style={{ fontWeight: "bold", marginBottom: "0.5rem", display: "block" }}>피드백 유형</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    { value: "오류 제보", label: "🐛 서비스 오류 / 작동 안 됨" },
                    { value: "데이터 제안", label: "📚 데이터 오류 / 학술 자료 건의" },
                    { value: "기능 제안", label: "💡 기능 제안 / 사용 아이디어" },
                    { value: "기타 문의", label: "💬 기타 문의" }
                  ].map(type => (
                    <label key={type.value} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--foreground)" }}>
                      <input 
                        type="radio" 
                        name="feedbackType" 
                        value={type.value} 
                        checked={feedbackType === type.value} 
                        onChange={() => setFeedbackType(type.value)}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" style={{ fontWeight: "bold", marginBottom: "0.5rem", display: "block" }}>내용</label>
                <textarea 
                  className="form-input" 
                  rows={5} 
                  style={{ background: "white", color: "#111", border: "1px solid #ccc", width: "100%" }}
                  placeholder="오류 현상이나 건의 사항을 자유롭게 적어주세요." 
                  value={feedbackContent} 
                  onChange={e => setFeedbackContent(e.target.value)} 
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" style={{ width: "auto" }} onClick={() => { setIsContactOpen(false); setFeedbackContent(""); }}>취소</button>
                <button className="btn" style={{ width: "auto" }} onClick={handleFeedbackSubmit}>이메일 전송하기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
