# MVP Implementation Plan — Construction Site RPS Adventure

> **計畫版本**：v2.0（2026-11-06；原始拆解依 Spec v1.6、Technical Design v0.10；狀態依 Technical Design v0.11）
> **計畫狀態**：M0-GATE passed（2026-11-09）；M0-01～M0-07 Done、M0-08 Not needed；允許進入 M1，正式產品／真機驗收仍待後續里程碑
> **交付版本**：MVP v1.0，Browser-First / Touch-First
> **核心問題**：**How will we deliver and verify it?**（Tasks / Execution / Verification）
> **核心職責**：**依已核准的規格與技術設計，拆成可獨立實作、測試和驗收的工作項目，定義依賴、里程碑、完成條件及驗證證據；不自行新增產品承諾、改寫行為或降低驗收標準。**
> **文件依據**：[PRD](../PRD.md)（Why / What）／[Constitution](../constitution.md)（Principles / Constraints）／[Spec](../spec.md)（FR / US / AC / NFR / NFR-AC 的唯一行為與驗收 SSOT）／[Technical Design](technical-design.md)（工程方案）／[AGENTS](../AGENTS.md)（Agent 工作規範）

## 1. 規劃基線、範圍與執行規則

- **自動化品質補強（2026-11-09）**：本機與 CI 共用 `npm run check`，E2E 先 build；啟用兩條型別感知 Promise lint 規則；main 必要 CI 檢查已設置。驗證結果及 WebKit 崩潰調查限制見 [開發紀錄](development.md#first-layer-quality-gate-2026-11-09)。此項為工程基線補強，不推進 M0-GATE 或產品驗收狀態。

- **P0 必須交付**：Spec FR-01～FR-12、US-01～US-12 與適用的 P0 NFR-AC。**FR-13／US-13 為 P1**，獨立評估、獨立記錄 Go / Defer，不是 M0～M2 或 P0 Release 的隱藏阻擋條件。
- **不在此計畫**：PRD §5.3 的 IDEA-01～07（更多場景／車輛擴充、鏡頭辨識、三人猜拳等）、原生 App、PWA、後端、帳號、分析追蹤；不得為未承諾的想法預建 framework、plugin、service 或通用 DSL。
- **技術基線**：Vanilla TypeScript strict + Vite；純 Domain／Reducer-Controller／Screen Renderer；SVG + CSS / WAAPI；版本化 localStorage；Vitest、DOM Testing Library、Playwright。TD-02／TD-04／TD-07 已依 M0 證據確認；如後續出現明確 UI 架構成本，React 仍是條件式備選，**不**同時完整開發兩套遊戲。
- **任務切分**：每個 `Mx-yy` 是一個可獨立審查／交付的垂直或工程工作項，列有「前置」「交付」「驗證／Done」「追蹤」。同里程碑內無依賴的任務可並行；不要以文件列出的先後順序虛構必要依賴。
- **狀態**：`Not started`／`In progress`／`Blocked`／`Done`。M0-01～M0-07 已完成，選型 Gate 已通過；M0-08 經 M0-07 證據判為 `Not needed`。證據見各任務、[M0-07 架構決策證據](m0-07-evidence.md)及[開發與驗證紀錄](development.md)。未宣稱已部署或完成裝置／親子試玩。
- **每項任務的 Done**：有可檢閱的程式碼或資產／文件變更、與變更風險相稱的新增測試（含失敗／邊界路徑）、適用的 typecheck／lint／test／build 結果、對應 AC／NFR-AC 的驗證證據及未解問題。僅寫程式、只有 happy path、或測試未執行，不能標記為 `Done`。
- **變更控制**：產品範圍先由 PRD 決策，行為與驗收先修 Spec，純工程取捨記 Technical Design，再更新本計畫；保留 FR／US／AC／NFR IDs。不得只為綠燈而弱化既有有效測試；需修改時附原因與原驗收語義是否仍有保障。
- **證據真實性**：自動化、Playwright WebKit、iPhone/iPad 真實 Safari、家長／幼兒試玩是不同證據。缺少實機或家庭試玩時記 `Blocked / Not verified`，不得以模擬器或猜測取代。

### 1.1 任務與里程碑總覽

| Milestone | 交付目的 | 主要任務 | 前置 Gate | Exit / 可前進條件 |
|---|---|---|---|---|
| **M0 — Technical Spike** | 規則／狀態骨架、Learn + Together 代表性流程、架構取證 | M0-01～M0-07；必要時 M0-08 | 文件基線已確認 | **Passed 2026-11-09**；Vanilla 與測試工具選型有證據，M0-08 Not needed |
| **M1 — Playable Vertical Slice** | 可玩的工地對決切片、首條因果、一次修復、Safari 初測 | M1-01～M1-08 | M0-GATE passed | 核心路徑可端到端重現，Safari 初次量測與觀察已記錄，已知缺口留待 M2／M3 |
| **M2 — Full Core Flows** | 完整 Learn／Computer／Together、三勝一平、情緒與回合安全 | M2-01～M2-07 | M1 Exit | 模式及規則 P0 行為的正／反向自動化與人工檢查有證據；不把 M3 未完成項目標為通過 |
| **M3 — Release Readiness** | 正式雙語與音訊、收藏存檔、跨裝置、隱私、效能與親子驗收 | M3-01～M3-09（M3-06 為 P1 條件任務） | M2 Exit | Spec §10 的 **P0** 驗收與 NFR 證據齊備、阻斷問題清除並完成 Release Gate |

**主要依賴**：`M0-01 → M0-02 → (M0-03, M0-04) → (M0-05, M0-06) → M0-07 [→ M0-08 若需要] → M0-GATE → M1 → M2 → M3`。里程碑間為 Gate；里程碑內詳見每項任務的精確前置。無必要依賴的資產草稿、測試案例設計與內容整理可提早準備，**但不得以此繞過 M0-GATE 進行大量正式 UI 實作**。

### 1.2 舊計畫 ID 相容性

舊版 `M0-S0`（Setup + Domain）、`M0-S1`（Learn Spike）、`M0-S2`（Together + Animation Spike）、`M0-S3`（Decision Gate）是工作包摘要，保留如下追蹤映射，而非另做第二套 M0：

| 舊工作包 | 本版原子任務 |
|---|---|
| M0-S0 | M0-01～M0-04 |
| M0-S1 | M0-05 |
| M0-S2 | M0-06 |
| M0-S3 | M0-07；M0-08 僅條件式；M0-GATE |

## 2. M0 — 最小 Technical Spike 與 Architecture Decision Gate

> **M0 目的**：驗證選型風險，而非將三種模式／正式音效／收藏 UI 提早全部完成。M0 原型能重用的可靠程式可延伸至 M1；不為 Spike 重造與正式實作不同的第二份 Domain。M0-01～M0-07 已完成；M0-GATE 已通過，M0-08 不需要。

### M0-01 — 可重現的開發與測試骨架

- **狀態**：`Done` — 2026-11-08。
- **實作／證據**：單 package、strict TypeScript、固定版本與 lockfile、ESLint、Vitest／DOM Testing Library、Chromium／WebKit Playwright，以及中英 placeholder。乾淨安裝、四項品質指令與 2/2 Vitest + 2/2 E2E 通過；實際版本、命令、環境修復及限制見 [開發與驗證紀錄](development.md)。僅建立 NFR-08 工程基線，九組規則、架構選型及真機驗收尚未完成。
- **前置**：無。
- **交付**：單 package 的 Vite `vanilla-ts`、TypeScript strict、npm lockfile、適合當時相依版本的 Node LTS／`engines`；Vitest + DOM Testing Library，Playwright Chromium／WebKit 基本設定；`typecheck`、`lint`、`test`、`build` 指令。只建實際需要的檔案，不建立空殼架構。
- **驗證／Done**：乾淨安裝及四項品質指令可重現；至少一個純函式單測、一個 DOM smoke 測試與可 build 的 placeholder 頁面；紀錄實際版本與命令輸出。若 Playwright browser 安裝受限，記錄限制與後續執行方式。
- **追蹤**：TD §2.4／§11.1；NFR-08（工程基線）。

#### CI 工程補充（2026-11-09）

- **範圍**：延伸 M0-01 的既有品質基線，新增 PR／`main` push／手動 GitHub Actions；執行乾淨安裝、typecheck／lint／test／build 與 Chromium／WebKit E2E，失敗保留報告與 trace。不改動產品範圍或 M0-GATE。
- **驗證**：本機檢查結果與 GitHub runner 尚未驗證的限制記錄於 [開發與驗證紀錄](development.md#ci-validation-evidence-2026-11-09)；新增 workflow 不代表遠端 CI 已通過。

### M0-02 — 唯一猜拳規則與手勢／角色映射

- **狀態**：`Done` — 2026-11-08。
- **前置**：M0-01。
- **交付**：`Gesture`、`RuleId`、`RoundResult`、`evaluateRound`、`winningGestureAgainst` 的純 Domain；三手勢與三固定主角的內容映射獨立於判定。
- **實作／證據**：[src/rps-domain.ts](../src/rps-domain.ts) 將規則計算和固定角色雙語內容分離；[src/rps-domain.test.ts](../src/rps-domain.test.ts) 覆蓋 9/9 配對、反轉雙方視角、三種勝利手勢查詢及三個固定角色映射。角色資料不參與判定函式。
- **驗證／Done**：於記錄環境執行 typecheck、lint、Vitest（15/15）及 production build，結果見[開發與驗證紀錄](development.md)。未涉及 UI／動畫或真機驗收。
- **追蹤**：FR-01／02；AC-01.2、AC-03.3；NFR-AC-08.1～08.3。

### M0-03 — 單回合 reducer／controller、事件及取消語義

- **狀態**：`Done` — 2026-11-08。
- **前置**：M0-01、M0-02。
- **交付**：獨立於 DOM 的合法模式／相位轉移、`roundId` / generation token、只在確認時鎖定選擇、效果邊界與可注入亂數／時鐘／媒體通知；保持最小而可測，不造通用狀態機 Framework。
- **實作／證據**：[src/round-controller.ts](../src/round-controller.ts) 提供純 reducer 與小型 controller：選擇／確認分離、Learn／Computer／Together 的基本單回合路徑、roundId 隔離、注入 computer random／clock／media、取消媒體與 watchdog 靜態降級。對照事件及 timer 測試見 [src/round-controller.test.ts](../src/round-controller.test.ts)。Learn 題目提示／三次答題／Mastery 不在本任務範圍，留 M0-05。
- **驗證／Done**：選卡不等於提交、連點只確認一次、非法相位事件無效、回首頁／重開後舊 timer／動畫 callback 被忽略、媒體回報不重算結果；使用 fake clock／effects 單測。
- **驗證結果**：Node 24.22.1／npm 10.9.2，`npm run typecheck`、`npm run lint`、`npm test`（4 files／27 tests）、`npm run build` 全部通過；PR 審查補上同步 listener 離開／dispose、媒體啟動／取消例外及明確靜態 reveal 的回歸測試。靜態內容需 renderer 回報已呈現，不以媒體失敗當作展示完成。完整記錄見 [開發與驗證紀錄](development.md)。未跑 E2E：本任務沒有 DOM／UI 變更；未作真機／幼兒驗收。
- **追蹤**：FR-02／10；AC-01.3、AC-06.1～06.3；NFR-AC-04.3；TD §6。

### M0-04 — 最小版本化進度保存 Adapter

- **狀態**：`Done` — 2026-11-09；自動化證據見[開發與驗證紀錄](development.md)。
- **前置**：M0-01、M0-02。
- **交付**：用單一版本化 JSON 保存三組 0～3 計數與已推導的收藏 ID，邊界解析／驗證／正規化、單次提交、記憶體降級及中英儲存警示的最小支援；進度計算不依賴 UI，正式設定畫面可後補。
- **驗證／Done**：正常 reload、寫入失敗、JSON 損毀、無法使用 localStorage、未知較新 schema 均可測；不假裝失敗寫入已保存，也不以舊版程式覆寫未知新版本；重試回呼不重複加計。
- **追蹤**：FR-11；AC-11.1／11.3／11.4；NFR-AC-07.1～07.2；TD §9。

### M0-05 — Learn Flow Spike（UI 同步、正確性與持續性）

- **狀態**：`Done`（2026-11-09；僅原型與自動化證據，非 M0-GATE／Learn 最終驗收）。
- **實作／證據**：[round-controller.ts](../src/round-controller.ts) 擴充現有 reducer／controller 的三次確認、主動／強制示範及同步合格首答交易；[learn-domain.ts](../src/learn-domain.ts) 管理固定輪替／3/3/3 混合與簡化因果內容；[learn-ui.ts](../src/learn-ui.ts) 以單一 delegated listener 呈現公開題幹、重選、非答案提示、完整靜態示範與明確看完確認。原型沒有正式動畫素材，預設走媒體失敗的靜態退路；強制示範完成前不提供下一題或回首頁。中性規則進度標籤不洩漏當題答案。Domain／Controller、DOM 與 Chromium／WebKit 證據見[開發紀錄](development.md#m0-05-validation-evidence-2026-11-09)。
- **前置**：M0-02、M0-03、M0-04。
- **非阻擋追蹤（已處理）**：`MasteryRuleId` 已衍生自 `Exclude<RuleId, 'tie'>`，掌握規則清單用 `satisfies` 與完整 Record 編譯期約束檢查；`npm run typecheck` 通過。來源：[PR #9 Standards 審查建議](https://github.com/W-Shih/rock-paper-scissors-for-kids/pull/9#issuecomment-6742798914)。此項為維護性改善，不影響 M0-04 已完成狀態，也不新增產品驗收條件。
- **交付**：placeholder 手勢／SVG、指定對手先顯示、可重選／確認、前兩次錯答各給非答案提示、第三次錯答揭曉／禁止第四次提交／**必須完成正確因果示範**（媒體故障時完整靜態示範），以及家長主動示範路徑。首次無提示正確在提交時才可加計。
- **驗證／Done**：Vitest + DOM 測試三次錯答、第二／第三次改對、首次正確、主動／強制示範、失敗降級、同題事件重送、2→3 解鎖及 reload；觀察 DOM 是否多處同步／重複 listener。原型測試不等於全部 Learn P0 最終驗收。
- **追蹤**：FR-03／11；AC-07.1～07.4、AC-11.1／11.3；NFR-AC-04.2～04.3。

### M0-06 — Together + Animation Spike（保密與非同步安全）

- **狀態**：`Done`（2026-11-09；僅原型與自動化證據，非 M0-GATE／Together 最終驗收）。
- **實作／證據**：[together-ui.ts](../src/together-ui.ts) 重用既有 controller／Domain，單一 delegated listener 與 state renderer 管理 P1／中性交接／P2／共同揭曉；[together-media.ts](../src/together-media.ts) 管理倒數、匿名 SVG／WAAPI 進場、可取消媒體及靜態失敗退路；[prototype-app.ts](../src/prototype-app.ts) 僅提供原型入口及 pagehide（含 bfcache）／pageshow／popstate 安全重開。交接等待玩家主動確認，不設媒體 watchdog 自動交接。九種實際配對、DOM／ARIA／焦點保密、取消／reload／返回、重玩／舊通知、WAAPI reject／部分啟動失敗／timeout／dispose 與不增加 Mastery 均有測試。完整命令與限制見[開發紀錄](development.md#m0-06-validation-evidence-2026-11-09)。
- **前置**：M0-02、M0-03（共享 M0-01 工具鏈）。
- **交付**：P1 選拳確認 → 無法辨識的交接頁 → P2 確認 → 簡單倒數、SVG／WAAPI 移動與中央共同揭曉；動畫／訂閱可取消，媒體失敗可顯示靜態正確結果。
- **驗證／Done**：DOM／ARIA 不殘留可辨識的 P1 選項；返回、取消、reload 不洩漏；連點、重玩、動畫取消／拒絕／逾時、舊回合 callback 不重複結算；以 DOM 測試及至少一條 Playwright 代表流程留證，觀察重渲染與事件生命週期。
- **追蹤**：FR-05／06／10；AC-09.1～09.3、AC-02.3～02.4；NFR-AC-04.2～04.3。

### M0-07 — 原型證據整理與架構選型評估

- **狀態**：`Done` — 2026-11-09；M0-GATE 技術選型部分通過。
- **前置**：M0-05、M0-06。
- **交付／證據**：[M0-07 架構決策證據](m0-07-evidence.md) 列出 M0-05／06 commit 與關鍵檔案、實際通過的測試、開發期間重現且已修復的失敗案例、Controller／Renderer 責任、listener／訂閱／timer／WAAPI 清理邊界，以及測試脆弱性與未驗證範圍；按 [TD §12.3](technical-design.md) 五項面向逐條評估。
- **決策**：原型呈現單一 state-driven renderer、明確 cleanup 與可測 public seams；沒有需 React 對照的未解架構失敗。TD-02 = `Confirmed Vanilla`、TD-04 = `Confirmed Vanilla`、TD-07 = `Confirmed for M0/MVP automation`；M0-08 `Not needed`；M0-GATE 允許進入 M1。
- **驗證結果**：Coordinator 在 Node 24.22.2／npm 11.13.0（npm 超出 repo 宣告版本範圍）執行 `npm run check`，typecheck、lint、68 unit/DOM tests、production build 通過，但 sandbox E2E preview 以 `EACCES` 停止；另在支援權限下執行 E2E，Chromium／WebKit 共 12/12 通過。單次 `npm run check` 未整體 exit 0；逐項結果與已知 WebKit 歷史不穩定見[M0-07 證據](m0-07-evidence.md)。M0-05／06 歷史驗證另依文件所列 Node 24.22.1／npm 10.9.2。
- **追蹤**：TD §2.3／§12.3；NFR-08；M0-GATE。

### M0-08 — 條件式 React 最小對照 Spike（非預設）

- **狀態**：`Not needed` — M0-07 未找到明確且未解的 Vanilla UI 架構成本；若後續 M1/M2 出現具體、可重現且難以簡單修復的架構問題，可重新評估。
- **前置**：M0-07 找到明確、可重現且難以用簡單修復解決的 Vanilla UI 架構成本。
- **交付**：僅重做造成問題的最小代表畫面與其測試，與現有 Vanilla 比較 DOM 同步、動畫取消、測試穩定度與維護成本；不建立完整第二款遊戲。
- **驗證／Done**：附兩方案同條件的可重現資料及選型結論，回寫 TD-02／04／07；若未觸發則標記 `Not needed`，而非偽裝成測試已通過。
- **追蹤**：TD §12.3；工程決策，非新增 FR。

**M0-GATE — 進入 M1 的硬性關卡**：**Passed 2026-11-09 for the technical selection.** M0-01～M0-07 證據已審閱；M0-08 條件未觸發；Vanilla TypeScript strict + Vite、純 Domain／framework-independent Reducer-Controller／Screen Renderer、Vitest + DOM Testing Library + Playwright 已依證據正式選定。**不以原型通過宣稱 Safari 真機驗收、完整 Learn/Together、正式音效或 MVP 完成。** M1 可開始，其自身驗收條件仍依後續任務完成。


## 3. M1 — First Playable Vertical Slice

> **前置**：M0-GATE passed。以一條**真實公平的 Computer 對戰**作為第一個孩子可玩的端到端切片（不是偽裝成電腦公平對戰的固定勝利演示）；完整 Learn／Together UI 在 M2 收斂。先完成一條正式因果分鏡，其餘組合此階段用**正確的雙語靜態規則結果**暫代，不可宣稱 FR-07 已全數完成。

### M1-01 — App shell、首頁與模式導覽

- **前置**：M0-GATE。
- **交付**：首頁、學習／比賽／收藏／家長設定的導覽入口及最小畫面切換；比賽可選 Computer／Together，尚未完成的正式模式清楚標識原型狀態；UI 由 controller state 驅動，不複製 Domain。所有已出現文字先遵守中英並列，完整 Copy Audit 留 M3。
- **驗證／Done**：DOM 測試導覽、返回、重進／cleanup，沒有重複 listener 或錯誤沿用舊回合；不以未實作的畫面冒充可玩模式。
- **追蹤**：FR-09／10／12；AC-06.2、AC-10.1、AC-12.4；TD §4。
- **狀態／證據**：Done (2026-11-09). Full `npm run check` passed under Node v24.22.1 / npm 11.19.1: typecheck, lint, 72 unit/DOM tests, production build, and 12 Playwright E2E cases (Chromium + WebKit). Shell navigation E2E were updated to enter Learn via home and its prototype start screen; the first run exposed those old direct-launch assumptions, then corrected cases passed in the full run. Parent visually inspected home and Play screenshots at 390×844. Safari device testing and parent-child playtesting were not performed.

### M1-02 — 三大手勢卡與 Touch-First 介面

- **前置**：M1-01、M0-02。
- **交付**：三張突出手勢的選拳卡、車車中英名稱、確認前重選、可看見的已選狀態、可操作按鈕與基本響應式布局。
- **驗證／Done**：DOM + mobile viewport 測試重選、確認、快速連點、鍵盤／焦點、無音訊辨識；檢查 iPhone 直向與 iPad 直／橫向主要按鈕和安全區，不以 desktop viewport 模擬充當真機結論。
- **追蹤**：FR-01／12；AC-01.1～01.3、AC-12.2；NFR-AC-02.1～02.2、06.1。
- **狀態／證據**：`Done (implementation and automated checks)` — 2026-11-09. Learn／Together 使用共用的三張雙語手勢卡；Playwright Chromium 與 WebKit 在 390×844、820×1180、1180×820 viewport 覆蓋重選、快速連點、鍵盤確認、焦點、無音訊辨識及控件尺寸／水平溢位。DOM focused suites 32/32 passed；viewport E2E 6/6 passed。WebKit viewport screenshots 位於 ignored `test-results/m1-02/webkit-{iphone-portrait,ipad-portrait,ipad-landscape}.png`，經 Review 視覺檢查，三個尺寸均顯示卡片、選取勾號及主要按鈕，未見裁切／重疊。**AC-12.2／NFR-AC-02.2 的實機 Safari 與實際工具列／安全區操作尚未驗證**；Playwright viewport 與 CSS safe-area 支援不能代替 iPhone／iPad 真機檢查。兒童／家長試玩亦未執行；M1-08／M3-05 仍需記錄裝置證據。
- **抽取整理（2026-11-09）**：Learn 與 Together 現共用 `createGestureSelection(selection)`，集中三卡順序、ARIA 標籤、選取狀態及雙語確認鈕；Learn 仍在回傳容器末端附加示範按鈕，Together 仍由當前玩家狀態提供 selection。新增 null 與三種 Gesture 的 DOM contract 測試。Node v24.22.2 / npm 11.13.0：`npm run check` 通過（typecheck、lint、77/77 Vitest tests、production build、18/18 Playwright E2E：Chromium 9、WebKit 9）。首次 sandbox 執行因無法綁定 `127.0.0.1:4173` 未能啟動 E2E；獲准提升權限後完整重跑通過。此工程整理不改產品行為；M1-02 既有真機 Safari／親子驗收仍待完成，獨立 review 與交付亦待進行。

### M1-03 — 公平 Computer 單回合接線

- **前置**：M1-02、M0-03。
- **交付**：以注入式、與玩家選擇獨立的等機率三選一來源鎖定電腦手勢；雙方選擇一旦確認便計算唯一結果，揭曉前電腦車種保持中性／保密。
- **驗證／Done**：單測可強制 RNG 覆蓋三輸出、9 個配對與獨立性；DOM／E2E 確認猜拳前無對手手勢、車形或 ARIA 洩漏、揭曉後結果與 engine 相同；無為取悅孩子而重抽或預設勝利。
- **追蹤**：FR-02／04；AC-08.1～08.3；NFR-AC-08.1～08.2。

### M1-04 — 三位原創角色與一個工地場景（首版）

- **前置**：M1-01；可與 M1-02／03 並行。
- **交付**：三主角可辨識的原創分層 SVG／合理 placeholder、一個單純工地場景、手勢及角色 key 對照；素材出處／權利記錄，不依賴線上第三方圖檔。
- **驗證／Done**：三種手勢與車外觀一對一，畫面能在窄裝置辨識；文字、手勢和關鍵按鈕不受遮擋；素材權利未知者明確標「prototype only」並列正式替換任務。
- **追蹤**：FR-01／07；AC-01.2／01.4、AC-03.3；TD §7。

### M1-05 — 共用倒數、前進、中央揭曉與故障回退

- **前置**：M1-03、M1-04。
- **交付**：3-2-1 Ready, Set, Go 畫面、SVG/CSS/WAAPI 前進、中央才 reveal、對結果的媒體效果接線；音訊不可阻擋相位、動畫取消／故障／watchdog 可轉正確靜態結果。
- **驗證／Done**：受控 timer／animation fault 測試倒數順序、對手保密、取消、拒絕、超時、模式退出、舊 token；不因車速、動畫先後或重複 callback 改判結果。
- **追蹤**：FR-06／10；AC-02.1～02.4；NFR-AC-03.3、04.1～04.3。

### M1-06 — 第一條完整因果分鏡 + 正確靜態替代

- **前置**：M1-04、M1-05。
- **交付**：先製作 `rock-beats-scissors` 的完整原創因果分鏡；結果畫面同步顯示雙方大手勢、中英規則句與勝負／平手。其餘結果先以**完整且正確的靜態因果說明**暫代，M2-04 再補動畫；注意左右站位。
- **驗證／Done**：第一條分鏡兩側站位、相關 Win/Lose 都一致；其他規則可正確完成一局而不留空白／錯誤文案；圖像載入失敗時可顯示手勢、正確規則及簡化因果內容。
- **追蹤**：FR-02／07；AC-03.1／03.3～03.4（**部分**）；NFR-AC-04.2；TD §7。

### M1-07 — 勝負／平手結果、首個輸家修復與再玩

- **前置**：M1-05、M1-06。
- **交付**：Computer 回合完成頁、勝負／平手的清楚可視回饋、第一組溫和失利安撫與復原、再玩／首頁；此階段以可理解的靜態或簡化慶祝為主，正式掌聲／雙語語音及完整變化留 M3。
- **驗證／Done**：一局只一結果、所有勝負平手可到完成、失利角色最終恢復、無羞辱／不扣進度；再玩產生新 roundId，舊局資料或事件不影響下一局；E2E 可覆蓋。
- **追蹤**：FR-08／10；AC-04.1～04.3（部分）、AC-06.1～06.4；NFR-AC-04.3。

### M1-08 — Vertical Slice 整合、Safari 初測及效能基線

- **前置**：M1-01～M1-07。
- **交付**：跑 Computer 端到端流程、故障降級與重玩；真實 iPhone Safari 直向、iPad Safari 直／橫向初測，記錄首次可操作時間、觸控回應、動畫掉格／停頓、開始到結果等待及裝置／OS／測試條件；儘可能進行一次家長／孩子原型試玩，分辨「記得車車」與「理解手勢」。
- **驗證／Done**：自動化結果、真機觀察與初始效能量測有可查證記錄；未取得設備／觀察則標 `Blocked` 並列明影響，不以 WebKit 仿冒真 Safari。此處只**建立 NFR-03 基準**，不可先宣稱最終效能驗收已通過。
- **追蹤**：US-02／03／04／06／08／12 代表流程；NFR-AC-01.1、02.1～02.3、03.1；Spec §10.2。

**M1 Exit**：有一條完整可玩的公平 Computer 回合、可理解的規則／情緒回饋、失敗退路、可重玩；第一條動畫可在 Safari 實際展示並附量測／試玩觀察與缺口。**FR-07 的四類正式動畫、正式語音／掌聲、完整 Learn／Together 和三台收藏車仍屬 M2／M3，不能於此關卡標記已驗收。**

## 4. M2 — 完整核心模式、規則與情緒閉環

> **前置**：M1 Exit。M2 不重新建第二套 reducer、RPS engine 或 DOM UI；以 M0／M1 已驗證的元件延伸。M2 主要驗收**功能正確**，正式語音素材、收藏館與跨裝置 Release Gate 在 M3。

### M2-01 — Learn 全流程整合與強制正確示範

- **前置**：M1-02、M1-05、M0-05。
- **交付**：整合正式 Learn UI：先顯示指定對手／問句、可重選但只有確認作答；第一次／第二次錯答僅溫和不揭曉答案的提示，第三次仍錯才揭曉且封鎖第四次；自動**完成**正確因果示範才可進完成頁。家長主動看示範為獨立路徑。錯答不轉正式 Lose；媒體失敗有完整靜態／簡化必要示範。
- **驗證／Done**：Vitest + DOM + E2E 驗證首次答對、1/2 次答錯提示（無答案）、第 3 次錯答揭曉、不得第 4 次、提示後第 2／3 次答對、主動示範、強制示範、媒體失效、無假獎勵；沒有任何路徑跳過必要規則因果說明。
- **追蹤**：FR-03／07；AC-07.1～07.3；NFR-AC-04.2～04.3。

### M2-02 — Mastery 正式計數、出題輪替與混合門檻

- **前置**：M2-01、M0-04。
- **交付**：每條勝利規則的合格首答 0～3 計數，在**首次有效且無提示**的正確確認同步更新記憶體並保存；每個新的 Learn 題只可加一次。未全達 3 前按固定題序輪替，**三條全部達 3/3/3 才混合**；對應首次解鎖以 Domain 推導（Garage UI 留 M3）。
- **驗證／Done**：每條 0→1→2→3、單組 3/3 但其他未達標、3/3/3 切換、非連續答對、重複題幹但不同 roundId、提示後補答、主動／強制示範、Replay、普通戰鬥、重複提交、舊 callback、reload 與存檔故障均有測試；不得雙加或倒退。
- **追蹤**：FR-03／11；AC-07.4、AC-11.1／11.3；NFR-AC-04.3、07.1～07.3。

### M2-03 — Together 同螢幕雙人正式整合

- **前置**：M1-01、M1-05、M0-06。
- **交付**：Player 1（孩子）選拳固定 → 完全中性的交接 → Player 2（家長）選拳固定 → 共同倒數與同時揭曉；正常返回、取消、重載採安全重開，不還原 P1 祕密。中性車影及 DOM／ARIA／focus 不洩漏對方手勢。
- **驗證／Done**：正反向 DOM／E2E 測試返回、取消、reload、P1/P2 快速連點、保密交接及揭曉順序；9 組含平手的真實選擇正確，無登入／鏡頭依賴。
- **追蹤**：FR-05／06；AC-09.1～09.4；NFR-AC-04.3、05.1。

### M2-04 — 補齊三條勝負與平手的因果動畫

- **前置**：M1-06；M2-03 可與本項並行。
- **交付**：`rock-beats-scissors`、`scissors-beats-paper`、`paper-beats-rock`、`tie` 全部分鏡／靜態降級；每種勝負雙站位、三種平手（相同主角）；演出和文字來自 immutable RoundResult，動畫只說明不判定。
- **驗證／Done**：3×2 勝利方向＋3 平手的視覺檢核與 screenshot／人工紀錄；所有結果的手勢、中英規則句、車車、因果方向均正確，失敗時仍有完整圖文；不因更新素材使 9/9 engine 測試失敗。
- **追蹤**：FR-02／07；AC-03.1～03.4、AC-08.4；NFR-AC-04.2、08.2。

### M2-05 — 完整勝／負／平手情緒回饋與修復

- **前置**：M1-07、M2-04。
- **交付**：幼兒勝利、輸時安撫型與教練型（可避免連續同句）、平手共同慶祝；每個失利角色均可復原，親子模式依雙方實際勝負給予尊重回饋。音訊 cue 只留可替換界面，正式錄音 M3。
- **驗證／Done**：Computer 孩子輸／贏／平手、Together 孩子勝／家長勝／平手的畫面與情緒語義測試；最後均無永久壞損或扣除學習成果；確認 Learn 答錯不觸發競賽輸局回饋。
- **追蹤**：FR-08／10／11；AC-04.1～04.4、AC-05.2／05.4（視覺／文案部分）。

### M2-06 — 跨模式回合生命週期與失敗恢復

- **前置**：M2-01～M2-05。
- **交付**：所有模式共用唯一結算／完成／重玩／回首頁路徑，離開時取消 clock、WAAPI、語音隊列與事件訂閱；第三次錯答的必要示範使用可驗證的完成條件，不能讓跳過／故障假裝示範完成。
- **驗證／Done**：cross-mode table-driven / E2E：快速連點、切換、重玩、重載、過期 callback、動畫 reject／cancel／watchdog、音訊拒播；對每局最多一結果／一個合格計數事件／一個解鎖事件；所有 P0 必要內容能到達完成且無無限等待。
- **追蹤**：FR-03／05／06／07／10／11；AC-02.3～02.4、AC-06.x、AC-07.2～07.3；NFR-AC-03.3、04.1～04.3。

### M2-07 — 核心模式整合驗收與回歸 Gate

- **前置**：M2-01～M2-06。
- **交付**：保留可重複執行的 Domain／Controller／DOM／Playwright 矩陣，覆蓋 Learn、Computer、Together、三條勝負／三種平手、左右站位、情緒恢復、保密與示範降級；整理未解問題及 M3 接續。
- **驗證／Done**：測試均有執行環境／版本／結果；P0 模式阻斷缺陷已修正且無退化，缺少正式音訊與 Garage 等 M3 交付不標為通過；獨立檢查 Scope 未新增 IDEA 功能。
- **追蹤**：FR-01～08、FR-10；US-01～09（相關部分）；NFR-04／08。

**M2 Exit**：Learn 的三次答題與合格計數／混合題、Computer 公平與隱藏、Together 保密、三勝一平動畫與雙向站位、情緒修復、唯一結果與故障降級的正反向測試有證據。未完成的**正式資產／音訊、Garage 最終 UI、設定與資料驗收、跨瀏覽器 Release**仍留給 M3。


## 5. M3 — 雙語、收藏、品質與 Release Readiness

> **前置**：M2 Exit。M3 可在不修改 P0 需求的前提下並行準備合法素材、雙語 Copy 與真機測試安排；但發布必須經 M3 Release Gate，P1 的交付與否另作決策。

### M3-01 — 全畫面中英並列 Copy 與內容一致性

- **前置**：M2-07、M1-01。
- **交付**：以 typed content keys 管理所有首頁、卡片、Learn 提問／提示、規則句、倒數、結果、再玩、Garage、家長設定、錯誤及儲存警示文案；**全部畫面文字固定繁中 + 英文並列**，語音設定不能隱藏其中一種；維持「布 / Paper」同手勢。
- **驗證／Done**：DOM／內容表測試三種語音設定下每個主要畫面的雙語文字、繁中與英文 key 完整性、字義不矛盾、無僅靠圖片嵌入的必要文字；家長審閱幼兒可理解的短句。
- **追蹤**：FR-01／03／09；AC-01.1、AC-03.3、AC-07.1、AC-10.1／10.3；NFR-AC-06.1～06.2。

### M3-02 — 三語音模式、合法音訊與 Safari 無聲降級

- **前置**：M3-01、M2-07。
- **交付**：合法預錄／自製短句音檔與音效、單一可取消 Audio queue；語音為**雙語預設中→英／中文／英文**三選一，重聽遵循設定；獨立語音／音效靜音及音量。孩子（Computer 或 Together 的 P1）獲勝播放**完整臺灣版「愛的鼓勵」節奏**的合法／自製掌聲；家長勝利、平手、示範與普通完成僅用相應友善或短 cue。音訊授權或自製來源可追溯。
- **驗證／Done**：播放順序／切換／中途取消／重聽／音效不遮蔽語音的測試；模擬 autoplay reject、檔案缺失、muted、replay、回首頁及舊 queue；**iPhone／iPad 真實 Safari 點擊後首播**驗證。任何音訊失敗時仍能完成圖文遊戲，未取得合法權利不得以來源不明音檔取代。
- **追蹤**：FR-08／09；AC-05.1～05.4、AC-10.1～10.4；NFR-AC-04.1、06.2。

### M3-03 — Garage、六車展示與一次性解鎖

- **前置**：M2-02、M3-01。
- **交付**：三主角從一開始可查看且能出拳；另三台**僅供收藏**的原創車車（每條 MasteryRuleId 對應唯一 ID）及 locked／unlocked、每條 0/3～3/3 中性進度、一次性解鎖回饋與全收集完成提示。三台額外車的正式名稱、造型和素材權利在此定案，不得變成第四種手勢。
- **驗證／Done**：各規則從 2→3 恰好解鎖其一台，3/3/3 全數完成，重播／重複事件／普通戰鬥／示範不額外解鎖；收藏館的關鎖／解鎖／完成狀態與保存資料一致，主角對應不被解鎖流程改變；必要素材與權利清單已核對。
- **追蹤**：FR-01／11；AC-01.4、AC-11.1～11.4；NFR-AC-04.3、07.1。

### M3-04 — 家長設定、完整持久化與安全重設

- **前置**：M3-02、M3-03、M0-04。
- **交付**：語音語言、語音／音效靜音與音量、localStorage 範圍／清除資料說明、**重設進度二次確認**；單一版本化紀錄的 schema 驗證、解鎖一致性、未知較新版本防覆寫、無法持久化時家長可見中英提示、舊 round token 失效。
- **驗證／Done**：reload／正常重新開啟後三計數、三解鎖和偏好一致；切語音／重玩／輸或平手不清除；損壞、缺值、未知 schema、QuotaExceeded／SecurityError、Storage unavailable、取消重設／確認重設、舊回呼延遲發生均有測試；重設操作以外不會遺失既有有效進度。
- **追蹤**：FR-09／11；AC-10.2、AC-11.3～11.4；NFR-AC-05.3、07.1～07.3。

### M3-05 — 正式 Touch-First、無障礙與跨畫面版面收斂

- **前置**：M3-01～M3-04。
- **驗證補強狀態（2026-11-09）**：窄螢幕／觸控 E2E 與無障礙掃描列入本任務，均為 `Not started`；本次僅補驗證計畫，不代表工具、測試或驗收已完成。技術方法與證據格式見 [Technical Design §11.3](technical-design.md)。
- **交付**：所有畫面的 mobile-first 排版、安全區／動態 viewport、足夠手指目標、對比／焦點／標籤、音訊關閉仍可辨識的手勢與規則；不以顏色或長句作唯一提示；完成家長設定入口的防誤觸 UX。
- **自動化交付**：建立 Chromium／WebKit 的窄手機直向、平板直／橫向與觸控操作矩陣；為主要畫面及動態狀態加入無障礙掃描。情境範圍、失敗判定及人工驗證邊界依 TD §11.3，工具選型留待實作。
- **驗證／Done**：iPhone Safari 直向、iPad Safari 直／橫向觸控與安全區、窄螢幕無妨礙操作的水平捲動；手勢、確認、結果、再玩、音訊重播和設定皆可用；以 56×56 CSS px 為設計參照，例外以實機證據說明；記錄家長／孩子誤觸與理解情形。
- **自動化完成條件與證據**：TD §11.3 定義的流程／狀態及矩陣有可重跑結果；必要控制的遮擋、水平溢位與觸控阻斷問題已處理；掃描發現逐項判讀，涉及既有 AC 的有效缺陷已修正並重跑，誤報／排除附理由及人工證據。交付環境／版本、狀態矩陣、命令、掃描報告、失敗截圖／trace、修正結果與焦點／實機複核紀錄；任何缺測或未解項目明列，不能以自動化通過代替原有實機／親子 Done 條件。
- **追蹤**：FR-01／09／12；AC-01.1、AC-10.4、AC-12.2；NFR-AC-02.1～02.3、06.1～06.2。

### M3-06 — FR-13／US-13 P1 獨立 Go / Defer（條件任務）

- **前置**：M2-07；若決定實作，與 M3-05 協調集成驗證。
- **交付**：在 M3 最終驗收前記錄**Go / Defer**、對幼兒舒適度的收益／成本與產品決策。**Defer**：明確標記 FR-13／US-13 和 NFR-AC-06.3 未交付，不阻擋 P0 MVP；**Go**：實作減少動態、跳過及重播，保留所有必要手勢／勝負／因果內容，尤其不能跳過 Learn 第三次錯答後的必要示範。
- **驗證／Done**：Go 時測 reduced motion、skip／replay、音畫取消、雙人保密、同一回合只結算／計數／解鎖一次；Defer 時留決策紀錄，不可把未開發的 P1 標為通過。
- **追蹤**：FR-13／US-13；AC-13.1～13.3；NFR-AC-06.3（P1 only）。

### M3-07 — 效能定標、HTTPS 部署與隱私／資產稽核

- **前置**：M1-08、M3-05；可與 M3-06 並行。
- **驗證補強狀態（2026-11-09）**：非預期外部請求檢查列入本任務，狀態為 `Not started`；本次未實作攔截／觀測工具或測試。方法及證據格式見 [Technical Design §11.3](technical-design.md)。
- **交付**：根據 M1 量測與家長試玩提出**可重現**的 NFR-03 效能門檻，於最終驗收前由產品負責人確認並回填 Spec；按門檻在真機複測；選定靜態 HTTPS hosting／同源資產路徑、hash／cache 相容性、可重建 build；確認無兒童個資、裝置敏感權限請求、廣告、付費、外部 tracking 或非必要第三方請求。完成圖像／音效／錄音的授權或自製來源清單。
- **自動化交付**：對 production build 的主要流程觀測未核准外部請求嘗試，維護具用途／決策依據的精確允許來源清單；加入可控的負向偵測案例，並對部署後 HTTPS 站點複核。涵蓋方式與未支援通道依 TD §11.3 記錄，不因加入清單而批准新資料流程。
- **驗證／Done**：有裝置與操作條件的初測／複測記錄、確立門檻及判定結果；HTTPS URL 可直接開啟，無 PWA／帳號／原生 App；檢查 Network、Permission、build 和部署後 smoke；不合法或權利不明的正式資產是 Release blocker。**門檻未決定或未複測不得宣稱 NFR-03 pass**。
- **自動化完成條件與證據**：正常流程無未核准外部請求，受控違規／重新導向案例可使檢查報錯且不外送資料；部署 smoke 與人工 Network／權限複核有結果。交付 build／URL、環境與命令、流程清單、允許來源及依據、已去識別的請求摘要、正負向結果與未觀測通道／處置紀錄；未解違規或缺少適用證據時不得標記本項通過，同源請求與 UI／素材稽核仍維持原責任。
- **追蹤**：FR-06／07／12；AC-12.1／12.4；NFR-AC-01.3、03.1～03.3、05.1～05.2。

### M3-08 — P0 全量驗收、跨瀏覽器與親子試玩報告

- **前置**：M3-02～M3-05、M3-07、M2-07，以及 M3-06 的 Go / Defer 決策紀錄；若選 Go，還需完成 M3-06 實作與測試。
- **交付**：對照 [Spec §2.2](../spec.md)、[§9.4](../spec.md)、[§10](../spec.md) 逐項執行 AC／NFR-AC，包含 iPhone Safari 直向、iPad Safari 直／橫向、Android／桌面選定瀏覽器；記錄孩子選卡、是否誤解車速／手勢、面對不同對手的回應、輸後情緒、再玩與螢幕外手勢觀察。學習觀察**不**以孩子答對率當作軟體硬門檻，也不收集孩子個資。
- **驗證／Done**：每項 P0 AC／NFR-AC 有環境、重現步驟、結果與證據；尚待人工／真機者明列 `Blocked / Not verified`；已知 P0 失敗有修正與回歸結果；P1 若 Defer 標 excluded；提交測試紀錄與需產品決策的體驗議題。
- **補強證據彙整**：收錄 M3-05 的 viewport／觸控矩陣、無障礙掃描及人工複核，與 M3-07 的請求檢查正負向結果及部署複核；依各自追蹤的 Spec IDs 登錄結果，保留工具限制、誤報依據與未驗證項目，不以掃描零發現或同源流量取代產品驗收。
- **追蹤**：US-01～US-12、FR-01～FR-12；NFR-01～NFR-08（P0 部分）；Spec §10.1～10.3。

### M3-09 — Release Gate、文件交付與回歸封版

- **前置**：M3-08。
- **交付**：統合全量品質指令、E2E、真機／家長試玩證據、權利與隱私稽核、效能門檻判定及全部 P0 blocker；審閱 Breaking Changes、文件／版本／README、部署回退與已知限制（同 origin、清網站資料、無離線或跨裝置同步）。
- **驗證／Done**：只有全部 Spec §10 **P0 軟體與所需實機／親子驗收活動**有真實證據、重大未解缺陷已處理、授權合法、NFR-03 門檻已確認且通過，才能標記 Release ready。P1 是否交付與未解非阻擋事項有明確記錄；不得把文件已完成等同產品已完成。
- **持續回歸證據**：確認已實作的窄螢幕／觸控、無障礙與請求檢查納入適用的例行品質指令／CI；記錄觸發方式、環境、最近執行結果、報告位置與保留期限。需人工執行或不能自動化的部分保留可重現步驟與實際證據；未執行項目依原 Release Gate 處理，不因新增文件而視為完成。
- **追蹤**：PRD §6／§8；Spec §10；AGENTS.md；Release Gate。

**M3 / Release Exit**：正式語音、雙語、Garage 與存檔、三種模式、四類分鏡、情緒安全、Safari／Android／桌面、隱私、合法素材、故障回退、性能定標與親子觀察皆有**可查證的 P0 驗收證據**。若任何 P0 Gate 未滿足，狀態維持 `Not ready / Blocked`，列明問題及下一個修復任務，不能自動降低 Spec。


## 6. 測試策略與高風險驗收矩陣

**驗證層級**：`U`＝Vitest Domain／Controller／Storage 單元測試；`D`＝DOM Testing Library；`E`＝Playwright Chromium／WebKit E2E；`R`＝真實 iPhone／iPad Safari、Android／桌面瀏覽器；`H`＝家長／幼兒觀察與素材權利人工檢查。E 的 WebKit 成功**不能取代 R**；UI screenshot 不能取代 U 的規則／儲存正確性。正式驗收與必要邊界仍以 Spec 為權威。

| 風險／驗收情境 | 最早驗證任務 | 最終／回歸證據 | Spec IDs |
|---|---|---|---|
| 9 種猜拳配對、三勝三平與雙方視角；更換文案／圖片不改結果 | M0-02 (U) | M2-04 (U/H)、M3-08 (E/R) | AC-03.1～03.4、NFR-AC-08.x |
| 教學 1／2 次錯答不揭曉、第 3 次錯答揭曉後強制完整示範、無第四次作答；第 2／3 次答對仍可學習 | M0-05 (U/D) | M2-01 (U/D/E)、M3-08 (R) | AC-07.1～07.3、NFR-AC-04.2 |
| 首次無提示答對、同題至多一次、每規則 0～3、3/3/3 後混合；提示／示範／戰鬥／重播不加計 | M0-04／05 (U) | M2-02 (U/E)、M3-03 (D/E) | AC-07.4、AC-11.1～11.3、NFR-AC-04.3 |
| 電腦亂數獨立於玩家選擇、等機率三選一、揭曉前無車種／手勢線索 | M1-03 (U/D) | M2-07 (E)、M3-08 (R) | AC-08.1～08.4 |
| 雙人 P1 已選手勢在交接、返回／取消／重載與 ARIA 中不洩漏，P2 確認後才共同倒數 | M0-06 (D/E) | M2-03 (D/E)、M3-08 (R) | AC-09.1～09.4 |
| 單回合唯一結果、連點、失效 callback、重新開始、音訊拒播／動畫失敗時安全降級 | M0-03／06 (U/D) | M2-06 (U/E)、M3-08 (R) | AC-02.3～02.4、AC-06.x、NFR-AC-04.x |
| 三勝一平、雙站位、輸家修復／友善結尾、因果文字／靜態圖保持可理解 | M1-06／07 (D/H) | M2-04／05 (E/H)、M3-08 (R/H) | AC-03.x、AC-04.x、NFR-AC-06.1～06.2 |
| 所有畫面雙語；雙語音先中後英／兩種單語、靜音／重聽與孩子勝利的完整合法掌聲 | M3-01 (D) | M3-02 (U/D/R/H)、M3-08 (R) | AC-05.x、AC-10.x、NFR-AC-04.1 |
| 版本化本機保存、reload、儲存失敗、未知較新 schema、確認重設、非重設操作不倒退 | M0-04 (U) | M3-04 (U/E/R)、M3-08 (R) | AC-11.3～11.4、NFR-AC-07.x、05.3 |
| Safari 安全區／觸控、Android／desktop、HTTPS、無敏感權限與外部追蹤 | M1-08 (R) | M3-05／07／08 (R/H) | AC-12.x、NFR-AC-01.x、02.x、05.x |
| M1 效能量測 → 有證據的門檻決策 → 正式複測（不可預先虛構數字） | M1-08 (R) | M3-07／08 (R/H) | NFR-AC-03.1～03.3 |
| 如選擇交付 P1：減少動態、跳過／重播保留因果內容且不重複計數 | M3-06 (U/D/E) | M3-08 (R)；Defer 時標未交付 | AC-13.x、NFR-AC-06.3 |

### 6.1 重要負向測試的最低覆蓋

- **Learn**：每種指定對手手勢下的正確答案；先錯再對、三錯、主動示範、第三錯強制示範的動畫失敗、強制示範尚未完成時不能完成題目；同一題多次點卡／確認及多次媒體完成通知。
- **Mastery**：單組達 3 但其他未達、非連續合格、新題與同題的區別、3/3/3 前後出題、重新開啟、儲存失敗與第三次解鎖的原子一致性；比賽／輸掉／語音切換不動進度。
- **保密**：揭曉前中性輪廓，交接時 DOM／ARIA／focus／可見控制與正常返回／重載均不揭露上一位玩家；不以「在 CSS 隱藏但仍留在可辨識標籤」當作完成。
- **媒體**：不依賴真實音檔播完或 WAAPI 計時來測規則；以假事件及 fake timer 驗證取消、拒絕、超時、遲到 callback；畫面故障仍呈現必要雙語因果文字。
- **素材／隱私**：圖像與音效要有原創／合法使用依據，Network/Permission 測試無未核准追蹤或權限；正式內容不得夾帶 placeholder 授權風險。

## 7. 需求與任務雙向追蹤索引

本表是**工作分配索引**，不是另一套 FR／AC 定義；規格內容只在 [Spec §2](../spec.md)、[§9.4](../spec.md)、[§10](../spec.md) 維護。每個任務的「追蹤」欄位記最相關的 AC；一次變更可能涉及多條 NFR，實作／Review 應補記受影響 ID。

| Spec FR / Story | 核心交付任務 | 最終驗證位置 |
|---|---|---|
| FR-01 / US-01 | M0-02、M1-02、M1-04、M3-03 | M3-05／08 |
| FR-02 / US-03、US-08 | M0-02、M1-03、M2-04 | M2-07、M3-08 |
| FR-03 / US-07 | M0-05、M2-01、M2-02 | M2-07、M3-08 |
| FR-04 / US-08 | M1-03 | M2-07、M3-08 |
| FR-05 / US-09 | M0-06、M2-03 | M2-07、M3-08 |
| FR-06 / US-02 | M1-05、M2-06 | M1-08、M3-08 |
| FR-07 / US-03 | M1-06、M2-04 | M2-07、M3-08 |
| FR-08 / US-04、US-05 | M1-07、M2-05、M3-02 | M3-08 |
| FR-09 / US-10 | M3-01、M3-02、M3-04 | M3-08 |
| FR-10 / US-06 | M0-03、M1-07、M2-06 | M2-07、M3-08 |
| FR-11 / US-11 | M0-04、M2-02、M3-03、M3-04 | M3-08 |
| FR-12 / US-12 | M1-01／02、M1-08、M3-05／07 | M3-08 |
| FR-13 / US-13（**P1**） | M3-06：Go / Defer | Go 時 M3-08；Defer 時記 excluded |

**品質需求索引**：NFR-01→M3-07／08；NFR-02→M1-02／08、M3-05；NFR-03→M1-08、M3-07；NFR-04→M0-03／06、M2-06、M3-02；NFR-05→M3-04／07；NFR-06 P0→M3-01／05，P1→M3-06；NFR-07→M0-04、M3-04；NFR-08→M0-02／07、M2-07。逐條 NFR-AC 結果由 M3-08 對照 Spec §9.4 記錄。

## 8. 驗證證據、任務回報與風險處理

### 8.1 每項任務的建議交付紀錄

在該任務的 PR／commit 說明或一份小型 evidence note 記錄，**不要為每一個微小操作強制建立新文件**：

| 欄位 | 必填內容 |
|---|---|
| Task / status | 例如 `M0-02 — Done`；實際完成日與 commit／PR |
| Requirements | 涉及 `FR / US / AC / NFR / NFR-AC` 識別碼，或清楚標示純工程任務 |
| Change / decision | 做了什麼；必要的設計取捨與相容性影響 |
| Tests | 實際執行命令、結果、測試數與失敗；必要時裝置／瀏覽器／版本 |
| Evidence | 測試紀錄、截圖／操作錄影、真機或試玩觀察、法律授權／效能基準的位置 |
| Open / Blocked | 未通過、未執行、環境限制、風險及下一項可行行動 |

- **Gate 管理**：M0／M1／M2／M3 的狀態由各自 Exit 證據決定；不得因某個子任務完工就自動宣告整個里程碑通過。M1 真機驗證、M3 孩子／家長試玩或法律權利無法立即取得時，如實留 `Blocked` 並說明影響。
- **測試與 Review**：先檢查 Spec 所要求的正確性／安全／相容性，再考量 SOLID、DRY 等工程原則是否確實降低成本；新增或修復功能同步補有價值的測試。對既有測試的修改需證據，不能為了通過而削弱有效驗收。
- **回歸責任**：跨相位修改 Controller、Mastery、Storage、Media 時，至少回跑其受影響的 U／D／E 測試；改動素材或 Copy 後仍須回跑九種規則、雙語與保密／降級測試。未執行的項目標示原因。
- **發布準備**：M3-09 才更新 README 的實際完成狀態及對外部署說明；目前 README「Documentation ready for prototype」維持真實，不預先改成 Released。

### 8.2 已識別的開放工程決策（不需要先阻塞 M0）

| 事項 | 最晚決定／證據來源 | 未決時處理 |
|---|---|---|
| Vanilla vs React（TD-02／04／07） | **M0-GATE**；兩條最小 Spike 與受控測試 | **阻塞 M1**，繼續最小證據收集 |
| 首次正式 SVG 分鏡在 Safari 的成本／效能 | M1-08 量測與試玩 | 保持 SVG baseline；如有不可接受證據依 TD §2.2 小範圍比較，不先引入引擎 |
| 初版三台額外收藏車的名稱／素材 | M3-03；原創／合法圖像 | Domain 用固定 ID；正式素材與名字不阻塞 M0 |
| 中文／英文錄音、愛的鼓勵掌聲來源／權利 | M3-02／07；授權或自製紀錄 | 原型用安全 placeholder；**阻塞正式 Release**，不使用未授權錄音 |
| Static HTTPS hosting 商與部署網址 | M3-07；可直接開啟與 network 稽核 | M0～M2 使用本機開發環境，不假定已上線 |
| NFR-03 可重現的效能門檻 | M1-08 實測 → M3-07 決策／複測 | 未定標時不能標 Release performance passed |
| FR-13 P1 Go / Defer | M3-06；產品價值、試玩與成本 | Defer 明列不交付；**不**把 P1 變成 P0 blocker |

## 9. 下一個可直接執行的工作

**Next：`M1-03 — 公平 Computer 單回合接線`。** M1-02 的實作與自動化 viewport 驗證已完成；M1-08／M3-05 仍須補 iPhone／iPad Safari 真機操作證據。M0-01～M0-07 已完成，M0-GATE 已通過，M0-08 不需要。M0-06 延用既有 reducer／controller 的回合／相位 token 與取消語義，未另造規則或持久化秘密選拳。

**目前交付邊界**：M0 Learn／Together 是技術原型，M0-GATE 通過只決定工程選型並允許開始 M1；**正式 Learn／Together UI／美術／音訊、實機或幼兒試玩證據、部署與發布仍未完成**。後續執行時逐項更新任務狀態與真實證據，不要先勾選未驗證的完成條件。
