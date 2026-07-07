"use client";

import { useState, useEffect } from "react";
import { Settings, ArrowRight, ArrowLeft, Search, CheckCircle2, FlaskConical } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState("");
  const [problem, setProblem] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  const themes = [
    { id: "기후변화", label: "기후변화", icon: "🌍" },
    { id: "생물다양성", label: "생물다양성", icon: "🦋" },
    { id: "자원순환", label: "자원순환", icon: "♻️" },
    { id: "에너지", label: "에너지", icon: "⚡" },
    { id: "생활환경", label: "생활환경", icon: "🏡" },
    { id: "물환경", label: "물환경", icon: "💧" }
  ];

  useEffect(() => {
    const savedKey = localStorage.getItem("geminiApiKey");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem("geminiApiKey", apiKey);
    setShowSettings(false);
  };

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!apiKey) {
      alert("설정(⚙️)에서 Gemini API 키를 먼저 입력해주세요!");
      setShowSettings(true);
      return;
    }

    setStep(3); // Loading step
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, problem, apiKey })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "결과를 가져오는데 실패했습니다.");
      
      setResults(data);
      setStep(4); // Results step
    } catch (err: any) {
      setError(err.message);
      setStep(2); // Go back on error
    } finally {
      setLoading(false);
    }
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
            
            <div style={{ background: "rgba(34, 197, 94, 0.1)", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--primary)" }}>🔑 무료 API 키 발급 안내</h4>
              <ol style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.6 }}>
                <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: "var(--foreground)", textDecoration: "underline", fontWeight: "bold" }}>Google AI Studio</a>에 구글 계정으로 로그인합니다.</li>
                <li>좌측 메뉴의 <strong>[Get API key]</strong> 탭에서 <strong>[Create API key]</strong> 버튼을 누릅니다.</li>
                <li>생성된 영문/숫자 조합의 키(AIzaSy...)를 복사하여 아래에 붙여넣습니다.</li>
              </ol>
              <p style={{ margin: "0.8rem 0 0 0", opacity: 0.8, fontSize: "0.85rem", wordBreak: "keep-all" }}>
                * 해당 키는 선생님의 브라우저 로컬 저장소에만 안전하게 보관되며, 앱 외부로 유출되지 않습니다.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Gemini API Key</label>
              <input 
                type="password" 
                className="form-input" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..." 
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>취소</button>
              <button className="btn" onClick={saveApiKey}>저장</button>
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
              
              {results.hypotheses.map((item: any, idx: number) => (
                <div key={idx} className="result-card">
                  <div className="tag">추천 {idx + 1}</div>
                  <h3>{item.topic}</h3>
                  
                  <h4><FlaskConical size={16} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "-2px" }}/>가설</h4>
                  <p style={{ fontWeight: 600, color: "var(--foreground)", background: "rgba(34, 197, 94, 0.1)", padding: "1rem", borderRadius: "0.5rem" }}>
                    {item.hypothesis}
                  </p>
                  
                  <h4><CheckCircle2 size={16} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "-2px" }}/>탐구 방법 (실험 계획)</h4>
                  <p>{item.method}</p>

                  <div style={{ fontSize: "0.85rem", opacity: 0.7, borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", marginTop: "1rem" }}>
                    <strong>참고 자료/성취기준:</strong> {item.standard}
                  </div>
                </div>
              ))}

              <button className="btn btn-secondary" style={{ marginTop: "1rem" }} onClick={() => { setStep(1); setTheme(""); setProblem(""); setResults(null); }}>
                처음부터 다시하기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
