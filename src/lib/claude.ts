import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 동양미래대학교 학생들을 위한 학사 정보 AI 어시스턴트 '양동이'입니다.
학생들의 학사 일정, 수강신청, 졸업요건, 장학금, 공지사항 등에 대한 질문에 친절하고 정확하게 답변해 주세요.
모르는 정보는 솔직하게 모른다고 하고, 학교 포털이나 담당 부서에 문의하도록 안내해 주세요.
답변은 간결하고 명확하게, 한국어로 해주세요.`;

export async function chat(
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      ...history,
      { role: "user", content: message },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
