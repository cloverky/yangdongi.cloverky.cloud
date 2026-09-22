"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"member" | "student">("member");
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      uid,
      password,
      loginType: loginType === "student" ? "student" : "member",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    else router.push("/chat");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🪣</span>
          <div>
            <h1 className="text-xl font-bold">양동이</h1>
            <p className="text-xs text-gray-400">채용 관리</p>
          </div>
        </div>

        <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
          {(["member", "student"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setLoginType(t)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                loginType === t ? "bg-teal-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "member" ? "담당자" : "학생"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {loginType === "student" ? "학번" : "아이디"}
            </label>
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder={loginType === "student" ? "학번 입력" : "아이디 입력"}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-4 border-t border-gray-800 pt-4 space-y-2">
          <p className="text-xs text-gray-500 text-center">심사자 데모 · 별도 입력 없이 즉시 진입</p>
          <button
            onClick={() => signIn("credentials", { uid: "demo_admin", password: "demo1234", loginType: "member", callbackUrl: "/chat" })}
            className="w-full bg-gray-800 hover:bg-gray-700 text-sm py-2 rounded-lg transition-colors"
          >
            담당자 데모 로그인
          </button>
          <button
            onClick={() => signIn("credentials", { uid: "2025001", password: "student1234", loginType: "student", callbackUrl: "/chat" })}
            className="w-full bg-gray-800 hover:bg-gray-700 text-sm py-2 rounded-lg transition-colors"
          >
            학생 데모 로그인
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-teal-400 hover:underline">
            회원가입
          </Link>
          {" · "}
          <Link href="/guest" className="text-teal-400 hover:underline">
            게스트로 입장
          </Link>
        </p>
      </div>
    </div>
  );
}
