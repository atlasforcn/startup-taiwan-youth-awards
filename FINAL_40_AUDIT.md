# 40 個 Demo 最終驗收報告

驗收日期：2026-06-25

## 結論

- 正式公開 demo：40
- 通過品質門檻：40 / 40
- 阻斷項目：0
- 平均分數：92 / 100
- 最低分數：75 / 100
- 必要文件缺漏：0
- GitHub 公開 repo：40

隱藏的 `startup-shared-fashion-platform` 未對應正式競賽，不列入 40 個完成數。

## 需求對照

| 使用者需求 | 完成證據 |
| --- | --- |
| 建立新創、市場、評審、網頁與互動設計專家 | [`EXPERT_SYSTEM.md`](EXPERT_SYSTEM.md) 已定義上述 4 位專家 |
| 可增加其他專家，但不超過 8 位 | 共 8 位；另加入商業模式、資料與來源、風險與倫理、品質驗收專家 |
| 討論並優化既有 demo | 既有作品補上市場、商模、驗證、來源與專業邊界；Medical Line 與 RAG 工作台另完成核心流程改版 |
| 開發尚未完成的項目 | 新增並公開 10 個完整互動 demo，讓正式總數由 30 增至 40 |
| 以評審角度選擇好壞 | 全部作品依同一份 100 分評分表驗收；低於 75 分或有阻斷項目即不算完成 |
| 上傳 GitHub | 主站、40 個 demo repo 與 GitHub Pages 均已建立 |

## 八位專家

1. 新創專家：問題、早期使用者、驗證假設與 MVP 範圍。
2. 市場專家：市場切入、競品替代、付費者與成長路徑。
3. 評審專家：依問題、市場、互動、驗證、商模、視覺、風險與品質評分。
4. 網頁與互動設計專家：把市場需求轉成可操作、可展示、可在手機使用的流程。
5. 商業模式專家：收入、成本、交易單位、採購與規模化。
6. 資料與來源專家：官方來源、資料限制、引用與可追溯性。
7. 風險與倫理專家：醫療、安全、法律、自動決策、隱私與人工複核邊界。
8. 品質驗收專家：必要文件、響應式版面、核心互動、錯誤狀態與發布檢查。

## 新增的 10 個完整 Demo

| # | Repo | 自動驗收分數 | 核心成果 |
| ---: | --- | ---: | --- |
| 31 | [`startup-moovo-micromobility`](https://github.com/atlasforcn/startup-moovo-micromobility) | 100 | 站點需求、調度、維運任務與場域成效 |
| 32 | [`startup-air-nursing-wound-care`](https://github.com/atlasforcn/startup-air-nursing-wound-care) | 92 | 傷口紀錄、風險分流、護理複核與追蹤 |
| 33 | [`startup-ai-pest-deterrence`](https://github.com/atlasforcn/startup-ai-pest-deterrence) | 90 | 事件辨識、安全規則、驅離紀錄與成效 |
| 34 | [`startup-basepara-baseball`](https://github.com/atlasforcn/startup-basepara-baseball) | 88 | 動作分析、訓練處方與進步追蹤 |
| 35 | [`startup-table-tennis-tactics`](https://github.com/atlasforcn/startup-table-tennis-tactics) | 81 | 比賽標記、落點分析、戰術與訓練任務 |
| 36 | [`startup-eatzy-healthy-map`](https://github.com/atlasforcn/startup-eatzy-healthy-map) | 82 | 餐點搜尋、營養比較、訂餐與意見回饋 |
| 37 | [`startup-carbon-footprint-action`](https://github.com/atlasforcn/startup-carbon-footprint-action) | 81 | 碳排估算、減碳任務、團隊挑戰與報告 |
| 38 | [`startup-doctor-chat-medication`](https://github.com/atlasforcn/startup-doctor-chat-medication) | 97 | 語音確認、異常升級、照護通知與人工接手 |
| 39 | [`startup-luggage-guardian`](https://github.com/atlasforcn/startup-luggage-guardian) | 98 | 旅程綁定、遺失模式、追蹤與理賠資料包 |
| 40 | [`startup-circular-clothing-workshop`](https://github.com/atlasforcn/startup-circular-clothing-workshop) | 100 | 衣物估況、改造報價、租賃與物件護照 |

## 驗收方法

每個正式 demo 必須同時符合：

1. 能追溯至正式競賽或主辦單位來源。
2. 有可操作的核心流程，不只是靜態首頁。
3. 有新創、市場、評審、互動、商模、來源、風險與品質證據。
4. 評分至少 75 分，且沒有阻斷項目。
5. 具備 `index.html`、`styles.css`、`app.js`、`README.md`、`SOURCE.md`、`docs/preview.png` 與 `docs/flow.png`。
6. 主站資料能連至公開 repo 與 GitHub Pages。

機器可讀的逐案結果位於 [`data/demo-audit.json`](data/demo-audit.json)，40 個作品的來源與 repo 對照位於 [`data/projects.json`](data/projects.json)。

## 後續維護

40 個作品已達成本階段完成定義。後續若持續改善，優先處理分數較低作品的市場量化、商模實驗與真實場域數據；這些是下一階段增強項目，不是本次驗收阻斷項目。
