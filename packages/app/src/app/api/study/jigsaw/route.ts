/**
 * Weekly Jigsaw API — 拼图碎片收集
 *
 * GET  /api/study/jigsaw — 获取本周拼图状态（已收集的碎片、总碎片数）
 *
 * 拼图碎片通过完成每日 Quiz 获得（得分 ≥ 3/5 → 获得当天碎片）。
 * 一周 7 天 = 7 片，收集全部 7 片完成本周拼图。
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { year: d.getUTCFullYear(), week: weekNo };
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

/** 每周拼图主题（循环 52 个圣经主题） */
const WEEKLY_THEMES = [
  { theme: "创造", reference: "Genesis 1:1", description: "起初，神创造天地。" },
  { theme: "信心", reference: "Hebrews 11:1", description: "信就是所望之事的实底。" },
  { theme: "爱", reference: "1 Corinthians 13:13", description: "如今常存的有信，有望，有爱。" },
  { theme: "恩典", reference: "Ephesians 2:8", description: "你们得救是本乎恩，也因着信。" },
  { theme: "平安", reference: "John 14:27", description: "我留下平安给你们。" },
  { theme: "盼望", reference: "Romans 15:13", description: "但愿使人有盼望的神。" },
  { theme: "智慧", reference: "Proverbs 3:5", description: "你要专心仰赖耶和华。" },
  { theme: "光明", reference: "Psalm 119:105", description: "你的话是我脚前的灯。" },
  { theme: "喜乐", reference: "Philippians 4:4", description: "你们要靠主常常喜乐。" },
  { theme: "力量", reference: "Isaiah 40:31", description: "但那等候耶和华的必从新得力。" },
  { theme: "救恩", reference: "John 3:16", description: "神爱世人，甚至将他的独生子赐给他们。" },
  { theme: "公义", reference: "Micah 6:8", description: "行公义，好怜悯，存谦卑的心。" },
  // 循环填充到 52 个
  { theme: "圣洁", reference: "1 Peter 1:16", description: "你们要圣洁，因为我是圣洁的。" },
  { theme: "合一", reference: "Ephesians 4:3", description: "用和平彼此联络，竭力保守圣灵所赐合一的心。" },
  { theme: "谦卑", reference: "James 4:10", description: "务要在主面前自卑，主就必叫你们升高。" },
  { theme: "忍耐", reference: "Romans 5:3-4", description: "患难生忍耐，忍耐生老练。" },
  { theme: "真理", reference: "John 8:32", description: "你们必晓得真理，真理必叫你们得以自由。" },
  { theme: "生命", reference: "John 14:6", description: "我就是道路、真理、生命。" },
  { theme: "安慰", reference: "2 Corinthians 1:3-4", description: "我们在一切患难中，他就安慰我们。" },
  { theme: "赞美", reference: "Psalm 150:6", description: "凡有气息的都要赞美耶和华。" },
  { theme: "祷告", reference: "Matthew 6:9-13", description: "我们在天上的父。" },
  { theme: "国度", reference: "Matthew 6:33", description: "你们要先求他的国和他的义。" },
  { theme: "盟约", reference: "Jeremiah 31:33", description: "我要将我的律法放在他们里面。" },
  { theme: "复活", reference: "1 Corinthians 15:20", description: "基督已经从死里复活。" },
  { theme: "圣灵", reference: "Galatians 5:22-23", description: "圣灵所结的果子就是仁爱、喜乐、和平。" },
  { theme: "丰收", reference: "Matthew 9:37-38", description: "要收的庄稼多，作工的人少。" },
  { theme: "磐石", reference: "Matthew 7:24", description: "把房子盖在磐石上。" },
  { theme: "牧者", reference: "Psalm 23:1", description: "耶和华是我的牧者，我必不至缺乏。" },
  { theme: "活水", reference: "John 4:14", description: "我所赐的水要在他里头成为泉源。" },
  { theme: "天粮", reference: "John 6:35", description: "我就是生命的粮。" },
  { theme: "葡萄树", reference: "John 15:5", description: "我是葡萄树，你们是枝子。" },
  { theme: "窄门", reference: "Matthew 7:13-14", description: "引到永生，那门是窄的。" },
  { theme: "新造", reference: "2 Corinthians 5:17", description: "若有人在基督里，他就是新造的人。" },
  { theme: "得胜", reference: "Romans 8:37", description: "靠着爱我们的主，在这一切的事上已经得胜有余了。" },
  { theme: "冠冕", reference: "2 Timothy 4:8", description: "有公义的冠冕为我存留。" },
  { theme: "安息", reference: "Matthew 11:28", description: "凡劳苦担重担的人可以到我这里来。" },
  { theme: "医治", reference: "Isaiah 53:5", description: "因他受的鞭伤，我们得医治。" },
  { theme: "释放", reference: "John 8:36", description: "天父的儿子若叫你们自由，你们就真自由了。" },
  { theme: "指引", reference: "Proverbs 16:9", description: "人心筹算自己的道路，惟耶和华指引他的脚步。" },
  { theme: "应许", reference: "2 Peter 1:4", description: "又宝贵又极大的应许赐给我们。" },
  { theme: "更新", reference: "Romans 12:2", description: "只要心意更新而变化。" },
  { theme: "刚强", reference: "Joshua 1:9", description: "你当刚强壮胆，不要惧怕。" },
  { theme: "忠心", reference: "Revelation 2:10", description: "你务要至死忠心，我就赐给你那生命的冠冕。" },
  { theme: "慷慨", reference: "2 Corinthians 9:7", description: "捐得乐意的人是神所喜爱的。" },
  { theme: "洁净", reference: "Psalm 51:10", description: "神啊，求你为我造清洁的心。" },
  { theme: "觉醒", reference: "Ephesians 5:14", description: "你这睡着的人当醒过来，从死里复活。" },
  { theme: "见证", reference: "Acts 1:8", description: "并要在耶路撒冷、犹太全地和撒玛利亚直到地极作我的见证。" },
  { theme: "丰收", reference: "Psalm 126:5", description: "流泪撒种的，必欢呼收割。" },
  { theme: "根基", reference: "1 Corinthians 3:11", description: "那已经立好的根基就是耶稣基督。" },
  { theme: "宝藏", reference: "Matthew 6:20-21", description: "只要积攒财宝在天上。" },
  { theme: "印记", reference: "Ephesians 1:13", description: "你们既听见真理的道...就受了所应许的圣灵为印记。" },
  { theme: "同在", reference: "Matthew 28:20", description: "我就常与你们同在，直到世界的末了。" },
];

// ── GET — 本周拼图状态 ─────────────────────────────────────────────────────────

export async function GET() {
  const now = new Date();
  const { year, week } = getWeekNumber(now);
  const weekStart = getWeekStart(now);
  const today = new Date().getDay(); // 0=Sun, 6=Sat

  // 获取本周主题
  const themeIndex = week % WEEKLY_THEMES.length;
  const theme = WEEKLY_THEMES[themeIndex];

  // 获取已收集的碎片
  let earnedPieces: number[] = [];
  try {
    const { getJigsawProgress } = await import("@xjoy/db");
    const pieces = await getJigsawProgress(year, week);
    earnedPieces = pieces.map((p) => p.piece_day);
  } catch (err) {
    console.warn("[jigsaw] Failed to load progress:", err);
  }

  // 今天是否已获得碎片
  const todayEarned = earnedPieces.includes(today);
  const totalPieces = 7;
  const collectedCount = earnedPieces.length;
  const isComplete = collectedCount >= totalPieces;

  return NextResponse.json({
    year,
    week,
    weekStart,
    theme,
    today,
    todayEarned,
    earnedPieces,
    collectedCount,
    totalPieces,
    isComplete,
  });
}
