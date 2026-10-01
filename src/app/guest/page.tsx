import ChatApp from "@/components/ChatApp";

// 비회원: 로그인 화면과 같은 채팅 UI, 개인 기능(지난 7일·설정·시간표 등)만 뺀다
export default function GuestPage() {
  return <ChatApp guest />;
}
