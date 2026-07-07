const state = {
  dataset: null,
  audits: new Map(),
  auditSummary: null,
  filtered: [],
  searchMeta: new Map(),
  selectedId: null,
};

const sidebarStorageKey = "startup-awards-sidebar-expanded";

const els = {
  search: document.querySelector("#searchInput"),
  topSearch: document.querySelector("#topSearchInput"),
  year: document.querySelector("#yearFilter"),
  category: document.querySelector("#categoryFilter"),
  confidence: document.querySelector("#confidenceFilter"),
  softwareOnly: document.querySelector("#softwareOnly"),
  prototypeOnly: document.querySelector("#prototypeOnly"),
  cards: document.querySelector("#projectCards"),
  table: document.querySelector("#projectTable"),
  detail: document.querySelector("#projectDetail"),
  resultCount: document.querySelector("#resultCount"),
  generatedAt: document.querySelector("#generatedAt"),
  exportButton: document.querySelector("#exportButton"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  prototypeShowcase: document.querySelector("#completedDemos"),
  prototypeGallery: document.querySelector("#prototypeGallery"),
  prototypeGalleryCount: document.querySelector("#prototypeGalleryCount"),
  focusPrototypes: document.querySelector("#focusPrototypes"),
  togglePrototypeGallery: document.querySelector("#togglePrototypeGallery"),
  auditAverage: document.querySelector("#auditAverage"),
  auditLowest: document.querySelector("#auditLowest"),
  auditPass: document.querySelector("#auditPass"),
  auditBlockers: document.querySelector("#auditBlockers"),
  priorityQueue: document.querySelector("#priorityQueue"),
  auditLeaderboard: document.querySelector("#auditLeaderboard"),
  metrics: {
    projects: document.querySelector("#metricProjects"),
    software: document.querySelector("#metricSoftware"),
    prototypes: document.querySelector("#metricPrototypes"),
    years: document.querySelector("#metricYears"),
  },
};

function setSidebarExpanded(expanded) {
  document.body.classList.toggle("filters-expanded", expanded);
  els.sidebarToggle.setAttribute("aria-expanded", String(expanded));
  els.sidebarToggle.setAttribute("aria-label", expanded ? "收合篩選與來源" : "展開篩選與來源");
  els.sidebarToggle.setAttribute("title", expanded ? "收合篩選與來源" : "展開篩選與來源");
  els.sidebarToggle.querySelector("span").textContent = expanded ? "‹" : "›";
  writeStorage(sidebarStorageKey, expanded ? "1" : "0");
}

function restoreSidebarState() {
  const stored = readStorage(sidebarStorageKey);
  setSidebarExpanded(stored === null ? true : stored === "1");
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Filters remain usable when storage is unavailable.
  }
}

function confidenceClass(value) {
  if (value === "明確") return "badge-clear";
  if (value === "推測") return "badge-inferred";
  return "badge-research";
}

function prototypeStatus(project) {
  return project.prototypeRepo ? "已開原型" : "待開原型";
}

function prototypeClass(project) {
  return project.prototypeRepo ? "badge-prototype" : "badge-prototype-pending";
}

function demoLink(project) {
  if (project.demoUrl) return project.demoUrl;
  return project.prototypeRepo ? `${project.prototypeRepo}/index.html` : "";
}

function isPublicProject(project) {
  return project.visibility !== "hidden";
}

function publicProjects() {
  return state.dataset.projects.filter(isPublicProject);
}

function publicPrototypeProjects() {
  return publicProjects()
    .filter((project) => project.prototypeRepo)
    .sort((a, b) => {
      const featured = compareFeaturedDemo(a, b);
      if (featured !== 0) return featured;
      if (a.rocYear !== b.rocYear) return b.rocYear - a.rocYear;
      return displayName(a).localeCompare(displayName(b), "zh-Hant");
    });
}

function compareFeaturedDemo(a, b) {
  if (a.featuredDemo === b.featuredDemo) return 0;
  return a.featuredDemo ? -1 : 1;
}

function displayName(project) {
  return project.team || project.company || "未命名作品";
}

function sourceLabel(project) {
  return `${project.competitionName} ${project.rocYear} 年 ${project.round}`;
}

const priorityLabels = {
  problem: "問題定義",
  market: "市場切入",
  interaction: "互動流程",
  validation: "驗證證據",
  business: "商業模式",
  visual: "視覺呈現",
  risk: "風險邊界",
  quality: "品質檢查",
};

function auditFor(project) {
  return state.audits.get(project.id) || null;
}

function scoreClass(score) {
  if (score >= 95) return "score-excellent";
  if (score >= 90) return "score-strong";
  if (score >= 80) return "score-steady";
  return "score-watch";
}

function scoreLabel(score) {
  if (score >= 95) return "展示首選";
  if (score >= 90) return "穩定可展示";
  if (score >= 80) return "可展示，建議補強";
  return "優先複查";
}

function priorityText(audit) {
  if (!audit?.priorities?.length) return "暫無優先補強";
  return audit.priorities.map((priority) => priorityLabels[priority] || priority).join("、");
}

function auditScoreBadge(project) {
  const audit = auditFor(project);
  if (!audit) return "";
  return `<span class="score-pill ${scoreClass(audit.score)}">${audit.score} 分 · ${scoreLabel(audit.score)}</span>`;
}

function uniqueSorted(items) {
  return [...new Set(items.filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a), "zh-Hant"));
}

function sourceLink(project, label = "官方來源") {
  if (!project.sourceUrl) return `<span class="meta-line">來源待查</span>`;
  return `<a href="${project.sourceUrl}" target="_blank" rel="noreferrer">${label}</a>`;
}

function searchInputs() {
  return [els.search, els.topSearch].filter(Boolean);
}

function currentSearchQuery() {
  return searchInputs().find((input) => input.value)?.value || "";
}

function setSearchValue(value, source = null) {
  searchInputs().forEach((input) => {
    if (input !== source) input.value = value;
  });
}

function handleSearchInput(event) {
  setSearchValue(event.currentTarget.value, event.currentTarget);
  render();
}

function projectKeywords(project) {
  return Array.isArray(project.keywords) ? project.keywords : [];
}

const genericKeywordLabels = new Set([
  "AI",
  "資料分析",
  "平台服務",
  "健康醫療",
  "智慧農業",
  "永續循環",
  "智慧交通",
  "教育學習",
  "文化體驗",
  "運動科技",
  "法律科技",
  "寵物照護",
  "無障礙",
  "餐飲食材",
  "職涯媒合",
  "物聯網",
  "生醫科技",
  "社會創新",
  "商務營運",
  "創業歸故里",
  "地方創生",
  "FITI",
  "科技創業",
  "實戰模擬",
  "校園募資",
  "Healthy x Happy",
  "健康幸福",
  "Young 飛",
  "青年行動",
  "U-start",
  "青年創業",
  "U-start 原漾",
  "原住民族創業",
  "使用者補充",
  "待查概念",
  "已開原型",
  "可軟體化",
  "明確候選",
  "推測候選",
  "資料待查",
  "競賽作品",
  "創業競賽",
  "專案資料",
  "官方來源",
  "作品庫",
  "得獎團隊",
  "實作候選",
  "場域驗證",
]);

function isGenericKeyword(keyword) {
  return genericKeywordLabels.has(keyword) || /^\d{3}年$/.test(keyword) || /^\d{4}$/.test(keyword);
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’'`"]/g, "")
    .replace(/[「」『』【】[\]{}]/g, " ")
    .replace(/[\\/|,，.。:：;；!?！？()（）\-－—–+*#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function queryTerms(query) {
  return normalizeSearchText(query).split(" ").filter(Boolean);
}

function weightedSearchFields(project) {
  const keywordFields = projectKeywords(project).map((keyword) => ({
    value: keyword,
    weight: isGenericKeyword(keyword) ? 3.1 : 5.5,
    fuzzy: !isGenericKeyword(keyword),
  }));

  return [
    ...keywordFields,
    { value: displayName(project), weight: 4.5, fuzzy: true },
    { value: project.company, weight: 3.4, fuzzy: true },
    { value: project.category, weight: 3, fuzzy: false },
    { value: project.school, weight: 2.4, fuzzy: false },
    { value: project.implementationConcept, weight: 2, fuzzy: false },
    { value: project.competitionName, weight: 1.6, fuzzy: false },
    { value: project.round, weight: 1.2, fuzzy: false },
  ];
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function similarity(a, b) {
  const maxLength = Math.max(a.length, b.length);
  if (!maxLength) return 1;
  return 1 - (levenshteinDistance(a, b) / maxLength);
}

function fuzzyThreshold(term) {
  if (term.length <= 2) return 0.98;
  if (/^[a-z0-9.+-]+$/.test(term)) return term.length <= 4 ? 0.74 : 0.7;
  return term.length <= 4 ? 0.66 : 0.72;
}

function bestWindowSimilarity(term, value) {
  const target = compactSearchText(value);
  if (!term || !target || term.length < 3 || target.length < 3) return 0;
  if (target.includes(term)) return 1;
  if (term.length > 32) return 0;

  const lengths = [...new Set([term.length - 1, term.length, term.length + 1])]
    .filter((length) => length >= 2 && length <= target.length);
  let best = 0;

  lengths.forEach((length) => {
    for (let index = 0; index <= target.length - length; index += 1) {
      const score = similarity(term, target.slice(index, index + length));
      if (score > best) best = score;
      if (best >= 1) return;
    }
  });

  return best;
}

function scoreSearchField(term, field) {
  const normalizedValue = normalizeSearchText(field.value);
  const compactValue = normalizedValue.replace(/\s+/g, "");
  const compactTerm = compactSearchText(term);
  if (!normalizedValue || !compactTerm) return 0;

  if (normalizedValue === term || compactValue === compactTerm) {
    return 42 * field.weight;
  }
  if (normalizedValue.includes(term) || compactValue.includes(compactTerm)) {
    return (26 + Math.min(compactTerm.length, 14)) * field.weight;
  }
  if (field.fuzzy === false) return 0;

  const fuzzyScore = bestWindowSimilarity(compactTerm, field.value);
  if (fuzzyScore >= fuzzyThreshold(compactTerm)) {
    return fuzzyScore * 20 * field.weight;
  }

  return 0;
}

function keywordMatchesTerm(keyword, term) {
  const normalizedKeyword = normalizeSearchText(keyword);
  const compactKeyword = compactSearchText(keyword);
  const compactTerm = compactSearchText(term);
  if (!normalizedKeyword || !compactTerm) return false;
  if (normalizedKeyword.includes(term) || compactKeyword.includes(compactTerm)) return true;
  if (isGenericKeyword(keyword)) return false;
  return bestWindowSimilarity(compactTerm, keyword) >= fuzzyThreshold(compactTerm);
}

function scoreProjectSearch(project, terms) {
  if (!terms.length) return { matched: true, score: 0, keywords: [] };

  let score = 0;
  const matchedKeywords = new Set();

  for (const term of terms) {
    const bestScore = weightedSearchFields(project)
      .reduce((best, field) => Math.max(best, scoreSearchField(term, field)), 0);

    if (bestScore <= 0) {
      return { matched: false, score: 0, keywords: [] };
    }

    score += bestScore;
    projectKeywords(project)
      .filter((keyword) => keywordMatchesTerm(keyword, term))
      .forEach((keyword) => matchedKeywords.add(keyword));
  }

  return {
    matched: true,
    score: score + (matchedKeywords.size * 12),
    keywords: [...matchedKeywords],
  };
}

function compareSearchResults(a, b, hasQuery) {
  if (hasQuery) {
    const scoreDifference = (state.searchMeta.get(b.id)?.score || 0) - (state.searchMeta.get(a.id)?.score || 0);
    if (scoreDifference !== 0) return scoreDifference;
  }

  const featured = compareFeaturedDemo(a, b);
  if (featured !== 0) return featured;
  if (hasQuery && a.rocYear !== b.rocYear) return b.rocYear - a.rocYear;
  return 0;
}

function keywordsForDisplay(project, limit) {
  const keywords = projectKeywords(project);
  const matched = state.searchMeta.get(project.id)?.keywords || [];
  return [...matched, ...keywords.filter((keyword) => !matched.includes(keyword))].slice(0, limit);
}

function renderKeywordChips(project, limit = 6) {
  const keywords = keywordsForDisplay(project, limit);
  if (!keywords.length) return "";

  const matched = new Set(state.searchMeta.get(project.id)?.keywords || []);
  return `
    <div class="keyword-cloud" aria-label="關鍵字">
      ${keywords.map((keyword) => `<span class="keyword-chip ${matched.has(keyword) ? "is-match" : ""}">${keyword}</span>`).join("")}
    </div>
  `;
}

function setupFilters() {
  const projects = publicProjects();
  const years = uniqueSorted(projects.map((p) => p.rocYear));
  const categories = uniqueSorted(projects.map((p) => p.category));

  els.year.insertAdjacentHTML("beforeend", years.map((year) => `<option value="${year}">${year} 年</option>`).join(""));
  els.category.insertAdjacentHTML("beforeend", categories.map((category) => `<option value="${category}">${category}</option>`).join(""));

  searchInputs().forEach((el) => {
    el.addEventListener("input", handleSearchInput);
    el.addEventListener("search", handleSearchInput);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter") event.preventDefault();
    });
  });

  [els.year, els.category, els.confidence, els.softwareOnly, els.prototypeOnly].forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  els.exportButton.addEventListener("click", exportFiltered);
  els.sidebarToggle.addEventListener("click", () => {
    setSidebarExpanded(!document.body.classList.contains("filters-expanded"));
  });
  els.focusPrototypes.addEventListener("click", () => {
    setSearchValue("");
    els.year.value = "all";
    els.category.value = "all";
    els.confidence.value = "all";
    els.softwareOnly.checked = true;
    els.prototypeOnly.checked = true;
    render();
    document.querySelector(".content-grid").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.togglePrototypeGallery.addEventListener("click", () => {
    const collapsed = els.prototypeShowcase.classList.toggle("is-collapsed");
    els.togglePrototypeGallery.setAttribute("aria-expanded", String(!collapsed));
    els.togglePrototypeGallery.textContent = collapsed ? "展開全部 Demo" : "收合 Demo 目錄";
  });
}

function filterProjects() {
  const terms = queryTerms(currentSearchQuery());
  const year = els.year.value;
  const category = els.category.value;
  const confidence = els.confidence.value;
  const softwareOnly = els.softwareOnly.checked;
  const prototypeOnly = els.prototypeOnly.checked;
  state.searchMeta = new Map();

  return publicProjects().filter((project) => {
    const searchResult = scoreProjectSearch(project, terms);
    if (terms.length && !searchResult.matched) return false;
    state.searchMeta.set(project.id, searchResult);

    return (!terms.length || searchResult.matched)
      && (year === "all" || String(project.rocYear) === year)
      && (category === "all" || project.category === category)
      && (confidence === "all" || project.softwareConfidence === confidence)
      && (!softwareOnly || project.softwareCandidate)
      && (!prototypeOnly || project.prototypeRepo);
  }).sort((a, b) => compareSearchResults(a, b, terms.length > 0));
}

function renderMetrics() {
  const projects = publicProjects();
  const software = projects.filter((p) => p.softwareCandidate);
  const prototypes = projects.filter((p) => p.prototypeRepo);
  const years = uniqueSorted(projects.map((p) => p.rocYear));

  els.metrics.projects.textContent = projects.length;
  els.metrics.software.textContent = software.length;
  els.metrics.prototypes.textContent = prototypes.length;
  els.metrics.years.textContent = years.length;
}

function auditedPrototypeProjects() {
  return publicPrototypeProjects()
    .map((project) => ({ project, audit: auditFor(project) }))
    .filter((item) => item.audit);
}

function renderJudgeRow(item, rank, mode) {
  const { project, audit } = item;
  const actionLabel = mode === "leaderboard" ? "開啟展示" : "複查 Demo";
  return `
    <article class="judge-row">
      <div class="judge-rank">${String(rank).padStart(2, "0")}</div>
      <div class="judge-row-body">
        <div class="judge-row-title">
          <strong>${displayName(project)}</strong>
          <span class="score-pill ${scoreClass(audit.score)}">${audit.score} 分</span>
        </div>
        <p>${priorityText(audit)}</p>
        <div class="judge-row-links">
          <a href="${demoLink(project)}" target="_blank" rel="noreferrer">${actionLabel}</a>
          ${project.githubRepo ? `<a href="${project.githubRepo}" target="_blank" rel="noreferrer">GitHub</a>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderAuditDashboard() {
  const audited = auditedPrototypeProjects();
  if (!state.auditSummary || !audited.length) {
    els.auditAverage.textContent = "--";
    els.auditLowest.textContent = "--";
    els.auditPass.textContent = "--";
    els.auditBlockers.textContent = "--";
    els.priorityQueue.innerHTML = `<div class="no-results">尚未載入評審驗收資料。</div>`;
    els.auditLeaderboard.innerHTML = `<div class="no-results">尚未載入評審驗收資料。</div>`;
    return;
  }

  const scores = audited.map((item) => item.audit.score);
  const lowest = Math.min(...scores);
  const priorityQueue = [...audited].sort((a, b) => a.audit.score - b.audit.score).slice(0, 5);
  const leaderboard = [...audited].sort((a, b) => b.audit.score - a.audit.score).slice(0, 5);

  els.auditAverage.textContent = `${state.auditSummary.averageScore}`;
  els.auditLowest.textContent = `${lowest}`;
  els.auditPass.textContent = `${state.auditSummary.heuristicPass}/${state.auditSummary.audited}`;
  els.auditBlockers.textContent = `${state.auditSummary.hasBlockers}`;
  els.priorityQueue.innerHTML = priorityQueue.map((item, index) => renderJudgeRow(item, index + 1, "queue")).join("");
  els.auditLeaderboard.innerHTML = leaderboard.map((item, index) => renderJudgeRow(item, index + 1, "leaderboard")).join("");
}

function renderPrototypeGallery() {
  const prototypes = publicPrototypeProjects();
  els.prototypeGalleryCount.textContent = prototypes.length;
  els.prototypeGallery.innerHTML = prototypes.map((project, index) => `
    <article class="demo-tile">
      <div class="demo-tile-number">${String(index + 1).padStart(2, "0")}</div>
      <div class="demo-tile-body">
        <span>${project.competitionName} · ${project.rocYear} 年</span>
        <h4>${displayName(project)}</h4>
        ${auditScoreBadge(project)}
        ${auditFor(project)?.priorities?.length ? `<p class="demo-priority">補強：${priorityText(auditFor(project))}</p>` : ""}
        <div class="demo-tile-links">
          <a class="demo-open-link" href="${demoLink(project)}" target="_blank" rel="noreferrer">開啟 Demo</a>
          ${project.githubRepo ? `<a href="${project.githubRepo}" target="_blank" rel="noreferrer">GitHub</a>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

function renderCards() {
  const items = state.filtered.slice(0, 40);
  els.resultCount.textContent = `${state.filtered.length} 筆${queryTerms(currentSearchQuery()).length ? "相關" : ""}`;

  if (!items.length) {
    els.cards.innerHTML = `<div class="no-results">目前篩選沒有結果。</div>`;
    return;
  }

  els.cards.innerHTML = items.map((project) => `
    <button class="project-card ${project.prototypeRepo ? "has-prototype" : ""} ${project.id === state.selectedId ? "active" : ""}" type="button" data-id="${project.id}">
      <div class="project-title">
        <strong>${displayName(project)}</strong>
        <span class="badge-stack">
          ${auditScoreBadge(project)}
          <span class="badge ${prototypeClass(project)}">${prototypeStatus(project)}</span>
          <span class="badge ${confidenceClass(project.softwareConfidence)}">${project.softwareConfidence}</span>
        </span>
      </div>
      <div class="meta-line">${project.school} / ${project.category} / ${project.rocYear} 年</div>
      <div class="meta-line">來源：${sourceLabel(project)}</div>
      <p class="concept-line">${project.implementationConcept}</p>
      ${renderKeywordChips(project, 5)}
    </button>
  `).join("");

  els.cards.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedId = card.dataset.id;
      render();
    });
  });
}

function renderTable() {
  const rows = state.filtered.map((project) => `
    <tr>
      <td>${project.rocYear}</td>
      <td>
        <strong>${displayName(project)}</strong>
        <span>${project.company || "公司名待補"}</span>
      </td>
      <td>${project.school}</td>
      <td>${project.category}</td>
      <td><span class="badge ${confidenceClass(project.softwareConfidence)}">${project.softwareCandidate ? project.softwareConfidence : "待查"}</span></td>
      <td>
        ${project.prototypeRepo
          ? `<span class="prototype-links-inline">
              <a class="prototype-table-link" href="${demoLink(project)}" target="_blank" rel="noreferrer"><span class="badge badge-prototype">Demo</span></a>
              ${project.githubRepo ? `<a class="prototype-table-link" href="${project.githubRepo}" target="_blank" rel="noreferrer"><span class="badge badge-github">GitHub</span></a>` : ""}
            </span>`
          : `<span class="badge badge-prototype-pending">待開原型</span>`}
      </td>
      <td>${sourceLink(project)}</td>
    </tr>
  `).join("");

  els.table.innerHTML = rows || `<tr><td colspan="7"><div class="no-results">沒有符合條件的作品。</div></td></tr>`;
}

function renderDetail() {
  const selected = publicProjects().find((project) => project.id === state.selectedId) || state.filtered[0];
  if (!selected) {
    els.detail.className = "detail-empty";
    els.detail.textContent = "選取一個作品後，這裡會顯示獎項來源、屆次、核心概念與原型狀態。";
    return;
  }
  state.selectedId = selected.id;
  const selectedAudit = auditFor(selected);

  const prototype = selected.prototypeRepo
    ? `<div class="prototype-actions">
        <a class="prototype-link" href="${demoLink(selected)}" target="_blank" rel="noreferrer">開啟 Demo</a>
        ${selected.githubRepo ? `<a class="prototype-link secondary" href="${selected.githubRepo}" target="_blank" rel="noreferrer">GitHub repo</a>` : ""}
      </div>`
    : `<span class="meta-line">尚未開原型 repo，已列入候選清單。</span>`;

  els.detail.className = "detail-body";
  els.detail.innerHTML = `
    <div>
      <span class="badge ${confidenceClass(selected.softwareConfidence)}">${selected.softwareConfidence}</span>
      <h4>${displayName(selected)}</h4>
    </div>
    <p class="concept-line">${selected.implementationConcept}</p>
    ${renderKeywordChips(selected, 10)}
    <div class="detail-list">
      <div class="detail-item"><span>獎項來源</span><strong>${sourceLabel(selected)}</strong></div>
      <div class="detail-item"><span>學校/場域</span><strong>${selected.school}</strong></div>
      <div class="detail-item"><span>公司</span><strong>${selected.company || "待補"}</strong></div>
      <div class="detail-item"><span>獎補助</span><strong>${selected.awardAmountTenThousandNtd || "待查"} 萬元</strong></div>
      <div class="detail-item"><span>原型狀態</span><strong>${prototypeStatus(selected)}</strong></div>
      ${selectedAudit ? `<div class="detail-item"><span>評審分數</span><strong>${selectedAudit.score} 分 · ${scoreLabel(selectedAudit.score)}</strong></div>` : ""}
      ${selectedAudit ? `<div class="detail-item"><span>優先補強</span><strong>${priorityText(selectedAudit)}</strong></div>` : ""}
    </div>
    ${prototype}
    ${sourceLink(selected, "官方得獎名單")}
  `;
}

function render() {
  state.filtered = filterProjects();
  if (!state.filtered.some((project) => project.id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.id || null;
  }
  renderMetrics();
  renderAuditDashboard();
  renderPrototypeGallery();
  renderCards();
  renderTable();
  renderDetail();
}

function exportFiltered() {
  const payload = JSON.stringify(state.filtered, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "filtered-youth-startup-projects.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function init() {
  const projectsResponse = await fetch("data/projects.json", { cache: "no-store" });
  state.dataset = await projectsResponse.json();
  try {
    const auditResponse = await fetch("data/demo-audit.json", { cache: "no-store" });
    if (auditResponse.ok) {
      const auditDataset = await auditResponse.json();
      state.auditSummary = auditDataset.summary;
      state.audits = new Map(auditDataset.audits.map((audit) => [audit.id, audit]));
    }
  } catch {
    // The registry remains usable even if the judge audit file is temporarily unavailable.
  }
  state.selectedId = publicProjects().find((project) => project.featuredDemo)?.id || null;
  const generated = new Date(state.dataset.generatedAt);
  els.generatedAt.textContent = `更新 ${generated.toLocaleDateString("zh-TW")}`;
  restoreSidebarState();
  setupFilters();
  render();
}

init().catch((error) => {
  els.cards.innerHTML = `<div class="no-results">資料載入失敗：${error.message}</div>`;
});
