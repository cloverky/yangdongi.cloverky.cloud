"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Msg { role: "user" | "bot"; text: string; }

const BRAND = "#1565d8";

const TILES = [
  { key:"timetable", icon:"📅", label:"수업 시간표" },
  { key:"grades",    icon:"📊", label:"학점 조회" },
  { key:"cert",      icon:"📋", label:"자격증 안내" },
  { key:"notices",   icon:"📢", label:"공지사항" },
  { key:"assignments",icon:"📝", label:"eClass 과제" },
  { key:"campus",    icon:"🏫", label:"캠퍼스 안내" },
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([{ role:"bot", text:"안녕하세요! 동양미래대학교 챗봇 양동이입니다 🪣\n무엇이든 물어보세요!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"home"|"chat">("home");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status]);
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

  if (status === "loading") return null;

  const user = session?.user as { name?: string; role?: string } | undefined;

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
          <button onClick={() => setView("chat")} style={sideBtn}>💬 채팅</button>
          <button onClick={() => window.open("https://www.dongyang.ac.kr")} style={sideBtn}>🏫 학교 홈페이지</button>
        </div>
        <div style={{ padding:"16px 12px", borderTop:"1px solid #e5e7eb" }}>
          <p style={{ fontSize:"13px", color:"#6b7280", padding:"0 8px", marginBottom:"8px" }}>{user?.name ?? ""} ({user?.role === "student" ? "학생" : "교직원"})</p>
          <button onClick={() => signOut({ callbackUrl:"/login" })} style={{ ...sideBtn, color:"#ef4444" }}>로그아웃</button>
        </div>
      </aside>

      {/* 메인 */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* 헤더 */}
        <header style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"16px 28px", display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ fontSize:"24px" }}>🪣</span>
          <div>
            <h1 style={{ fontSize:"18px", fontWeight:"bold", color:BRAND }}>양동이</h1>
            <p style={{ fontSize:"12px", color:"#9ca3af" }}>동양미래대학교 학사 AI</p>
          </div>
        </header>

        {view === "home" ? (
          /* 홈 — 6개 타일 */
          <div style={{ flex:1, overflowY:"auto", padding:"32px 28px" }}>
            <h2 style={{ fontSize:"22px", fontWeight:"bold", marginBottom:"24px", color:"#1f2a37" }}>안녕하세요, {user?.name ?? ""}님 👋</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px", marginBottom:"32px" }}>
              {TILES.map(t => (
                <button key={t.key} onClick={() => send(`${t.label} 알려줘`)}
                  style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:"12px", padding:"24px 20px", textAlign:"left", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", transition:"box-shadow .2s" }}
                  onMouseOver={e => (e.currentTarget.style.boxShadow="0 4px 16px rgba(21,101,216,0.15)")}
                  onMouseOut={e => (e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)")}>
                  <span style={{ fontSize:"28px" }}>{t.icon}</span>
                  <p style={{ margin:"10px 0 0", fontWeight:"600", fontSize:"15px", color:"#1f2a37" }}>{t.label}</p>
                </button>
              ))}
            </div>

            {/* 채팅 입력 (홈에서도) */}
            <ChatInput input={input} setInput={setInput} send={send} loading={loading} />
          </div>
        ) : (
          /* 채팅 뷰 */
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start", marginBottom:"12px" }}>
                  {m.role === "bot" && <span style={{ fontSize:"20px", marginRight:"8px", alignSelf:"flex-end" }}>🪣</span>}
                  <div style={{
                    maxWidth:"60%", padding:"12px 16px", borderRadius: m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                    background: m.role==="user" ? BRAND : "#fff",
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
        placeholder="학사 정보를 물어보세요..."
        style={{ flex:1, height:"48px", padding:"12px 16px", border:"1px solid #e5e7eb", borderRadius:"12px", fontSize:"14px", outline:"none" }}
      />
      <button onClick={() => send()} disabled={loading || !input.trim()}
        style={{ width:"48px", height:"48px", background: BRAND, border:"none", borderRadius:"12px", color:"#fff", fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        ➤
      </button>
    </div>
  );
}

const sideBtn: React.CSSProperties = {
  width:"100%", padding:"10px 12px", background:"none", border:"none", borderRadius:"8px",
  textAlign:"left", fontSize:"14px", cursor:"pointer", marginBottom:"4px", color:"#374151",
};
