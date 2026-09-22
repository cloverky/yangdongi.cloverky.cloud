"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ uid: "", name: "", department: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: form.uid, name: form.name, department: form.department, email: form.email, password: form.password }),
    });
    setLoading(false);
    if (res.ok) router.push("/login");
    else { const d = await res.json(); setError(d.error ?? "오류가 발생했습니다."); }
  }

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type={type} value={form[key]} placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-8">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        <h1 className="text-xl font-bold mb-6">회원가입</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {field("uid", "아이디", "text", "사용할 아이디")}
          {field("name", "이름", "text", "이름")}
          {field("department", "학과", "text", "학과명")}
          {field("email", "이메일", "email", "이메일 (선택)")}
          {field("password", "비밀번호", "password", "8자 이상")}
          {field("confirm", "비밀번호 확인", "password", "비밀번호 재입력")}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors">
            {loading ? "처리 중..." : "가입하기"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-teal-400 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
