import { prisma } from "./db";
import { campusAnswer, campusOverview } from "./campus";

const KEYWORDS: Record<string, string[]> = {
  greeting:    ["안녕", "hello", "hi", "하이", "반가", "ㅎㅇ", "ㅎㅎ", "헬로"],
  // grades 보다 먼저: "졸업 학점 이수"의 '학점'이 성적으로 새지 않게
  graduation:  ["졸업", "이수"],
  timetable:   ["시간표", "수업", "강의", "스케줄", "일정"],
  grades:      ["성적", "학점", "gpa", "점수", "학업"],
  notices:     ["공지", "알림", "소식", "게시", "안내"],
  assignments: ["과제", "숙제", "마감", "제출"],
  campus:      ["캠퍼스", "건물", "위치", "시설", "장소", "어디", "가는길", "가는 길", "찾아가"],
  departments: ["학과", "전공", "학부", "교수", "커리큘럼", "교육과정"],
  intro:       ["누구", "소개", "이름"],
};

function match(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [key, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return key;
  }
  return null;
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// "이번 학기" 기준. 실제 날짜가 아니라 데이터가 있는 마지막 학기로 고정 (scripts/seed-timetable.js)
const CURRENT_TERM = { year: 2025, semester: 2 };

// 3년제 전문학사 졸업요건 — https://www.dongyang.ac.kr/dongyang/212/subview.do (2023년 2월 이후 졸업대상자)
const GRAD = { total: 110, major: 78, liberal: 12, terms: 6 };

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
  // 건물·시설 이름이 나오면 다른 키워드보다 우선 ("컴퓨터공학부사무실"이 학과로 빠지지 않게)
  const place = campusAnswer(message);
  if (place) return place;

  const category = match(message);
  if (!category) return FALLBACK;

  switch (category) {
    case "greeting":
    case "intro":
      return "안녕하세요! 저는 동양미래대학교 챗봇 양동이예요!\n시간표, 성적, 공지사항, 과제, 캠퍼스 시설, 학과 정보를 물어보세요!";

    case "timetable": {
      if (!studentId) return "시간표 조회는 로그인 후 이용할 수 있어요.";
      const rows = await prisma.studentClass.findMany({
        where: { studentId, ...CURRENT_TERM },
        include: { class: true },
      });
      if (!rows.length) return "등록된 수업이 없어요.";

      const days = daysInMessage(message);

      let filtered = rows;
      if (days.length) {
        filtered = rows.filter(r => days.some((d) => r.class.schedule.startsWith(d)));
        if (!filtered.length) return `${days.join("·")}요일에는 수업이 없어요.`;
      }
      // 월→금, 같은 요일은 시간순. 요일 없는(온라인) 과목은 맨 뒤
      const dayIdx = (s: string) => { const i = WEEK.indexOf(s[0]); return i < 0 ? 9 : i; };
      filtered.sort((a, b) => dayIdx(a.class.schedule) - dayIdx(b.class.schedule) || a.class.schedule.localeCompare(b.class.schedule));

      const label = days.length ? `${days.join("·")}요일 수업` : "이번 학기 시간표";
      return (
        `📅 ${label}\n` +
        filtered.map((r) => `• ${r.class.subject} — ${r.class.professor} / ${r.class.classroom} / ${r.class.schedule}`).join("\n")
      );
    }

    case "graduation": {
      if (!studentId) return "졸업 이수 현황은 로그인 후 이용할 수 있어요.";
      const rows = await prisma.studentClass.findMany({ where: { studentId }, include: { class: true } });
      if (!rows.length) return "수강 내역이 없어요.";

      const isCurrent = (r: (typeof rows)[number]) => r.year === CURRENT_TERM.year && r.semester === CURRENT_TERM.semester;
      // 지난 학기 과목은 F 가 아니면 이수로 본다 (성적이 비어 있어도)
      const done = rows.filter((r) => !isCurrent(r) && r.grade !== "F");
      const now = rows.filter(isCurrent);
      const sum = (xs: typeof rows, pre?: string) =>
        xs.filter((r) => !pre || r.class.courseType.startsWith(pre)).reduce((s, r) => s + r.class.credit, 0);
      const terms = new Set(rows.map((r) => `${r.year}-${r.semester}`)).size;

      const line = (label: string, d: number, n: number, need: number) =>
        `• ${label}: ${d} / ${need}학점${n ? ` (이번 학기 +${n})` : ""} ` +
        (d >= need ? "✅ 충족" : d + n >= need ? "🟡 이번 학기 마치면 충족" : `⏳ ${need - d - n}학점 부족`);
      const required = rows
        .filter((r) => r.class.courseType === "전필" || r.class.courseType === "교필")
        .map((r) => `${r.class.subject} ${isCurrent(r) ? "⏳" : "✅"}`);

      return (
        `🎓 졸업 이수 현황 (3년제 기준)\n` +
        line("총 학점", sum(done), sum(now), GRAD.total) + "\n" +
        line("전공", sum(done, "전"), sum(now, "전"), GRAD.major) + "\n" +
        line("교양", sum(done, "교"), sum(now, "교"), GRAD.liberal) + "\n" +
        `• 재학: ${terms}학기 / ${GRAD.terms}학기 이상 ${terms >= GRAD.terms ? "✅" : "⏳"}\n` +
        `• 필수과목: ${required.join(", ")}\n\n` +
        `기준: 학교 학사안내(2023년 2월 이후 졸업대상자). 정확한 판정은 학생서비스센터에서 확인하세요.`
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

    case "campus":
      return campusOverview();

    case "departments": {
      const rows = await prisma.department.findMany({ include: { faculty: true } });
      if (!rows.length) return "학과 정보가 없어요.";
      return "🎓 학과 목록\n" + rows.map((r) => `• ${r.name} (${r.faculty.name})`).join("\n");
    }

    default:
      return FALLBACK;
  }
}
