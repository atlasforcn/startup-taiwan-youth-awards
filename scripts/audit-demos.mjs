import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const siteRoot = resolve(import.meta.dirname, "..");
const workspaceRoot = resolve(siteRoot, "..");
const dataPath = resolve(siteRoot, "data/projects.json");
const outputPath = resolve(siteRoot, "data/demo-audit.json");

const source = JSON.parse(await readFile(dataPath, "utf8"));
const projects = source.projects.filter((project) =>
  project.prototypeRepo
  && project.competitionId !== "user-concepts"
  && project.hidden !== true
);

const dimensions = [
  {
    id: "problem",
    label: "問題與使用者",
    weight: 15,
    terms: ["使用者", "痛點", "需求", "場景", "核心任務", "服務對象", "早期"],
    threshold: 4,
  },
  {
    id: "market",
    label: "市場與差異化",
    weight: 15,
    terms: ["市場", "替代方案", "競爭", "差異", "導入", "採購", "轉換成本", "客群"],
    threshold: 4,
  },
  {
    id: "validation",
    label: "驗證與證據",
    weight: 15,
    terms: ["驗證", "場域", "紀錄", "成效", "回饋", "指標", "模擬資料", "試辦"],
    threshold: 5,
  },
  {
    id: "business",
    label: "商業模式",
    weight: 10,
    terms: ["商業模式", "付費", "收入", "訂閱", "抽成", "報價", "價格", "成本", "營收", "毛利"],
    threshold: 4,
  },
];

const highRiskTerms = [
  "醫療",
  "用藥",
  "傷口",
  "法律",
  "心理",
  "情緒",
  "安全",
  "救護",
  "導航",
  "金流",
  "診斷",
  "翻譯",
  "兒童",
  "孩子",
  "頭痛",
  "生物晶片",
];

const countTerms = (text, terms) =>
  terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);

const hasAny = (text, terms) => terms.some((term) => text.includes(term));

function evidenceScore(text, dimension) {
  const hits = countTerms(text, dimension.terms);
  const ratio = Math.min(hits / dimension.threshold, 1);
  return {
    score: Math.round(dimension.weight * (0.3 + ratio * 0.7)),
    hits,
    missing: dimension.terms.filter((term) => !text.includes(term)).slice(0, 3),
  };
}

async function audit(project) {
  const repoPath = resolve(siteRoot, project.prototypeRepo);
  const requiredFiles = [
    "index.html",
    "styles.css",
    "app.js",
    "README.md",
    "SOURCE.md",
    "docs/preview.png",
    "docs/flow.png",
  ];

  const contents = {};
  for (const file of requiredFiles.slice(0, 5)) {
    contents[file] = await readFile(resolve(repoPath, file), "utf8").catch(() => "");
  }

  const fileState = await Promise.all(
    requiredFiles.map(async (file) => {
      const content = await readFile(resolve(repoPath, file)).catch(() => null);
      return { file, present: Boolean(content?.length) };
    }),
  );

  const html = contents["index.html"];
  const css = contents["styles.css"];
  const js = contents["app.js"];
  const readme = contents["README.md"];
  const sourceDoc = contents["SOURCE.md"];
  const allText = `${html}\n${css}\n${js}\n${readme}\n${sourceDoc}`;

  const scoredDimensions = Object.fromEntries(
    dimensions.map((dimension) => [dimension.id, evidenceScore(allText, dimension)]),
  );

  const controlCount = (html.match(/<(button|input|select|textarea|form)\b/g) || []).length;
  const listenerCount = (js.match(/addEventListener\s*\(/g) || []).length;
  const stateSignals = countTerms(js, [
    "classList",
    "textContent",
    "innerHTML",
    "dataset",
    "localStorage",
    "push(",
    "filter(",
  ]);
  const interactionRatio = Math.min((controlCount + listenerCount + stateSignals) / 24, 1);
  const interactionScore = Math.round(20 * (0.35 + interactionRatio * 0.65));

  const responsive = /@media\s*\(/.test(css);
  const focusState = /:focus|:focus-visible/.test(css);
  const reducedMotion = /prefers-reduced-motion/.test(css);
  const visualScore = Math.min(
    10,
    5 + Number(responsive) * 2 + Number(focusState) * 2 + Number(reducedMotion),
  );

  const riskContext = `${project.team} ${project.implementationConcept || ""} ${project.prototypeRepo}`;
  const isHighRisk = hasAny(riskContext, highRiskTerms);
  const usesAutomatedDecision = hasAny(riskContext, [
    "AI",
    "人工智慧",
    "RAG",
    "智能",
    "智慧",
    "評分",
    "辨識",
    "分析",
  ]);
  const hasSource = /https?:\/\/.+/.test(sourceDoc) && /官方|來源/.test(sourceDoc);
  const hasBoundary = /Prototype|原型|模擬|不代表原團隊/.test(html);
  const hasProfessionalBoundary = /不構成|不可取代|人工複核|專業人員|緊急服務|僅供示範/.test(allText);
  const riskScore = Math.min(
    10,
    3 + Number(hasSource) * 2 + Number(hasBoundary) * 2
      + Number(!isHighRisk || hasProfessionalBoundary) * 3,
  );

  const completeFiles = fileState.filter((item) => item.present).length;
  const qualityScore = Math.round(5 * completeFiles / requiredFiles.length);

  const total = [
    scoredDimensions.problem.score,
    scoredDimensions.market.score,
    interactionScore,
    scoredDimensions.validation.score,
    scoredDimensions.business.score,
    visualScore,
    riskScore,
    qualityScore,
  ].reduce((sum, score) => sum + score, 0);

  const blockers = [];
  if (completeFiles < requiredFiles.length) blockers.push("必要檔案不完整");
  if (isHighRisk && !hasProfessionalBoundary) blockers.push("高風險服務缺少人工或專業邊界");
  if (controlCount < 4 || listenerCount < 2) blockers.push("核心互動證據不足");
  if (!hasSource) blockers.push("官方來源文件不足");

  const priorities = [
    ["market", scoredDimensions.market.score / 15],
    ["validation", scoredDimensions.validation.score / 15],
    ["business", scoredDimensions.business.score / 10],
    ["problem", scoredDimensions.problem.score / 15],
  ]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([id]) => id);

  return {
    id: project.id,
    repo: project.prototypeRepo.replace("../", ""),
    project: project.team,
    competition: project.competitionName,
    highRisk: isHighRisk,
    usesAutomatedDecision,
    score: total,
    passed: total >= 75 && blockers.length === 0,
    dimensions: {
      problem: scoredDimensions.problem.score,
      market: scoredDimensions.market.score,
      interaction: interactionScore,
      validation: scoredDimensions.validation.score,
      business: scoredDimensions.business.score,
      visual: visualScore,
      risk: riskScore,
      quality: qualityScore,
    },
    evidence: {
      controls: controlCount,
      listeners: listenerCount,
      responsive,
      focusState,
      reducedMotion,
      source: hasSource,
      boundary: hasBoundary,
      professionalBoundary: hasProfessionalBoundary,
      requiredFiles: fileState,
    },
    blockers,
    priorities,
  };
}

const audits = [];
for (const project of projects) {
  audits.push(await audit(project));
}

audits.sort((a, b) => a.score - b.score || a.repo.localeCompare(b.repo));

const report = {
  generatedAt: new Date().toISOString(),
  methodology:
    "自動證據初評，只用來排序人工複核優先級；最終分數仍須由 8 位專家依畫面、互動與來源逐項確認。",
  summary: {
    audited: audits.length,
    heuristicPass: audits.filter((item) => item.passed).length,
    hasBlockers: audits.filter((item) => item.blockers.length > 0).length,
    averageScore: Math.round(
      audits.reduce((sum, item) => sum + item.score, 0) / Math.max(audits.length, 1),
    ),
  },
  audits,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report.summary, null, 2));
console.log("\nLowest evidence scores:");
for (const item of audits.slice(0, 12)) {
  console.log(
    `${String(item.score).padStart(3)}  ${item.repo}  priorities=${item.priorities.join(",")}  blockers=${item.blockers.join("|") || "none"}`,
  );
}
