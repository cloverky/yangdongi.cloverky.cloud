"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin() {
    setErr("");
    if (!id || !pw) { setErr("ID와 비밀번호를 입력해 주세요."); return; }
    setLoading(true);
    const res = await signIn("credentials", { uid: id, password: pw, redirect: false });
    setLoading(false);
    if (!res?.ok) { setErr("아이디 또는 비밀번호가 올바르지 않습니다."); return; }
    router.push("/chat");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Noto Sans KR', sans-serif; background: #f0f2f5; }
      `}</style>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", background:"#f0f2f5", fontFamily:"'Noto Sans KR',sans-serif" }}>
        <div style={{ display:"flex", width:"min(1500px,95vw)", height:"700px", background:"#fff", borderRadius:"20px", boxShadow:"0 4px 20px rgba(0,0,0,.1)", overflow:"hidden", position:"relative" }}>
          {/* 로고 */}
          <div style={{ position:"absolute", top:20, right:20, zIndex:10 }}>
            <Image src="/image/logo.png" alt="동양미래대학교 로고" width={270} height={60} style={{ objectFit:"contain" }} />
          </div>

          {/* 왼쪽 파란 패널 */}
          <div style={{ flex:0.7, background:"#1E4DA1", color:"#fff", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px" }}>
            <h1 style={{ fontSize:"50px", marginBottom:"5px" }}>로그인</h1>
            <p style={{ fontSize:"18px" }}>동양미래대학교 챗봇 양동이 로그인 페이지입니다.</p>
          </div>

          {/* 오른쪽 폼 */}
          <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center", background:"#f9f9f9" }}>
            <div style={{ width:"340px" }}>
              <h2 style={{ marginBottom:"20px", fontSize:"22px", fontWeight:"bold" }}>로그인</h2>
              <input
                value={id} onChange={e => setId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doLogin()}
                type="text" placeholder="ID (학번/교번)"
                style={{ width:"100%", height:"48px", padding:"12px 14px", marginBottom:"12px", border:"1px solid #e5e7eb", borderRadius:"10px", fontSize:"14px", background:"#f7f8fb", color:"#111827" }}
              />
              <input
                value={pw} onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doLogin()}
                type="password" placeholder="Password"
                style={{ width:"100%", height:"48px", padding:"12px 14px", marginBottom:"4px", border:"1px solid #e5e7eb", borderRadius:"10px", fontSize:"14px", background:"#f7f8fb", color:"#111827" }}
              />
              {err && <p style={{ color:"#b10017", fontSize:"13px", marginBottom:"8px" }}>{err}</p>}
              <button onClick={doLogin} disabled={loading}
                style={{ width:"100%", height:"48px", border:"none", background:"#1E4DA1", color:"#fff", fontSize:"14px", borderRadius:"10px", cursor:"pointer", marginTop:"8px" }}>
                {loading ? "로그인 중..." : "로그인"}
              </button>
              <button onClick={() => router.push("/guest")}
                style={{ width:"100%", height:"48px", border:"none", background:"#6b7280", color:"#fff", fontSize:"14px", borderRadius:"10px", cursor:"pointer", marginTop:"8px" }}>
                비회원 로그인
              </button>
              <p style={{ marginTop:"12px", fontSize:"14px" }}>
                계정이 없으신가요?{" "}
                <a href="/signup" style={{ color:"#1E4DA1", textDecoration:"none" }}>회원가입</a>을 눌러주세요!
              </p>
            </div>
          </div>

          {/* 양동이 캐릭터 */}
          <div style={{ position:"absolute", top:"50%", left:"48.4%", transform:"translate(-50%,-50%)", width:"1300px", pointerEvents:"none" }}>
            <Image src="/image/yangdongi.png" alt="양동이" width={1300} height={700} style={{ objectFit:"contain", width:"100%" }} />
          </div>
        </div>
      </div>
    </>
  );
}
