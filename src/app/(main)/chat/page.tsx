"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Msg { role: "user" | "bot"; text: string; }

const TILES = [
  { key:"timetable",   icon:"📅", label:"수업 시간표",    sub:"이번 주 수업 및 강의실" },
  { key:"cert",        icon:"📋", label:"자격증 안내",    sub:"추천 자격증/시험일정" },
  { key:"grades",      icon:"🎓", label:"학점 조회",      sub:"누적/학기별 성적" },
  { key:"assignments", icon:"🖥️", label:"eClass",         sub:"과제/공지 바로가기" },
  { key:"library",     icon:"📚", label:"도서관",         sub:"대출/연장/좌석 현황" },
  { key:"graduation",  icon:"🎓", label:"졸업 학점 이수", sub:"전공/교양 이수체크" },
];

const SB_ITEMS = [
  { icon:"📅", label:"오늘",      key:"today" },
  { icon:"📅", label:"지난 7일",  key:"logs" },
  { icon:"👤", label:"개인 정보", key:"personal" },
  { icon:"🎓", label:"학사 일정", key:"schedule", href:"https://www.dongyang.ac.kr/dmu/4749/subview.do" },
  { icon:"📚", label:"도서관",    key:"library" },
  { icon:"⚙️", label:"설정",      key:"settings" },
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([{ role:"bot", text:"안녕! 난 양동이야. 어떤 점이 궁금해?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"home"|"chat">("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeKey, setActiveKey] = useState("today");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
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
  const todayStr = new Date().toLocaleDateString("ko-KR", { year:"numeric", month:"numeric", day:"numeric", weekday:"short" }).replace(/\. /g,"-").replace(".","-");
  const sbW = sidebarOpen ? 260 : 0;

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Pretendard','Noto Sans KR',sans-serif", background:"#f3f6fb", overflow:"hidden" }}>

      {/* 사이드바 */}
      <aside style={{
        position:"fixed", inset:"0 auto 0 0", width:"260px", height:"100vh",
        background:"linear-gradient(180deg,#1565d8,#0f4aa4)",
        color:"#fff", display:"flex", flexDirection:"column", padding:"18px 14px",
        transition:"transform .25s ease", zIndex:50,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)"
      }}>
        {/* 로고 */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px 14px 8px", borderBottom:"1px solid rgba(255,255,255,.18)", marginBottom:"12px" }}>
          <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:"#fff", display:"grid", placeItems:"center", overflow:"hidden", flexShrink:0 }}>
            <Image src="/image/yangdongi.png" alt="양동이" width={72} height={72} style={{ objectFit:"contain", outline:"none" }} />
          </div>
          <span style={{ fontWeight:700, fontSize:"18px" }}>양동이</span>
        </div>

        {/* 메뉴 */}
        <nav style={{ display:"flex", flexDirection:"column", gap:"4px", padding:"4px 0", flex:1, overflowY:"auto" }}>
          {SB_ITEMS.map(item => {
            const isActive = activeKey === item.key;
            return (
              <button key={item.key}
                onClick={() => {
                  setActiveKey(item.key);
                  if (item.key === "today") { setView("home"); setMsgs([{ role:"bot", text:"안녕! 난 양동이야. 어떤 점이 궁금해?" }]); }
                  else if (item.href) window.open(item.href);
                }}
                style={{
                  display:"flex", alignItems:"center", gap:"10px", padding:"12px", borderRadius:"10px",
                  color: isActive ? "#1565d8" : "#eaf2ff",
                  background: isActive ? "#fff" : "none",
                  border:"none", outline:"none", cursor:"pointer", textAlign:"left", fontSize:"14px",
                  transition:"background .18s", width:"100%", fontWeight: isActive ? 600 : 400
                }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background="rgba(255,255,255,.14)"; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background="none"; }}>
                <span style={{ width:"22px", height:"22px", display:"grid", placeItems:"center", background: isActive ? "rgba(21,101,216,.12)" : "rgba(255,255,255,.18)", borderRadius:"8px", fontSize:"13px", flexShrink:0 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 하단 사용자 정보 */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px", borderTop:"1px solid rgba(255,255,255,.18)", marginTop:"8px" }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"rgba(255,255,255,.2)", display:"grid", placeItems:"center", fontSize:"18px", flexShrink:0 }}>👤</div>
          <div style={{ flex:1, overflow:"hidden" }}>
            <div style={{ fontWeight:600, fontSize:"14px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name ?? "사용자"}</div>
            <div style={{ fontSize:"12px", opacity:.85 }}>{user?.role === "student" ? "학생" : "교직원"}{user?.department ? ` · ${user.department}` : ""}</div>
          </div>
          <button onClick={() => signOut({ callbackUrl:"/login" })} title="로그아웃" style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:"8px", color:"#fff", fontSize:"11px", padding:"4px 8px", cursor:"pointer", whiteSpace:"nowrap" }}>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main style={{ minHeight:"100vh", display:"flex", flexDirection:"column", marginLeft: sidebarOpen ? "260px" : "0", transition:"margin-left .25s ease", flex:1, overflow:"hidden" }}>

        {/* 상단바 */}
        <header style={{
          height:"64px", background:"#fff", boxShadow:"0 8px 24px rgba(0,0,0,.06)",
          padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
          position:"sticky", top:0, zIndex:60
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{ border:"none", background:"transparent", width:"40px", height:"40px", borderRadius:"10px", fontSize:"18px", cursor:"pointer", display:"grid", placeItems:"center", color:"#1f2a37", outline:"none" }}>☰</button>
            <span style={{ fontWeight:700, fontSize:"18px", color:"#1f2a37" }}>양동이 챗봇 1.0</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <span style={{ color:"#6b7280", fontSize:"14px" }}>{todayStr}</span>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div style={{ flex:1, overflowY:"auto", padding:"32px", paddingBottom:"190px" }}>
          {view === "home" && (
            <div style={{ display:"flex", justifyContent:"center" }}>
              <div style={{
                width:"min(1100px, 100%)",
                background:"#f7faff", borderRadius:"24px",
                boxShadow:"inset 0 10px 18px rgba(0,0,0,.03), 0 18px 40px rgba(23,57,132,.08)",
                padding:"36px 32px"
              }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
                  {TILES.map(t => (
                    <button key={t.key} onClick={() => send(`${t.label} 알려줘`)} style={{
                      background:"#f9fbff", borderRadius:"18px", padding:"28px 22px",
                      boxShadow:"0 3px 0 #e3ecff inset, 0 8px 24px rgba(0,0,0,.06)",
                      display:"flex", gap:"16px", alignItems:"center", cursor:"pointer",
                      border:"none", outline:"none", textAlign:"left",
                      transition:"transform .12s ease, box-shadow .12s ease"
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 10px 28px rgba(0,0,0,.1)"; }}
                    onMouseOut={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 3px 0 #e3ecff inset, 0 8px 24px rgba(0,0,0,.06)"; }}>
                      <div style={{ width:"52px", height:"52px", borderRadius:"14px", display:"grid", placeItems:"center", background:"#eef1f7", fontSize:"22px", flexShrink:0 }}>
                        {t.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:"15px", color:"#1f2a37", whiteSpace:"nowrap" }}>{t.label}</div>
                        <div style={{ fontSize:"13px", color:"#6b7280", marginTop:"3px" }}>{t.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === "chat" && (
            <div style={{ maxWidth:"820px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"10px" }}>
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

      {/* 양동이 캐릭터 + 입력창 (하단 고정) */}
      <div style={{
        position:"fixed", bottom:"60px",
        left:`calc(${sbW}px + (100vw - ${sbW}px) / 2 - 120px)`,
        transform:"translateX(-50%)",
        display:"flex", alignItems:"flex-end", zIndex:9999, pointerEvents:"auto"
      }}>
        <Image src="/image/yangdongi.png" alt="양동이" width={150} height={150}
          style={{ objectFit:"contain", filter:"drop-shadow(0 12px 18px rgba(0,0,0,.22))", pointerEvents:"none", position:"relative", top:"36px", marginRight:"-50px" }} />
        <div style={{
          height:"64px", display:"grid", gridTemplateColumns:"auto 1fr auto",
          alignItems:"center", gap:"10px",
          background:"#3c4250", borderRadius:"28px", padding:"10px 14px",
          boxShadow:"0 14px 30px rgba(0,0,0,.24)",
          width:`min(780px, calc(100vw - ${sbW}px - 220px))`
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <button style={{ width:"40px", height:"40px", border:"none", outline:"none", borderRadius:"10px", background:"rgba(255,255,255,.12)", color:"#fff", cursor:"pointer", fontSize:"16px" }}>🌐</button>
            <button style={{ width:"40px", height:"40px", border:"none", outline:"none", borderRadius:"10px", background:"rgba(255,255,255,.12)", color:"#fff", cursor:"pointer", fontSize:"16px" }}>📘</button>
            <button style={{ width:"40px", height:"40px", border:"none", outline:"none", borderRadius:"10px", background:"rgba(255,255,255,.12)", color:"#fff", cursor:"pointer", fontSize:"16px" }}>⚙️</button>
          </div>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="안녕! 난 양동이야. 어떤 점이 궁금해?"
            style={{ width:"100%", height:"44px", border:"none", outline:"none", background:"rgba(255,255,255,.12)", color:"#fff", borderRadius:"12px", padding:"0 14px", fontSize:"14px" }}
          />
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <button style={{ width:"44px", height:"44px", border:"none", outline:"none", borderRadius:"12px", background:"rgba(255,255,255,.12)", color:"#fff", cursor:"pointer", fontSize:"18px" }}>🎙</button>
            <button onClick={() => send()} style={{ width:"44px", height:"44px", border:"none", outline:"none", borderRadius:"12px", background:"#00a2ff", color:"#fff", fontWeight:800, cursor:"pointer", fontSize:"18px", display:"grid", placeItems:"center" }}>➜</button>
          </div>
        </div>
      </div>
    </div>
  );
}
