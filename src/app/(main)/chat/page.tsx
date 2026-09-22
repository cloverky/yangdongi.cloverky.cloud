"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "오류가 발생했습니다. 다시 시도해 주세요." }]);
    }
    setLoading(false);
  }

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪣</span>
          <span className="font-semibold text-sm">양동이</span>
          <span className="text-xs text-gray-500">동양미래대학교 학사 AI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            로그아웃
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-4xl mb-4">🪣</p>
            <p className="font-medium">동양미래대학교 학사 AI에 오신 것을 환영합니다</p>
            <p className="text-sm mt-1">시간표, 성적, 공지사항 등 학사 정보를 물어보세요</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["오늘 시간표 알려줘", "이번 학기 성적은?", "최근 공지사항 뭐 있어?", "과제 마감일 알려줘"].map((q) => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === "user" ? "bg-teal-600 text-white" : "bg-gray-800 text-gray-100"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-5 shrink-0">
        <div className="flex gap-2 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="학사 정보를 물어보세요..."
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-500"
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center bg-teal-600 hover:bg-teal-500 disabled:opacity-30 rounded-full transition-colors shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
