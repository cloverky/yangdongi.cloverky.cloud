"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const DEPARTMENTS = [
  { group: "기계공학부", items: ["기계공학과","기계설계공학과"] },
  { group: "로봇자동화공학부", items: ["자동화공학과","로봇소프트웨어과"] },
  { group: "전기전자통신공학부", items: ["전기공학과","반도체전자공학과","정보통신공학과","소방안전관리과"] },
  { group: "컴퓨터공학부", items: ["웹응용소프트웨어공학과","컴퓨터소프트웨어공학과","인공지능소프트웨어학과"] },
  { group: "생활환경공학부", items: ["생명화학공학과","바이오융합공학과","건축과","실내건축디자인과","시각디자인과","AR·VR콘텐츠디자인과"] },
  { group: "경영학부", items: ["경영학과","세무회계학과","유통마케팅학과","호텔관광학과","경영정보학과","빅데이터경영과"] },
  { group: "기타", items: ["자유전공학과","교양과"] },
];

// 로그인 화면 입력칸과 같은 모양
const inputStyle: React.CSSProperties = { width:"100%", height:"48px", padding:"12px 14px", marginBottom:"10px", border:"1px solid #e5e7eb", borderRadius:"10px", fontSize:"14px", display:"block", color:"#111827", background:"#f7f8fb" };

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ uid:"", role:"", name:"", email:"", pw:"", pw2:"", department:"" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setErr("");
    const { uid, role, name, email, pw, pw2, department } = form;
    if (!uid||!role||!name||!email||!pw||!pw2||!department) { setErr("필수 항목을 모두 입력해 주세요."); return; }
    if (pw !== pw2) { setErr("비밀번호가 일치하지 않습니다."); return; }
    setLoading(true);
    const res = await fetch("/api/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ uid, role, name, email, password: pw, department }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.ok) { setErr(data.error || "회원가입에 실패했습니다."); return; }
    router.push("/login");
  }

  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", background:"#f0f2f5", fontFamily:"'Noto Sans KR',sans-serif" }}>
      <div style={{ display:"flex", width:"min(1500px,95vw)", height:"700px", background:"#fff", borderRadius:"20px", boxShadow:"0 4px 20px rgba(0,0,0,.1)", overflow:"hidden", position:"relative" }}>
        <div style={{ position:"absolute", top:20, right:20, zIndex:10 }}>
          <Image src="/image/logo.png" alt="동양미래대학교 로고" width={270} height={60} style={{ objectFit:"contain" }} />
        </div>

        <div style={{ flex:0.7, background:"#1E4DA1", color:"#fff", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px" }}>
          <h1 style={{ fontSize:"50px", marginBottom:"6px" }}>회원가입</h1>
          <p style={{ fontSize:"18px" }}>동양미래대학교 챗봇 양동이 회원가입 페이지입니다.</p>
        </div>

        <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center", background:"#f9f9f9" }}>
          {/* autoComplete: 크롬이 로그인용으로 저장한 학번·비밀번호를 가입 칸에 채우지 않게 */}
          <div style={{ width:"340px" }}>
            <h2 style={{ marginBottom:"20px", fontSize:"22px", fontWeight:"bold" }}>회원가입</h2>
            <input style={inputStyle} type="text" placeholder="아이디 (학번/교번)" autoComplete="off" value={form.uid} onChange={set("uid")} />
            <select style={inputStyle} value={form.role} onChange={set("role")}>
              <option value="">구분 선택</option>
              <option value="student">학생</option>
              <option value="faculty">교직원</option>
            </select>
            <input style={inputStyle} type="text" placeholder="이름 (예: 홍길동)" autoComplete="name" value={form.name} onChange={set("name")} />
            <input style={inputStyle} type="email" placeholder="학교 이메일" autoComplete="email" value={form.email} onChange={set("email")} />
            <input style={inputStyle} type="password" placeholder="비밀번호" autoComplete="new-password" value={form.pw} onChange={set("pw")} />
            <input style={inputStyle} type="password" placeholder="비밀번호 확인" autoComplete="new-password" value={form.pw2} onChange={set("pw2")} />
            <select style={inputStyle} value={form.department} onChange={set("department")}>
              <option value="">학과 선택</option>
              {DEPARTMENTS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map(d => <option key={d} value={d}>{d}</option>)}
                </optgroup>
              ))}
            </select>
            {err && <p style={{ color:"#b10017", fontSize:"13px", marginBottom:"6px" }}>{err}</p>}
            <button onClick={submit} disabled={loading}
              style={{ width:"100%", height:"48px", border:"none", borderRadius:"10px", background:"#1E4DA1", color:"#fff", fontSize:"14px", cursor:"pointer", marginTop:"8px" }}>
              {loading ? "처리 중..." : "가입하기"}
            </button>
            <p style={{ marginTop:"12px", fontSize:"14px" }}>
              이미 계정이 있으신가요?{" "}
              <a href="/login" style={{ color:"#1E4DA1", textDecoration:"none" }}>로그인</a>으로 가기
            </p>
          </div>
        </div>

        <div style={{ position:"absolute", top:"50%", left:"48.4%", transform:"translate(-50%,-50%)", width:"1300px", pointerEvents:"none" }}>
          <Image src="/image/yangdongi.png" alt="양동이" width={1300} height={700} style={{ objectFit:"contain", width:"100%" }} />
        </div>
      </div>
    </div>
  );
}
