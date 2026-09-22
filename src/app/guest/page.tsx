"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Msg { role: "user" | "bot"; text: string; }

const BRAND = "#9ca3af";

const TILES = [
  { key:"campus",  icon:"🏫", label:"캠퍼스 안내", q:"캠퍼스 시설 알려줘" },
  { key:"dept",    icon:"🎓", label:"학과 소개",   q:"학과 목록 알려줘" },
  { key:"notices", icon:"📢", label:"공지사항",    q:"최근 공지사항 알려줘" },
];

const sideBtn: React.CSSProperties = {
  width:"100%", padding:"10px 12px", background:"none", border:"none", borderRadius:"8px",
  textAlign:"left", fontSize:"14px", cursor:"pointer", marginBottom:"4px", color:"#374151",
};

export default function GuestPage() {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([{ role:"bot", text:"안녕하세요! 동양미래대학교 챗봇 양동이입니다 🪣\n비회원으로 이용 중입니다. 채팅 기록은 저장되지 않아요.\n학교 관련 정보를 물어보세요!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"home"|"chat">("home");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setView("chat");
    setMsgs(prev => [...prev, { role:"user", text:msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      setMsgs(prev => [...prev, { role:"bot", text: data.answer ?? "응답을 가져오지 못했어요." }]);
    } catch {
      setMsgs(prev => [...prev, { role:"bot", text:"오류가 발생했어요. 다시 시도해 주세요." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Noto Sans KR',sans-serif", background:"#f3f6fb" }}>
      {/* 사이드바 */}
      <aside style={{ width:"260px", background:"#fff", borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", padding:"20px 0" }}>
        <div style={{ padding:"0 20px 20px", borderBottom:"1px solid #e5e7eb" }}>
          <Image src="/image/logo.png" alt="로고" width={160} height={36} style={{ objectFit:"contain" }} />
        </div>
        <div style={{ padding:"16px 12px", flex:1 }}>
          <button onClick={() => { setView("home"); setMsgs([{ role:"bot", text:"안녕하세요! 무엇이든 물어보세요!" }]); }}
            style={sideBtn}>🆕 새 채팅</button>
        </div>
        <div style={{ padding:"16px 12px", borderTop:"1px solid #e5e7eb" }}>
          <p style={{ fontSize:"12px", color:"#9ca3af", padding:"0 8px", marginBottom:"8px" }}>비회원 모드 — 로그인하면 더 많은 기능을 이용할 수 있어요</p>
          <button onClick={() => router.push("/login")} style={{ ...sideBtn, color:BRAND, fontWeight:"600" }}>🔐 로그인하기</button>
        </div>
      </aside>

      {/* 메인 */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <header style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"16px 28px", display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ fontSize:"24px" }}>🪣</span>
          <div>
            <h1 style={{ fontSize:"18px", fontWeight:"bold", color:"#6b7280" }}>양동이 <span style={{ fontSize:"12px", background:"#f3f4f6", color:"#9ca3af", borderRadius:"6px", padding:"2px 8px", marginLeft:"4px" }}>비회원</span></h1>
            <p style={{ fontSize:"12px", color:"#9ca3af" }}>동양미래대학교 학사 AI</p>
          </div>
        </header>

        {view === "home" ? (
          <div style={{ flex:1, overflowY:"auto", padding:"32px 28px" }}>
            <h2 style={{ fontSize:"22px", fontWeight:"bold", marginBottom:"8px", color:"#1f2a37" }}>안녕하세요 👋</h2>
            <p style={{ fontSize:"14px", color:"#6b7280", marginBottom:"24px" }}>비회원으로 이용 중입니다. 로그인하면 시간표·성적 조회 등 더 많은 기능을 이용할 수 있어요.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px", marginBottom:"32px" }}>
              {TILES.map(t => (
                <button key={t.key} onClick={() => send(t.q)}
                  style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:"12px", padding:"24px 20px", textAlign:"left", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                  <span style={{ fontSize:"28px" }}>{t.icon}</span>
                  <p style={{ margin:"10px 0 0", fontWeight:"600", fontSize:"15px", color:"#1f2a37" }}>{t.label}</p>
                </button>
              ))}
            </div>
            <ChatInput input={input} setInput={setInput} send={send} loading={loading} />
          </div>
        ) : (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start", marginBottom:"12px" }}>
                  {m.role === "bot" && <span style={{ fontSize:"20px", marginRight:"8px", alignSelf:"flex-end" }}>🪣</span>}
                  <div style={{
                    maxWidth:"60%", padding:"12px 16px",
                    borderRadius: m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                    background: m.role==="user" ? "#6b7280" : "#fff",
                    color: m.role==="user" ? "#fff" : "#1f2a37",
                    border: m.role==="bot" ? "1px solid #e5e7eb" : "none",
                    fontSize:"14px", whiteSpace:"pre-wrap", lineHeight:"1.6",
                    boxShadow:"0 2px 6px rgba(0,0,0,0.06)"
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                  <span style={{ fontSize:"20px" }}>🪣</span>
                  <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:"16px 16px 16px 4px", padding:"12px 16px", fontSize:"14px", color:"#9ca3af" }}>답변 생성 중...</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding:"16px 28px", borderTop:"1px solid #e5e7eb", background:"#fff" }}>
              <ChatInput input={input} setInput={setInput} send={send} loading={loading} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ChatInput({ input, setInput, send, loading }: { input: string; setInput: (v: string) => void; send: (t?: string) => void; loading: boolean }) {
  return (
    <div style={{ display:"flex", gap:"8px" }}>
      <input
        value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
        placeholder="학교 관련 정보를 물어보세요..."
        style={{ flex:1, height:"48px", padding:"12px 16px", border:"1px solid #e5e7eb", borderRadius:"12px", fontSize:"14px", outline:"none" }}
      />
      <button onClick={() => send()} disabled={loading || !input.trim()}
        style={{ width:"48px", height:"48px", background:"#9ca3af", border:"none", borderRadius:"12px", color:"#fff", fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        ➤
      </button>
    </div>
  );
}
