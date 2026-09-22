"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Msg { role: "user" | "bot"; text: string; }

const TILES = [
  { key:"timetable",   icon:"🗓️", label:"수업 시간표",    sub:"이번 주 수업 및 강의실" },
  { key:"cert",        icon:"📋", label:"자격증 안내",    sub:"관련 자격증 / 시험 일정" },
  { key:"grades",      icon:"📊", label:"학점 조회",      sub:"누적 / 학기별 성적" },
  { key:"assignments", icon:"🖥️", label:"eClass",         sub:"과제 현황" },
  { key:"notices",     icon:"📢", label:"공지사항",       sub:"학교 공지사항 / 학과 공지사항" },
  { key:"graduation",  icon:"🎓", label:"졸업 학점 이수", sub:"전공 / 교양 이수체크" },
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([{ role:"bot", text:"안녕! 난 양동이야. 어떤 점이 궁금해?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"home"|"chat">("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const user = session?.user as { name?: string; uid?: string; department?: string; role?: string } | undefined;
  const todayStr = new Date().toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric", weekday:"short" });
  const sbW = sidebarOpen ? 260 : 0;

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Noto Sans KR',sans-serif", background:"#f3f6fb", overflow:"hidden" }}>

      {/* 사이드바 */}
      <aside style={{
        position:"fixed", inset:"0 auto 0 0", width:"260px", height:"100vh",
        background:"linear-gradient(180deg,#1565d8,#0f4aa4)",
        color:"#fff", display:"flex", flexDirection:"column", padding:"18px 14px",
        transition:"transform .25s ease", zIndex:50,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px 14px 8px", borderBottom:"1px solid rgba(255,255,255,.18)", marginBottom:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", fontWeight:700, fontSize:"18px" }}>
            <Image src="/image/yangdongi.png" alt="양동이" width={28} height={28} style={{ borderRadius:"50%", background:"#fff" }} />
            <span>양동이</span>
          </div>
        </div>

        <nav style={{ display:"flex", flexDirection:"column", gap:"6px", padding:"10px 0", flex:1 }}>
          {[
            { icon:"💬", label:"새 채팅", onClick:() => { setView("home"); setMsgs([{ role:"bot", text:"안녕! 난 양동이야. 어떤 점이 궁금해?" }]); } },
            { icon:"🏠", label:"메인페이지", onClick:() => setView("home") },
            { icon:"📚", label:"학교 홈페이지", onClick:() => window.open("https://www.dongyang.ac.kr/dmu/index.do") },
          ].map((item, i) => (
            <button key={i} onClick={item.onClick} style={{
              display:"flex", alignItems:"center", gap:"10px", padding:"12px", borderRadius:"10px",
              color:"#eaf2ff", background:"none", border:"none", cursor:"pointer", textAlign:"left", fontSize:"14px",
              transition:"background .18s"
            }}
            onMouseOver={e => (e.currentTarget.style.background="rgba(255,255,255,.14)")}
            onMouseOut={e => (e.currentTarget.style.background="none")}>
              <span style={{ width:"22px", height:"22px", display:"grid", placeItems:"center", background:"rgba(255,255,255,.18)", borderRadius:"8px", fontSize:"13px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderTop:"1px solid rgba(255,255,255,.18)", marginTop:"auto" }}>
          <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"rgba(255,255,255,.2)", display:"grid", placeItems:"center", fontSize:"16px", flexShrink:0 }}>👤</div>
          <div style={{ fontSize:"13px", flex:1, overflow:"hidden" }}>
            <div style={{ fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name ?? "사용자"}</div>
            <div style={{ opacity:.8, fontSize:"12px" }}>{user?.role === "student" ? "학생" : "교직원"}</div>
          </div>
          <button onClick={() => signOut({ callbackUrl:"/login" })} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:"8px", color:"#fff", fontSize:"12px", padding:"6px 10px", cursor:"pointer" }}>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main style={{ minHeight:"100vh", display:"flex", flexDirection:"column", marginLeft: sidebarOpen ? "260px" : "0", transition:"margin-left .25s ease", flex:1, overflow:"hidden" }}>

        {/* 상단바 */}
        <header style={{
          height:"64px", background:"#fff", boxShadow:"0 8px 24px rgba(0,0,0,.06)",
          padding:"0 16px", display:"flex", alignItems:"center", gap:"8px", justifyContent:"space-between",
          position:"sticky", top:0, zIndex:60
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{
              border:"none", background:"transparent", width:"40px", height:"40px", borderRadius:"10px",
              fontSize:"18px", cursor:"pointer", display:"grid", placeItems:"center", color:"#1f2a37"
            }}>☰</button>
            <span style={{ fontWeight:700, fontSize:"18px" }}>양동이 챗봇 1.0</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", color:"#6b7280", fontSize:"14px" }}>
            <span>{todayStr}</span>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div style={{ flex:1, overflowY:"auto", padding:"32px", paddingBottom:"180px", position:"relative" }}>
          {view === "home" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{
                width:"min(1200px, 92%)", margin:"0 auto",
                background:"#f7faff", borderRadius:"24px",
                boxShadow:"inset 0 10px 18px rgba(0,0,0,.03), 0 18px 40px rgba(23,57,132,.08)",
                padding:"38px 36px"
              }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"18px" }}>
                  {TILES.map(t => (
                    <button key={t.key} onClick={() => send(`${t.label} 알려줘`)} style={{
                      background:"#f9fbff", borderRadius:"18px", padding:"28px 24px",
                      boxShadow:"0 3px 0 #e3ecff inset, 0 8px 24px rgba(0,0,0,.06)",
                      display:"flex", gap:"14px", alignItems:"center", cursor:"pointer",
                      border:"none", textAlign:"left", transition:"transform .12s ease, box-shadow .12s ease"
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 10px 28px rgba(0,0,0,.08)"; }}
                    onMouseOut={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 3px 0 #e3ecff inset, 0 8px 24px rgba(0,0,0,.06)"; }}>
                      <div style={{ width:"56px", height:"56px", borderRadius:"14px", display:"grid", placeItems:"center", background:"#e9f1ff", fontSize:"24px", flexShrink:0 }}>
                        {t.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight:750, fontSize:"15px", color:"#1f2a37" }}>{t.label}</div>
                        <div style={{ fontSize:"13px", color:"#6b7280", marginTop:"2px" }}>{t.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === "chat" && (
            <div style={{ maxWidth:"840px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"10px" }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
                  <div style={{
                    maxWidth:"72%", padding:"10px 16px",
                    borderRadius: m.role==="user"?"18px 18px 2px 18px":"18px 18px 18px 2px",
                    background: m.role==="user" ? "#1565d8" : "#dae3f7",
                    color: m.role==="user" ? "#fff" : "#1f2a37",
                    fontSize:"14px", lineHeight:"1.55", whiteSpace:"pre-wrap", wordBreak:"keep-all",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex" }}>
                  <div style={{ background:"#dae3f7", borderRadius:"18px 18px 18px 2px", padding:"10px 16px", fontSize:"14px", color:"#6b7280" }}>답변 생성 중...</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>

      {/* 양동이 캐릭터 + 입력창 */}
      <div style={{
        position:"fixed", bottom:"70px",
        left:`calc(${sbW}px + (100vw - ${sbW}px) / 2 - 120px)`,
        transform:"translateX(-50%)", display:"flex", alignItems:"flex-end", gap:0, zIndex:9999, pointerEvents:"auto"
      }}>
        <Image src="/image/yangdongi.png" alt="양동이" width={160} height={160}
          style={{ objectFit:"contain", filter:"drop-shadow(0 12px 18px rgba(0,0,0,.22))", pointerEvents:"none", position:"relative", top:"40px" }} />
        <div style={{
          position:"relative", height:"64px", display:"grid", gridTemplateColumns:"auto 1fr auto",
          alignItems:"center", gap:"12px",
          background:"#3c4250", color:"#fff", borderRadius:"28px", padding:"10px 12px",
          boxShadow:"0 14px 30px rgba(0,0,0,.24)", marginLeft:"-60px",
          width:`min(760px, calc(100vw - ${sbW}px - 260px))`
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <button style={{ width:"40px", height:"40px", border:"none", borderRadius:"10px", background:"rgba(255,255,255,.12)", color:"#fff", cursor:"pointer" }}>📅</button>
            <button style={{ width:"40px", height:"40px", border:"none", borderRadius:"10px", background:"rgba(255,255,255,.12)", color:"#fff", cursor:"pointer" }}>📘</button>
          </div>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="안녕! 난 양동이야. 어떤 점이 궁금해?"
            style={{ width:"100%", height:"44px", border:"none", outline:"none", background:"rgba(255,255,255,.12)", color:"#fff", borderRadius:"12px", padding:"0 12px", fontSize:"14px" }}
          />
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <button style={{ width:"44px", height:"44px", border:"none", borderRadius:"12px", background:"rgba(255,255,255,.12)", color:"#fff", cursor:"pointer" }}>🎙</button>
            <button onClick={() => send()} style={{ width:"44px", height:"44px", border:"none", borderRadius:"12px", background:"#00a2ff", color:"#fff", fontWeight:800, cursor:"pointer", fontSize:"16px" }}>➜</button>
          </div>
        </div>
      </div>
    </div>
  );
}
