const state = {
  dataset: null,
  filtered: [],
  selectedId: null,
};

const els = {
  search: document.querySelector("#searchInput"),
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
  metrics: {
    projects: document.querySelector("#metricProjects"),
    software: document.querySelector("#metricSoftware"),
    prototypes: document.querySelector("#metricPrototypes"),
    years: document.querySelector("#metricYears"),
  },
};

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

function displayName(project) {
  return project.team || project.company || "未命名作品";
}

function sourceLabel(project) {
  return `${project.competitionName} ${project.rocYear} 年 ${project.round}`;
}

function uniqueSorted(items) {
  return [...new Set(items.filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a), "zh-Hant"));
}

function sourceLink(project, label = "官方來源") {
  if (!project.sourceUrl) return `<span class="meta-line">來源待查</span>`;
  return `<a href="${project.sourceUrl}" target="_blank" rel="noreferrer">${label}</a>`;
}

function setupFilters() {
  const years = uniqueSorted(state.dataset.projects.map((p) => p.rocYear));
  const categories = uniqueSorted(state.dataset.projects.map((p) => p.category));

  els.year.insertAdjacentHTML("beforeend", years.map((year) => `<option value="${year}">${year} 年</option>`).join(""));
  els.category.insertAdjacentHTML("beforeend", categories.map((category) => `<option value="${category}">${category}</option>`).join(""));

  [els.search, els.year, els.category, els.confidence, els.softwareOnly, els.prototypeOnly].forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  els.exportButton.addEventListener("click", exportFiltered);
}

function filterProjects() {
  const query = els.search.value.trim().toLowerCase();
  const year = els.year.value;
  const category = els.category.value;
  const confidence = els.confidence.value;
  const softwareOnly = els.softwareOnly.checked;
  const prototypeOnly = els.prototypeOnly.checked;

  return state.dataset.projects.filter((project) => {
    const haystack = [
      displayName(project),
      project.company,
      project.school,
      project.category,
      project.implementationConcept,
    ].join(" ").toLowerCase();

    return (!query || haystack.includes(query))
      && (year === "all" || String(project.rocYear) === year)
      && (category === "all" || project.category === category)
      && (confidence === "all" || project.softwareConfidence === confidence)
      && (!softwareOnly || project.softwareCandidate)
      && (!prototypeOnly || project.prototypeRepo);
  });
}

function renderMetrics() {
  const projects = state.dataset.projects;
  const software = projects.filter((p) => p.softwareCandidate);
  const prototypes = projects.filter((p) => p.prototypeRepo);
  const years = uniqueSorted(projects.map((p) => p.rocYear));

  els.metrics.projects.textContent = projects.length;
  els.metrics.software.textContent = software.length;
  els.metrics.prototypes.textContent = prototypes.length;
  els.metrics.years.textContent = years.length;
}

function renderCards() {
  const items = state.filtered.slice(0, 40);
  els.resultCount.textContent = `${state.filtered.length} 筆`;

  if (!items.length) {
    els.cards.innerHTML = `<div class="no-results">目前篩選沒有結果。</div>`;
    return;
  }

  els.cards.innerHTML = items.map((project) => `
    <button class="project-card ${project.prototypeRepo ? "has-prototype" : ""} ${project.id === state.selectedId ? "active" : ""}" type="button" data-id="${project.id}">
      <div class="project-title">
        <strong>${displayName(project)}</strong>
        <span class="badge-stack">
          <span class="badge ${prototypeClass(project)}">${prototypeStatus(project)}</span>
          <span class="badge ${confidenceClass(project.softwareConfidence)}">${project.softwareConfidence}</span>
        </span>
      </div>
      <div class="meta-line">${project.school} / ${project.category} / ${project.rocYear} 年</div>
      <div class="meta-line">來源：${sourceLabel(project)}</div>
      <p class="concept-line">${project.implementationConcept}</p>
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
  const selected = state.dataset.projects.find((project) => project.id === state.selectedId) || state.filtered[0];
  if (!selected) {
    els.detail.className = "detail-empty";
    els.detail.textContent = "選取一個作品後，這裡會顯示獎項來源、屆次、核心概念與原型狀態。";
    return;
  }
  state.selectedId = selected.id;

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
    <div class="detail-list">
      <div class="detail-item"><span>獎項來源</span><strong>${sourceLabel(selected)}</strong></div>
      <div class="detail-item"><span>學校/場域</span><strong>${selected.school}</strong></div>
      <div class="detail-item"><span>公司</span><strong>${selected.company || "待補"}</strong></div>
      <div class="detail-item"><span>獎補助</span><strong>${selected.awardAmountTenThousandNtd || "待查"} 萬元</strong></div>
      <div class="detail-item"><span>原型狀態</span><strong>${prototypeStatus(selected)}</strong></div>
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
  const response = await fetch("data/projects.json");
  state.dataset = await response.json();
  const generated = new Date(state.dataset.generatedAt);
  els.generatedAt.textContent = `更新 ${generated.toLocaleDateString("zh-TW")}`;
  setupFilters();
  render();
}

init().catch((error) => {
  els.cards.innerHTML = `<div class="no-results">資料載入失敗：${error.message}</div>`;
});
