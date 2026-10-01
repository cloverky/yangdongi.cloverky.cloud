"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Msg { role: "user" | "bot"; text: string; }

const TILES = [
  { key:"timetable",   icon:"📅", label:"수업 시간표",    sub:"이번 주 수업 및 강의실" },
  { key:"grades",      icon:"🎓", label:"학점 조회",      sub:"누적/학기별 성적" },
  { key:"assignments", icon:"🖥️", label:"eClass",         sub:"과제/공지 바로가기", href:"https://eclass.dongyang.ac.kr/" },
  { key:"graduation",  icon:"🎓", label:"졸업 이수 학점", sub:"전공/교양 이수체크" },
];

// 비회원은 로그인 없이 답할 수 있는 것만 (캠퍼스·학과·공지)
const GUEST_TILES = [
  { key:"campus",      icon:"🏫", label:"캠퍼스 안내",    sub:"건물 위치와 가는 길" },
  { key:"departments", icon:"🎓", label:"학과 소개",      sub:"학과 목록" },
  { key:"notices",     icon:"📢", label:"공지사항",       sub:"최근 학교 공지" },
  { key:"assignments", icon:"🖥️", label:"eClass",         sub:"과제/공지 바로가기", href:"https://eclass.dongyang.ac.kr/" },
];

const SB_ITEMS = [
  { icon:"📅", label:"오늘",      key:"today" },
  { icon:"🕘", label:"지난 7일",  key:"logs" },
  { icon:"🎓", label:"학사 일정", key:"schedule", href:"https://www.dongyang.ac.kr/dmu/4749/subview.do" },
  { icon:"📚", label:"도서관",    key:"library", href:"https://lib.dongyang.ac.kr/" },
  { icon:"⚙️", label:"설정",      key:"settings" },
];

// 키워드 챗봇이라 물어보는 법을 보여준다 (src/lib/chatbot.ts 키워드와 맞출 것)
const EXAMPLES = [
  "오늘 수업 뭐야?",
  "화요일 시간표 알려줘",
  "내 학점 알려줘",
  "졸업까지 몇 학점 남았어?",
  "보건실 어디야?",
  "3호관 가는 길 알려줘",
  "최근 공지사항 알려줘",
  "마감 임박한 과제 있어?",
];

const GUEST_EXAMPLES = [
  "보건실 어디야?",
  "3호관 가는 길 알려줘",
  "서점 어디 있어?",
  "최근 공지사항 알려줘",
  "학과 목록 보여줘",
  "넌 누구야?",
];

// 비회원 사이드바에서 뺄 메뉴 (내 기록·내 정보가 필요한 것)
const MEMBER_ONLY = ["logs", "settings"];

const BAR_H = 104;              // 입력창 높이(px)
const CHIPS_H = 46;             // 입력창 아래 칩 줄 높이(간격 포함)
const HOME_BAR_TOP = "40vh";    // 홈 화면에서 입력창 위쪽 위치

interface Log { id: number; message: string; speaker: "user"|"bot"; createdAt: string; }

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { month:"long", day:"numeric", weekday:"short" });

/** 날짜별 대화창으로 묶는다. 날짜는 최신순, 안의 메시지는 시간순. */
function toDays(logs: Log[]) {
  const days: Log[][] = [];
  for (const l of logs) {
    const last = days.at(-1);
    if (last && fmtDay(last[0].createdAt) === fmtDay(l.createdAt)) last.push(l);
    else days.push([l]);
  }
  return days.reverse();
}

/** 답변 속 [[campus-map]] 표시를 캠퍼스 지도 이미지로 바꿔 그린다 (src/lib/campus.ts). */
function MsgText({ text }: { text: string }) {
  if (!text.includes("[[campus-map]]")) return <>{text}</>;
  return (
    <>
      {text.replace("[[campus-map]]", "").trimEnd()}
      <a href="/image/campus-map.png" target="_blank" rel="noreferrer" style={{ display:"block", marginTop:"10px" }}>
        <Image src="/image/campus-map.png" alt="캠퍼스 지도" width={1057} height={478} style={{ width:"100%", height:"auto", borderRadius:"10px", background:"#fff" }} />
      </a>
    </>
  );
}

/** 로그인 채팅(/chat)과 비회원(/guest)이 같이 쓰는 화면. guest 면 개인 기능을 뺀다. */
export default function ChatApp({ guest = false }: { guest?: boolean }) {
  const tiles = guest ? GUEST_TILES : TILES;
  const examples = guest ? GUEST_EXAMPLES : EXAMPLES;
  const sbItems = guest ? SB_ITEMS.filter(i => !MEMBER_ONLY.includes(i.key)) : SB_ITEMS;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([{ role:"bot", text:"안녕! 난 양동이야. 어떤 점이 궁금해?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"home"|"chat"|"settings"|"logs">("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeKey, setActiveKey] = useState("today");
  const [profile, setProfile] = useState<[string, string][] | null>(null);
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [openDays, setOpenDays] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const [listening, setListening] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const recogRef = useRef<{ stop(): void } | null>(null);

  // 브라우저 내장 음성 인식(Web Speech API) — 크롬·엣지·사파리 지원, 파이어폭스 미지원
  function toggleMic() {
    if (listening) { recogRef.current?.stop(); return; }
    const w = window as unknown as Record<string, new () => any>;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { alert("이 브라우저는 음성 입력을 지원하지 않아요. 크롬에서 사용해 주세요."); return; }
    const r = new SR();
    r.lang = "ko-KR";
    r.interimResults = true;
    r.onresult = (e: any) => setInput(Array.from(e.results as ArrayLike<any>).map(x => x[0].transcript).join(""));
    r.onend = () => setListening(false);
    r.onerror = (e: any) => { setListening(false); if (e.error === "not-allowed") alert("마이크 권한을 허용해 주세요."); };
    r.start();
    recogRef.current = r;
    setListening(true);
  }

  useEffect(() => { if (!guest && status === "unauthenticated") router.push("/login"); }, [guest, status, router]);
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

  // ids 가 없으면 전체 삭제
  async function deleteLogs(ids?: number[]) {
    if (!confirm(ids ? "선택한 대화를 삭제할까요?" : "전체 대화 기록을 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await fetch("/api/history", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ids }) });
    if (!res.ok) return alert("삭제하지 못했어요. 다시 시도해 주세요.");
    if (ids) setLogs(prev => prev?.filter(l => !ids.includes(l.id)) ?? null);
    else { setLogs(null); alert("전체 대화 기록을 삭제했어요."); }
  }

  async function deleteAccount() {
    if (!confirm("정말 탈퇴할까요? 계정과 대화 기록이 모두 삭제되고 되돌릴 수 없어요.")) return;
    const res = await fetch("/api/me", { method:"DELETE" });
    if (!res.ok) return alert("처리하지 못했어요. 다시 시도해 주세요.");
    signOut({ callbackUrl:"/login" });
  }

  if (status === "loading") return null;
  const user = session?.user as { name?: string; uid?: string; department?: string; role?: string } | undefined;
  const todayStr = new Date().toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric", weekday:"short" });
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
        <div onClick={() => { setView("home"); setActiveKey("today"); }} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px 14px 8px", borderBottom:"1px solid rgba(255,255,255,.18)", marginBottom:"12px", cursor:"pointer" }}>
          <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:"#fff", display:"grid", placeItems:"center", overflow:"hidden", flexShrink:0 }}>
            <Image src="/image/yangdongi.png" alt="양동이" width={72} height={72} style={{ objectFit:"contain", outline:"none" }} />
          </div>
          <span style={{ fontWeight:700, fontSize:"18px" }}>양동이</span>
        </div>

        {/* 메뉴 */}
        <nav style={{ display:"flex", flexDirection:"column", gap:"4px", padding:"4px 0", flex:1, overflowY:"auto" }}>
          {sbItems.map(item => {
            const isActive = activeKey === item.key;
            return (
              <button key={item.key}
                onClick={() => {
                  setActiveKey(item.key);
                  if (item.key === "today") { setView("home"); setMsgs([{ role:"bot", text:"안녕! 난 양동이야. 어떤 점이 궁금해?" }]); }
                  else if (item.key === "logs") {
                    setView("logs");
                    setLogs(null);
                    fetch("/api/history").then(r => r.ok ? r.json() : []).then(setLogs);
                  }
                  else if (item.key === "settings") {
                    setView("settings");
                    if (!profile) fetch("/api/me").then(r => r.ok ? r.json() : []).then(setProfile);
                  }
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
          {guest ? (
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:"14px" }}>비회원</div>
              <button onClick={() => router.push("/login")}
                style={{ marginTop:"4px", padding:0, border:"none", background:"none", color:"#fff", fontSize:"12px", textDecoration:"underline", cursor:"pointer", opacity:.9 }}>
                로그인하고 시간표·학점 보기
              </button>
            </div>
          ) : (
            <div style={{ flex:1, overflow:"hidden" }}>
              <div style={{ fontWeight:600, fontSize:"14px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name ?? "사용자"}</div>
              <div style={{ fontSize:"12px", opacity:.85 }}>{user?.role === "student" ? "학생" : "교직원"}</div>
              {user?.department && <div style={{ fontSize:"12px", opacity:.85 }}>{user.department}</div>}
            </div>
          )}
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
        <div style={{ flex:1, overflowY:"auto", padding:"32px", paddingBottom:`${BAR_H + CHIPS_H + 48}px` }}>
          {view === "home" && (
            // 인사말은 입력창(top: HOME_BAR_TOP) 바로 위에 오도록 여백을 맞춘다
            <div style={{ maxWidth:"760px", margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center" }}>
              {/* 문구를 입력창 가운데에 맞추고, 캐릭터는 문구 왼쪽에 붙여 둔다 (가운데 정렬 계산에서 빠지게) */}
              <div style={{ marginTop:`calc(${HOME_BAR_TOP} - 96px - 90px)`, position:"relative" }}>
                <Image src="/image/yangdongi.png" alt="" width={96} height={96}
                  style={{ objectFit:"contain", position:"absolute", right:"100%", top:"50%", transform:"translateY(-50%)", marginRight:"-6px" }} />
                <span style={{ fontFamily:"'Pretendard Variable', Pretendard, 'Noto Sans KR', sans-serif", fontSize:"30px", fontWeight:600, color:"#1f2a37", letterSpacing:"-0.6px", whiteSpace:"nowrap" }}>안녕! 난 양동이야. 어떤 점이 궁금해?</span>
              </div>
            </div>
          )}

          {view === "settings" && (
            <div style={{ maxWidth:"560px", margin:"0 auto", background:"#fff", borderRadius:"18px", boxShadow:"0 8px 24px rgba(0,0,0,.06)", padding:"28px 32px" }}>
              <div style={{ fontWeight:700, fontSize:"18px", color:"#1f2a37", marginBottom:"18px" }}>설정</div>
              <div style={{ fontWeight:600, fontSize:"13px", color:"#6b7280", marginBottom:"6px" }}>내 정보</div>
              {!profile ? <div style={{ color:"#6b7280", fontSize:"14px" }}>불러오는 중...</div>
                : !profile.length ? <div style={{ color:"#6b7280", fontSize:"14px" }}>정보를 불러오지 못했어요.</div>
                : profile.map(([k, v]) => (
                  <div key={k} style={{ display:"flex", padding:"12px 0", borderTop:"1px solid #eef1f7", fontSize:"14px" }}>
                    <span style={{ width:"110px", color:"#6b7280" }}>{k}</span>
                    <span style={{ color:"#1f2a37", fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              <div style={{ fontWeight:600, fontSize:"13px", color:"#6b7280", margin:"24px 0 10px" }}>계정</div>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => signOut({ callbackUrl:"/login" })} style={{ padding:"10px 16px", borderRadius:"10px", border:"1px solid #d7deea", background:"#fff", color:"#1f2a37", fontSize:"14px", cursor:"pointer" }}>
                  로그아웃
                </button>
                <button onClick={() => deleteLogs()} style={{ padding:"10px 16px", borderRadius:"10px", border:"1px solid #f3c4c4", background:"#fff5f5", color:"#d33", fontSize:"14px", cursor:"pointer" }}>
                  전체 대화 삭제
                </button>
                {/* 학생은 학적 데이터라 탈퇴 없음 */}
                {user?.role !== "student" && (
                  <button onClick={deleteAccount} style={{ padding:"10px 16px", borderRadius:"10px", border:"1px solid #f3c4c4", background:"#fff5f5", color:"#d33", fontSize:"14px", cursor:"pointer" }}>
                    회원 탈퇴
                  </button>
                )}
              </div>
            </div>
          )}

          {view === "logs" && (
            <div style={{ maxWidth:"820px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"10px" }}>
              <div style={{ fontWeight:700, fontSize:"18px", color:"#1f2a37", marginBottom:"8px" }}>지난 7일 대화</div>
              {!logs ? <div style={{ color:"#6b7280", fontSize:"14px" }}>불러오는 중...</div>
                : !logs.length ? <div style={{ color:"#6b7280", fontSize:"14px" }}>최근 7일간 대화가 없어요.</div>
                : toDays(logs).map(day => {
                      const open = openDays.has(day[0].id);
                      const questions = day.filter(l => l.speaker === "user");
                      return (
                      <div key={day[0].id} style={{ background:"#fff", borderRadius:"16px", border:"1px solid #e6ebf3", boxShadow: open ? "0 8px 24px rgba(23,57,132,.08)" : "0 1px 2px rgba(0,0,0,.03)", transition:"box-shadow .15s" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"16px 18px", cursor:"pointer" }}
                          onClick={() => setOpenDays(prev => { const s = new Set(prev); if (open) s.delete(day[0].id); else s.add(day[0].id); return s; })}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:600, fontSize:"15px", color:"#1f2a37" }}>{fmtDay(day[0].createdAt)}</div>
                            {!open && questions[0] && <div style={{ fontSize:"13px", color:"#8a94a6", marginTop:"4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{questions[0].message}{questions.length > 1 ? ` 외 ${questions.length - 1}개` : ""}</div>}
                          </div>
                          <span style={{ fontSize:"12px", color:"#9aa4b2", whiteSpace:"nowrap" }}>질문 {questions.length}개</span>
                          <button onClick={e => { e.stopPropagation(); deleteLogs(day.map(l => l.id)); }} title="이 날 대화 삭제"
                            style={{ width:"30px", height:"30px", flexShrink:0, border:"none", borderRadius:"8px", background:"transparent", color:"#9aa4b2", cursor:"pointer", fontSize:"14px" }}
                            onMouseOver={e => { e.currentTarget.style.background="#fdecec"; }}
                            onMouseOut={e => { e.currentTarget.style.background="transparent"; }}>🗑</button>
                          <span style={{ color:"#9aa4b2", fontSize:"12px", transform: open ? "rotate(180deg)" : "none", transition:"transform .15s" }}>▾</span>
                        </div>
                        {open && <div style={{ display:"flex", flexDirection:"column", gap:"8px", padding:"4px 18px 18px", borderTop:"1px solid #eef1f7", paddingTop:"14px" }}>
                        {day.map((l, i) => (
                          <div key={l.id} style={{ display:"flex", alignItems:"center", gap:"6px", justifyContent: l.speaker==="user"?"flex-end":"flex-start", marginTop: l.speaker==="user" && i > 0 ? "8px" : 0 }}>
                            {/* 질문 옆 삭제 = 질문 + 바로 뒤 답변 */}
                            {l.speaker === "user" && (
                              <button onClick={() => deleteLogs(day[i+1]?.speaker === "bot" ? [l.id, day[i+1].id] : [l.id])} title="이 질문과 답변 삭제"
                                style={{ width:"26px", height:"26px", border:"none", borderRadius:"8px", background:"transparent", color:"#9aa4b2", cursor:"pointer", fontSize:"12px" }}
                                onMouseOver={e => { e.currentTarget.style.background="#fdecec"; }}
                                onMouseOut={e => { e.currentTarget.style.background="transparent"; }}>🗑</button>
                            )}
                            <div style={{
                              maxWidth:"72%", padding:"10px 16px",
                              borderRadius: l.speaker==="user"?"18px 18px 2px 18px":"18px 18px 18px 2px",
                              background: l.speaker==="user" ? "#1565d8" : "#dae3f7",
                              color: l.speaker==="user" ? "#fff" : "#1f2a37",
                              fontSize:"14px", lineHeight:"1.55", whiteSpace:"pre-wrap", wordBreak:"keep-all",
                            }}>
                              <MsgText text={l.message} />
                            </div>
                          </div>
                        ))}
                        </div>}
                      </div>
                      );
                    })}
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
                    <MsgText text={m.text} />
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

      {/* 입력창 — 홈에선 화면 가운데, 대화가 시작되면 하단으로 내려온다 */}
      <div style={{
        position:"fixed", zIndex:9999,
        // 대화 중엔 아래 붙은 칩(CHIPS_H)까지 화면 안에 들어오게 그만큼 더 올린다
        top: view === "home" ? HOME_BAR_TOP : `calc(100vh - ${BAR_H + CHIPS_H + 16}px)`,
        left:`calc(${sbW}px + (100vw - ${sbW}px) / 2)`,
        transform:"translateX(-50%)",
        transition:"top .4s ease",
        width:`min(760px, calc(100vw - ${sbW}px - 48px))`, height:`${BAR_H}px`,
        display:"flex", flexDirection:"column", justifyContent:"space-between",
        background:"#fff", border:"1px solid #e3e7ee", borderRadius:"20px",
        boxShadow:"0 4px 20px rgba(31,42,55,.06)", padding:"14px 14px 10px 18px"
      }}>
        {/* 바로가기 칩 — 입력창에 붙어 다녀서 홈·대화 화면 어디서나 보인다 */}
        <div style={{ position:"absolute", top:"calc(100% + 10px)", left:0, right:0, display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"8px" }}>
          {tiles.map(t => (
            <button key={t.key} onClick={() => "href" in t ? window.open(t.href) : send(`${t.label} 알려줘`)} title={t.sub}
              style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"999px", border:"1px solid #e3e7ee", background:"#fff", color:"#374151", fontSize:"13px", cursor:"pointer", transition:"background .15s" }}
              onMouseOver={e => { e.currentTarget.style.background="#f3f5f9"; }}
              onMouseOut={e => { e.currentTarget.style.background="#fff"; }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
          placeholder="양동이에게 물어보세요"
          style={{ width:"100%", border:"none", outline:"none", background:"transparent", color:"#1f2a37", fontSize:"15px" }}
        />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ position:"relative" }}>
            <button onClick={() => setShowExamples(v => !v)} title="질문 예시"
              style={{ height:"34px", padding:"0 10px", border:"none", borderRadius:"8px", background: showExamples ? "#f3f5f9" : "transparent", cursor:"pointer", fontSize:"13px", color:"#4b5563", display:"flex", alignItems:"center", gap:"6px" }}
              onMouseOver={e => { e.currentTarget.style.background="#f3f5f9"; }}
              onMouseOut={e => { if (!showExamples) e.currentTarget.style.background="transparent"; }}>
              📘 질문 예시
            </button>
            {showExamples && (
              // 홈에선 입력창이 화면 가운데라 위로 열면 헤더를 덮는다 → 아래로 연다
              <div style={{ position:"absolute", ...(view === "home" ? { top:"calc(100% + 12px)" } : { bottom:"calc(100% + 12px)" }), left:0, width:"280px", background:"#fff", border:"1px solid #e3e7ee", borderRadius:"14px", boxShadow:"0 10px 30px rgba(31,42,55,.12)", padding:"8px" }}>
                <div style={{ fontSize:"12px", color:"#9aa4b2", padding:"6px 10px" }}>이런 걸 물어볼 수 있어요</div>
                {examples.map(q => (
                  <button key={q} onClick={() => { setInput(q); setShowExamples(false); }}
                    style={{ display:"block", width:"100%", textAlign:"left", padding:"9px 10px", border:"none", borderRadius:"8px", background:"transparent", cursor:"pointer", fontSize:"14px", color:"#1f2a37" }}
                    onMouseOver={e => { e.currentTarget.style.background="#f3f5f9"; }}
                    onMouseOut={e => { e.currentTarget.style.background="transparent"; }}>{q}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <button onClick={toggleMic} title={listening ? "음성 입력 끄기" : "음성으로 입력"}
              style={{ width:"34px", height:"34px", border:"none", borderRadius:"10px", cursor:"pointer", display:"grid", placeItems:"center",
                background: listening ? "#fdecec" : "transparent", color: listening ? "#e5484d" : "#4b5563", transition:"background .15s" }}
              onMouseOver={e => { if (!listening) e.currentTarget.style.background="#f3f5f9"; }}
              onMouseOut={e => { if (!listening) e.currentTarget.style.background="transparent"; }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" />
              </svg>
            </button>
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{ width:"34px", height:"34px", border:"none", borderRadius:"10px", background: input.trim() ? "#1565d8" : "#c9d3e3", color:"#fff", cursor: input.trim() ? "pointer" : "default", fontSize:"15px", display:"grid", placeItems:"center", transition:"background .15s" }}>➜</button>
          </div>
        </div>
      </div>
    </div>
  );
}
