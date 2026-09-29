// 출처: 학교 홈페이지 대학시설(https://www.dongyang.ac.kr/dmu/4433/subview.do) 층별 안내 + 캠퍼스 지도
export const CAMPUS_MAP_URL = "https://www.dongyang.ac.kr/dmu/4433/subview.do";

interface Building { no: number; name: string; route: string; floors: [string, string[]][]; }

export const BUILDINGS: Building[] = [
  { no: 1, name: "1호관(대학본부)",
    route: "정문으로 들어오면 바로 앞에 있는 건물이에요. 남문으로 들어와도 바로 보여요.",
    floors: [
      ["1층", ["강의실", "입시지원팀", "웰컴라운지", "웰컴갤러리"]],
      ["2층", ["강의실", "유학생지원실", "국제교류센터", "HiVE 센터"]],
      ["3층", ["강의실", "예비군연대", "교양과사무실", "전산실습실"]],
      ["4층", ["학생서비스센터(휴/복학, 수업, 장학)", "취업지원센터", "현장실습지원센터", "공학기술교육혁신센터", "KB국민 ATM", "증명서발급기"]],
      ["5층", ["사무처", "소강당"]],
      ["6층", ["산학협력단", "기획혁신처"]],
      ["7층", ["교무입학처", "감사장/대외평가실"]],
      ["8층", ["총장실", "학생처장실", "사무처장실", "종합회의실"]],
      ["9층", ["법인사무국"]],
    ] },
  { no: 2, name: "2호관",
    route: "정문으로 들어와 오른쪽으로 가면 3호관 옆, 캠퍼스 끝에 있는 건물이에요.",
    floors: [
      ["지하 2층", ["강의실"]],
      ["지하 1층", ["강의실"]],
      ["1층", ["전산실습실", "칵테일 실습실"]],
      ["2층", ["전산실습실", "강의실"]],
      ["3층", ["경영학부사무실", "스마트강의실"]],
      ["4층", ["교수연구실", "교수학습지원센터", "스튜디오실"]],
      ["5~7층", ["교수연구실"]],
    ] },
  { no: 3, name: "3호관",
    route: "정문으로 들어와 1호관을 지나 잔디광장으로 가면, 광장 건너편에 가로로 길게 있는 건물이에요.",
    floors: [
      ["1층", ["총학생회", "대의원회", "보건실", "학생상담센터", "장애학생지원실", "여학생휴게실", "부트캠프클린룸", "P-Tech 사무실", "전산실습실"]],
      ["2층", ["컴퓨터공학부사무실", "전산실습실"]],
      ["3층", ["전산실습실", "PD Lab"]],
      ["4층", ["전기전자통신공학부사무실", "실험실습실", "전산실습실"]],
      ["5층", ["실험실습실", "강의실", "전산실습실"]],
    ] },
  { no: 4, name: "4호관",
    route: "정문으로 들어와 잔디광장을 가로질러 끝까지 가면 운동장 바로 옆에 세로로 길게 있는 건물이에요.",
    floors: [
      ["지하 1층", ["실험실습실"]],
      ["1층", ["실험실습실"]],
      ["2층", ["기계공학부사무실", "로봇자동화공학부사무실", "부트캠프사업단", "실험실습실"]],
      ["3층", ["생명화학공학과사무실", "바이오융합공학과사무실", "실험실습실", "전산실습실"]],
      ["4층", ["전산실습실"]],
      ["5층", ["실험실습실", "전산실습실"]],
      ["6층", ["C.I Lab(취미동아리)"]],
    ] },
  { no: 5, name: "5호관",
    route: "3호관 뒤쪽, 후문 출입구 바로 앞에 있는 작은 건물이에요. 정문에서는 3호관을 돌아서 가면 돼요.",
    floors: [
      ["지하 1층", ["스마트융합제작 실습실"]],
      ["1층", ["튜터링카페", "실습실", "PD Lab Star"]],
      ["2층", ["실험실습실"]],
      ["3층", ["DM Lab"]],
    ] },
  { no: 6, name: "6호관",
    route: "운동장 뒤편에 가로로 길게 있는 건물이에요. 후문으로 들어오면 가깝고, 정문에서는 잔디광장 → 4호관 → 운동장을 지나 안쪽으로 가면 돼요.",
    floors: [
      ["지하 3층", ["휘트니스센터", "다목적실습실"]],
      ["지하 2층", ["동창회사무실", "실험실습실", "공동장비운영센터"]],
      ["지하 1층", ["DM Gallery", "강의실"]],
      ["1층", ["갤러리", "강의실", "실험실습실", "전산실습실"]],
      ["2층", ["강의실", "체력측정실", "원격강의공용실습실"]],
      ["3층", ["강의실", "실험실습실", "전산실습실"]],
      ["4층", ["강의실", "실험실습실", "촬영스튜디오", "전산실습실"]],
      ["5층", ["교수연구실"]],
    ] },
  { no: 7, name: "7호관",
    route: "캠퍼스 가장 안쪽 건물이에요. 6호관 끝에서 이어져 있어서 6호관을 따라 끝까지 가면 돼요.",
    floors: [
      ["지하 1층", ["실험실습실"]],
      ["1층", ["전산실습실", "실험실습실", "강의실"]],
      ["2층", ["동아리실", "강의실", "실험실습실"]],
      ["3층", ["생활환경공학부사무실(건축, 실내, 시각, AR·VR)", "교수연구실"]],
      ["4층", ["강의실", "설계실", "동아리실", "실험실습실"]],
      ["5층", ["실험실습실", "통합설계실", "전산실습실"]],
    ] },
  { no: 8, name: "8호관",
    route: "서문 출입구 바로 옆, 운동장 모서리에 있는 건물이에요. 정문에서는 4호관을 지나 운동장 쪽으로 가면 돼요.",
    floors: [
      ["지하 1층", ["주차장"]],
      ["1층", ["대강당", "CU", "써브웨이", "KB금융은행 및 ATM", "여행사(GHRC)", "유료(택배)사물함"]],
      ["2층", ["글로세움(서점)", "모닝글로리(문구점)", "제주몰빵(카페)"]],
      ["3층", ["식당", "강의실", "XR스튜디오", "전산실습실"]],
    ] },
];

const norm = (s: string) => s.toLowerCase().replace(/\s/g, "");
// 매칭용 이름: 괄호 앞부분만 ("글로세움(서점)" → "글로세움")
const key = (item: string) => norm(item.replace(/\(.*\)/, ""));

// 여러 건물에 있는 시설(강의실, 전산실습실 등)은 위치를 특정할 수 없어 제외
const FACILITIES = (() => {
  const count = new Map<string, Set<number>>();
  for (const b of BUILDINGS) for (const [, items] of b.floors) for (const it of items) {
    if (!count.has(key(it))) count.set(key(it), new Set());
    count.get(key(it))!.add(b.no);
  }
  const list: { item: string; building: Building; floor: string }[] = [];
  for (const b of BUILDINGS) for (const [floor, items] of b.floors) for (const it of items) {
    if (count.get(key(it))!.size === 1 && !list.some((f) => key(f.item) === key(it))) list.push({ item: it, building: b, floor });
  }
  return list;
})();

/** 건물 번호나 특정 시설이 언급되면 안내 문구를, 아니면 null. */
export function campusAnswer(message: string): string | null {
  const m = norm(message);
  const bNo = m.match(/([1-8])호관/)?.[1] ?? (/(대학)?본부|본관/.test(m) ? "1" : null);
  if (bNo) {
    const b = BUILDINGS[Number(bNo) - 1];
    return (
      `🏫 ${b.name}\n📍 ${b.route}\n\n` +
      b.floors.map(([f, items]) => `• ${f}: ${items.join(", ")}`).join("\n") +
      `\n\n🗺 캠퍼스 지도: ${CAMPUS_MAP_URL}`
    );
  }
  // 괄호 안이 한 단어면 별칭으로도 찾는다 ("글로세움(서점)" → "서점")
  const alias = (item: string) => item.match(/\(([^,/]+)\)/)?.[1];
  const f = FACILITIES.find((f) => m.includes(key(f.item)))
    ?? FACILITIES.find((f) => alias(f.item) && m.includes(norm(alias(f.item)!)));
  if (f) {
    return `📍 ${f.item}: ${f.building.name} ${f.floor}\n${f.building.route}\n\n🗺 캠퍼스 지도: ${CAMPUS_MAP_URL}`;
  }
  return null;
}

export function campusOverview(): string {
  return (
    "🏫 캠퍼스 건물 안내\n" +
    BUILDINGS.map((b) => `• ${b.name}: ${b.route.split(".")[0]}`).join("\n") +
    "\n\n건물 번호(예: 3호관)나 시설 이름(예: 보건실)으로 물어보면 자세히 알려줄게요!" +
    `\n🗺 캠퍼스 지도: ${CAMPUS_MAP_URL}`
  );
}
