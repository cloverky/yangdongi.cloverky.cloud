import { prisma } from "./db";

const KEYWORDS: Record<string, string[]> = {
  greeting:    ["안녕", "hello", "hi", "하이", "반가", "ㅎㅇ", "ㅎㅎ", "헬로"],
  timetable:   ["시간표", "수업", "강의", "스케줄", "일정"],
  grades:      ["성적", "학점", "gpa", "점수", "학업"],
  cert:        ["자격증", "토익", "토플", "컴활", "한국사", "접수", "원서"],
  notices:     ["공지", "알림", "소식", "게시", "안내"],
  assignments: ["과제", "숙제", "마감", "제출"],
  campus:      ["캠퍼스", "건물", "위치", "시설", "장소", "어디"],
  departments: ["학과", "전공", "학부", "교수", "커리큘럼", "교육과정"],
};

function match(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [key, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return key;
  }
  return null;
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/** 서버(Vercel)는 UTC 라서 "오늘"을 한국 날짜로 맞춰 계산한다. */
function kstDay(offsetDays: number): string {
  const kst = new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000);
  return WEEK[kst.getUTCDay()];
}

/** 메시지에 나온 요일을 전부 월~일 순서로 돌려준다. */
function daysInMessage(message: string): string[] {
  const found = new Set<string>();
  for (const m of message.matchAll(/([월화수목금토일])요일/g)) found.add(m[1]);
  // "월화", "월수금" 같은 줄임말 — 한 글자는 "수업"의 수, "9월"의 월과 겹쳐서 두 글자 이상만.
  for (const m of message.matchAll(/[월화수목금토일]{2,}/g)) {
    for (const ch of m[0]) found.add(ch);
  }
  if (message.includes("오늘")) found.add(kstDay(0));
  if (message.includes("내일")) found.add(kstDay(1));
  return WEEK.filter((d) => found.has(d));
}

const FALLBACK =
  "저는 동양미래대학교 학사 정보만 답변할 수 있어요.\n" +
  "시간표, 성적, 공지사항, 과제, 캠퍼스 시설, 학과 정보를 물어보세요!";

export async function chat(message: string, studentId?: string): Promise<string> {
  const category = match(message);
  if (!category) return FALLBACK;

  switch (category) {
    case "greeting":
      return "안녕하세요! 저는 동양미래대학교 챗봇 양동이예요!\n시간표, 성적, 공지사항, 과제, 캠퍼스 시설, 학과 정보를 물어보세요!";

    case "timetable": {
      if (!studentId) return "시간표 조회는 로그인 후 이용할 수 있어요.";
      const rows = await prisma.studentClass.findMany({
        where: { studentId, year: new Date().getFullYear() },
        include: { class: true },
      });
      if (!rows.length) return "등록된 수업이 없어요.";

      const days = daysInMessage(message);

      let filtered = rows;
      if (days.length) {
        filtered = rows.filter(r => days.some((d) => r.class.schedule.startsWith(d)));
        if (!filtered.length) return `${days.join("·")}요일에는 수업이 없어요.`;
      }

      const label = days.length ? `${days.join("·")}요일 수업` : "이번 학기 시간표";
      return (
        `📅 ${label}\n` +
        filtered.map((r) => `• ${r.class.subject} — ${r.class.professor} / ${r.class.classroom} / ${r.class.schedule}`).join("\n")
      );
    }

    case "grades": {
      if (!studentId) return "성적 조회는 로그인 후 이용할 수 있어요.";
      const rows = await prisma.studentClass.findMany({
        where: { studentId },
        include: { class: true },
      });
      const graded = rows.filter((r) => r.grade);
      if (!graded.length) return "아직 성적이 입력되지 않았어요.";
      return (
        "📊 성적 현황\n" +
        graded.map((r) => `• ${r.class.subject} (${r.year}-${r.semester}학기): ${r.grade}`).join("\n")
      );
    }

    case "cert": {
      const rows = await prisma.notice.findMany({
        where: { OR: [{ title: { contains: "자격증" } }, { title: { contains: "토익" } }, { title: { contains: "시험" } }, { title: { contains: "접수" } }] },
        orderBy: { postedAt: "desc" },
        take: 5,
      });
      if (!rows.length) return "자격증·시험 관련 공지가 없어요.";
      return "📋 자격증·시험 공지\n" + rows.map((r) => `• ${r.title}`).join("\n");
    }

    case "notices": {
      const rows = await prisma.notice.findMany({ orderBy: { postedAt: "desc" }, take: 5 });
      if (!rows.length) return "최근 공지사항이 없어요.";
      return "📢 최근 공지사항\n" + rows.map((r) => `• [${r.category ?? "공지"}] ${r.title}`).join("\n");
    }

    case "assignments": {
      if (!studentId) return "과제 조회는 로그인 후 이용할 수 있어요.";
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 30);
      const rows = await prisma.assignment.findMany({
        where: { dueDate: { gte: new Date(), lte: threshold } },
        orderBy: { dueDate: "asc" },
        take: 10,
      });
      if (!rows.length) return "30일 내 마감 과제가 없어요.";
      return (
        "📝 마감 임박 과제\n" +
        rows.map((r) => `• ${r.subjectName} — ${r.title} (${r.dueDate.toLocaleDateString("ko-KR")} 마감)`).join("\n")
      );
    }

    case "campus": {
      const rows = await prisma.campusPlace.findMany({ take: 15 });
      if (!rows.length) return "캠퍼스 시설 정보가 없어요.";
      return (
        "🏫 캠퍼스 주요 시설\n" +
        rows.map((r) => `• ${r.name}${r.building ? ` (${r.building}${r.floor ? " " + r.floor + "층" : ""})` : ""}`).join("\n")
      );
    }

    case "departments": {
      const rows = await prisma.department.findMany({ include: { faculty: true } });
      if (!rows.length) return "학과 정보가 없어요.";
      return "🎓 학과 목록\n" + rows.map((r) => `• ${r.name} (${r.faculty.name})`).join("\n");
    }

    default:
      return FALLBACK;
  }
}
