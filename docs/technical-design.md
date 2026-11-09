# Technical Design — 工地猜拳大賽（Construction Site RPS Adventure）

> 文件版本：**TD v0.10**（Vanilla-first 暫定選型；M0 Technical Spike 後決策）
> 更新日期：2026-11-06
> 狀態：**Provisional Vanilla TypeScript + Vite; M0 decision gate pending; prototype not started**
> 產品版本：MVP v1.0 — Browser-First / Touch-First
> 產品依據：[PRD](../PRD.md)（Why / What、範圍及優先級）
> 跨階段約束：[Constitution](../constitution.md)（Principles / Constraints）
> 行為及驗收依據：[Spec](../spec.md)（Exact Behavior / Acceptance；FR / US / AC / NFR SSOT）
> 後續執行拆解：[Implementation Plan](implementation-plan.md)
> 核心問題：**How should the solution be engineered?**（Architecture / Engineering Decisions）
> 核心職責：**選擇並論證適合現有需求的技術、架構、模組邊界、資料與媒體方案，記錄取捨、風險與驗證方式；不新增產品承諾，不取代實作計畫。**

**閱讀與決策規則**：本文的「選定」表示可作為 MVP 開發的**工程預設選擇**；TD-02／04／07 目前是暫定選擇，須通過 M0 Gate 才可正式確認，不表示已通過原型、Safari 真機或幼兒試玩。純技術選擇在不改變 Spec 行為／PRD 範圍且符合 Constitution 時可依證據調整；若提案會改變可觀察的遊戲行為或優先級，須先依 [AGENTS.md](../AGENTS.md) 的變更控制流程處理。本文中的 TypeScript 範例是設計草案，不是要求逐字實作的 API 契約。

## 1. 設計目標、範圍與取捨準則

### 1.1 MVP 的工程問題

- 以 HTTPS 網址直接開啟，優先支援 iPhone／iPad Safari 觸控，兼容 Android／桌面現代瀏覽器（FR-12、NFR-01／02）。
- 一套可靠的猜拳規則服務 Learn、Computer、Together；動畫與角色**只能說明結果，不得決定結果**（FR-02、FR-07、NFR-08）。
- UI、教學嘗試／收藏進度、雙人保密交接、雙語語音和媒體失敗降級彼此不干擾（FR-03～11、NFR-04／07）。
- 原創工地繪本風的三位角色與單一場景，視覺表現需在真實 Safari 裝置驗證，而非預設需要遊戲引擎。
- 無後端、登入、攝影機、麥克風、定位、雲端同步、第三方追蹤或廣告；PWA／原生 App 及 PRD §5.3 IDEA-01～07 均**非 MVP 交付**。

### 1.2 技術選擇的評估順序

1. **需求正確、幼兒易理解與情緒安全**，高於特效、框架流行度或抽象化程度。
2. **實機可用**：Safari 觸控、音訊策略、版面、載入與動畫品質優先。
3. **可驗證與可維護**：Domain 可單測，回合、獎勵、輸入保密有明確狀態，錯誤可降級。
4. **最少必要複雜度**：不為猜測的未來功能建造通用框架。
5. **決策可逆**：替換動畫呈現或部署商時，不應重寫猜拳規則、教學計數或已核准的內容語義。

## 2. 技術探索、方案比較與選型決策

### 2.1 前端架構：Vanilla TypeScript + Vite（暫定）

| 候選 | 優勢／合適場景 | 對本 MVP 的代價或限制 | 結論 |
|---|---|---|---|
| **React + TypeScript + Vite** | 宣告式 UI、元件生命週期與複雜畫面共享狀態較容易管理 | 增加 Framework Runtime；動畫、音效需管理 refs／effects 與 cleanup | **備選；若 M0 顯示 Vanilla UI 維護成本過高再評估** |
| Svelte + TypeScript + Vite | 輕量、直接的互動與動畫開發，適合小型 SPA | 換框架不會消除教學規則、媒體控制與驗證的核心複雜度 | 可行備選，現階段無足夠收益支持替換 |
| **Vanilla TypeScript + Vite** | 依賴少、直接控制 DOM / SVG / WAAPI、純邏輯可測試 | 需自行管理 DOM 更新、事件清理；若開始重造 UI 框架則應重新評估 | **暫定首選；M0 後確認** |
| Next.js／其他偏全端框架 | 適合多路由、SSR、內容服務或服務端需求 | MVP 無 SSR、API、登入或 SEO 驅動的多頁內容 | **不引入**；不是因框架本身不可用 |

**暫定選型理由**：這是一款畫面有限、以狀態機與 SVG 動畫為核心的教學 SPA；Vanilla TypeScript 搭配 Vite 可降低起步依賴並直接操作 DOM／WAAPI。兩個代表性流程須先在 M0 Technical Spike 中驗證：若 UI 狀態同步、事件生命週期或重複渲染開始需要自製框架，才試作小型 React 對照原型。不以框架偏好代替證據，正式選型由 M0 Architecture Decision Gate 記錄（§12）。

### 2.2 2D 呈現技術：從 SVG + CSS / WAAPI 開始

| 候選 | 適合解決的問題 | 本案判斷 |
|---|---|---|
| **分層 SVG + CSS 動畫 + Web Animations API（WAAPI）** | 少量可辨識角色、表情／部件變化、固定分鏡、觸控與 DOM 文字疊加 | **選定基線**：可漸進製作、易保留可讀文字與靜態降級 |
| Phaser（Canvas／WebGL Game Framework） | 複雜遊戲場景、精靈、攝影機、物理與大量物件 | 若原型證明 DOM/SVG 無法達標才重新評估；不要先引入第二套場景狀態 |
| PixiJS／Canvas／WebGL | 高密度 2D 繪製、特效或 GPU 批次渲染 | 單一工地＋三位主角目前沒有足夠需求；會增加文字、互動與降級的整合負擔 |
| 大型影片／逐格素材 | 非即時、固定高美術品質動畫 | 載入、適配及無障礙／因果重播的成本較高；不作為整體遊戲主流程 |

**重新評估的條件**：第一個完整規則動畫在目標 iPhone／iPad Safari 上實測，若 SVG 層數、動畫同步、效能或素材製作成本有**具體不可接受的證據**，再試做受控 Phaser／Canvas 對照原型。比較實機流暢度、載入體積、音畫同步、易維護性、文字可及性與失敗降級；在此之前不要「為將來可能更炫」而引入引擎。

### 2.3 工程決策紀錄（Architecture Decision Register）

| ID | 決策（MVP） | 不採用／取捨 | 狀態 |
|---|---|---|---|
| TD-01 | **無後端、單一靜態 SPA、HTTPS 託管** | 不建 API、SSR、資料庫、登入或 PWA | Selected |
| TD-02 | **Vanilla TypeScript（strict）+ Vite** 為暫定首選；React 為備選 | M0 後依 UI 複雜度、測試與維護證據確認 | **Provisional — M0 Gate** |
| TD-03 | **SVG + CSS / WAAPI**，規則結果先決定、動畫僅呈現 | 暫不引入 Phaser、PixiJS 或通用動畫編輯器 | Selected; validate on device |
| TD-04 | **純函式 Domain + Framework-independent Reducer / Controller + Screen Renderer** | 不自行打造通用 UI 框架；保留可取消的媒體效果 | **Provisional — M0 Gate** |
| TD-05 | **key-based 中英文字 + 合法預錄短音檔** | 不以裝置 TTS 的聲線／離線可用性作正式內容保證 | Selected; audio assets pending |
| TD-06 | **單一版本化 JSON + localStorage**；寫入失敗退回記憶體 | 暫不引入 IndexedDB、雲端同步、備份服務 | Selected |
| TD-07 | **Vitest + DOM Testing Library + Playwright**；另做 Safari 實機驗收 | 不需 React 亦可測試 UI；WebKit 不等於實機 Safari | **Provisional — M0 Gate** |
| TD-08 | **npm lockfile + TypeScript typecheck + ESLint + production build** | 不提前引入 monorepo、複雜 CI 或強制 coverage 百分比 | Selected |
| TD-09 | **模組內 simple data maps** 管理三手勢、三角色、規則與素材 | 不做 CMS、plugin、通用場景／任務配置系統 | Selected |
| TD-10 | **單一路由的畫面狀態切換** | 不安裝 Router、重度 CSS 框架與遠端 UI 服務 | Selected |

以上是**工程選擇**而非新增 FR；FR-13 的減少動態、跳過／重播仍維持 P1，不能因技術上可預留 hook 就宣告已交付。

### 2.4 工具鏈與版本策略

- **TypeScript strict**：用型別聯集約束手勢、模式、事件與規則 ID；仍須在本機資料／外部資產邊界做 runtime validation。
- **Vite vanilla-ts 模板、npm**：單一 package、lockfile 固定相依版本，保留標準開發、測試、打包命令。
- **Node.js**：初始 scaffold 使用與當時 Vite／Vitest 相容的 Node LTS 並寫入 `engines`（可搭配 `.nvmrc`）。截至本文檢視的官方文件，Vitest 要求 Node ≥22.12，且 Vite 亦支援 Node 22.12+；開始實作時再確認並鎖定，**不在尚無 package.json 時虛構已安裝版本**。
- **品質基線**：`typecheck`、`lint`、`test`、`build` 可重複執行；E2E 與真機驗證分開記錄。開發中以問題驅動加入依賴，不為 CI／架構展示增加無用套件。
- **完整自動檢查**：本機與 CI 共用 `npm run check`（型別、lint、單元／DOM、production build、E2E）；`test:e2e` 自行先 build，避免驗證舊 bundle。ESLint 使用 TypeScript project service 執行 `no-floating-promises` 與 `no-misused-promises`，涵蓋來源、測試及 TypeScript 設定，保護非同步媒體與事件邊界。
- **持續整合**：以 [GitHub Actions CI](../.github/workflows/ci.yml) 在 PR、`main` push 或手動觸發時，使用 Ubuntu 24.04、`.nvmrc` 的 Node 及 `packageManager` 的 npm 執行乾淨安裝、四項品質指令與 Chromium／WebKit E2E。單一 job、唯讀 repository 權限、取消同分支過期執行，瀏覽器失敗報告／trace 保存 7 天；不部署、不設定 coverage 百分比。CI 成功不能取代 Safari 真機或親子驗收。

## 3. 部署拓樸、信任邊界與執行環境

~~~text
Browser (iPad / iPhone Safari first; Android / desktop)
    |
    | HTTPS: HTML, hashed JS/CSS, SVG/images, owned audio files
    v
Static hosting / CDN (provider undecided)
    |
    +-- Client-only Vanilla TypeScript SPA
          |
          +-- Presentation (touch UI + bilingual text)
          +-- Application controller (Learn / Computer / Together)
          +-- Pure Domain (RPS + mastery decisions)
          +-- Media effects (animation + audio)
          +-- Local ProgressStore (same-origin localStorage)
~~~

- **執行時無產品 API 呼叫**：預設不需伺服器 Session、帳號、Analytics SDK、外部字型／CDN 即時請求或兒童行為追蹤。程式與媒體資產盡量由同一受控 HTTPS origin 供應；部署商選擇屬實作計畫與部署階段的決定。
- **同源儲存邊界**：學習進度只存在該 origin 的瀏覽器本機；改域名、清除網站資料、換瀏覽器或裝置不保證保留（Spec §7.2）。
- **不依賴 Service Worker**：正常線上載入即可；離線與安裝提示不是 MVP。部署時確認靜態資產路徑及快取版本一致，避免舊 HTML 引用已刪除的資產。
- **安全邊界**：不接觸攝影機、麥克風、定位 API。不要把孩子資料或遊戲狀態送進 third-party error tracker；如需測試紀錄，只使用人工／本地非個資資料，符合 NFR-05。

## 4. 程式模組、依賴方向與目錄草案

### 4.1 模組責任表

| 模組 | 主要責任 | 不應負責 |
|---|---|---|
| **Domain / RpsRules** | 三手勢、9 種配對、勝負／平手、正確示範手勢 | UI Framework、DOM、車輛圖像、動畫、儲存、音效 |
| **Domain / Mastery** | 首次無提示合格判定、三規則 0～3 計數、一次性解鎖推導 | 以觀看動畫／普通勝場推進學習 |
| **Application / RoundController** | 模式與狀態、確認／交接／揭曉的合法事件、重玩與過期事件隔離 | 直接畫 SVG、改寫猜拳規則、直接操作 DOM |
| **Presentation / UI** | 手勢卡片、模式畫面、家長設定、雙語文字與可及性 | 重新實作判定、手寫非同步競賽邏輯 |
| **Media / AnimationPlayer** | 已確定結果的分鏡播放、取消／降級／（P1）跳過重播 | 決定勝負或計數 |
| **Media / AudioPlayer** | 語音語言選擇、播放隊列、靜音、重聽、播放失敗恢復 | 決定答案、阻塞核心回合 |
| **Content** | 固定角色、規則句、提示、原創圖片與音訊 key 對照 | 用素材或車速參數修改勝負 |
| **Infrastructure / ProgressStore** | 本機資料讀取、格式驗證、單次寫入、版本／錯誤回復 | 根據動畫回呼自行發獎 |

**依賴規則**：Domain **不匯入** UI／Browser／Content／Infrastructure。Application 使用 Domain 與少量明確的內容定義，並透過邊界調用 Media／ProgressStore；UI 將使用者意圖派送給 Controller，依狀態顯示畫面。副作用放在 effect／adapter 邊界，**不得放進 reducer 或畫面渲染函式**。先保持普通模組與函式；不要為每個檔案建立介面、DI container 或 Plugin。

### 4.2 建議目錄（實作時可按證據微調）

~~~text
src/
  app/                 # App entry, dispatch and state/effect wiring
  domain/              # rps rules, mastery calculations, types
  game/                # round reducer/controller and mode flows
  ui/                  # screen renderers, gesture cards and controls
  # screen renderers cover home, learn, arena, result, garage, settings
  content/             # typed bilingual copy + gesture/vehicle/asset keys
  media/               # animations, speech/audio queue
  storage/             # schema, validation and localStorage adapter
  styles/              # responsive layout and motion rules
  test/                # shared test fixtures (only if needed)
public/
  assets/              # original or appropriately licensed illustrations/audio
tests/
  e2e/                 # Playwright flows
~~~

這是**導航草案，不是要求先建立空資料夾**。可先在單一檔案實作小範圍功能，當複雜度實際增加再依責任拆分；命名以實際程式清楚為準。

## 5. 領域模型與確定性規則

### 5.1 最小型別與純函式

~~~ts
type Gesture = "rock" | "scissors" | "paper";
type Mode = "learn" | "computer" | "together";
type Outcome = "win" | "lose" | "tie"; // 以 Player 1／孩子為基準
type RuleId =
  | "rock-beats-scissors"
  | "scissors-beats-paper"
  | "paper-beats-rock"
  | "tie";
type MasteryRuleId = Exclude<RuleId, "tie">;
type MasteryCounts = Record<MasteryRuleId, number>; // runtime validate: 0..3

type RoundResult = {
  player1Gesture: Gesture;
  player2Gesture: Gesture;
  outcome: Outcome;
  ruleId: RuleId;
};

// Conceptual function contracts:
declare function evaluateRound(p1: Gesture, p2: Gesture): RoundResult;
declare function winningGestureAgainst(opponent: Gesture): Gesture;
~~~

- **規則的唯一計算點**：`evaluateRound` 僅使用兩個 Gesture。9 個配對須一致；`ruleId` 依**獲勝手勢關係**而非畫面左右決定；平手只使用 `tie`。
- **固定手勢角色**：rock → Captain Dozer；scissors → Snip-Snip；paper → Cover Crane。角色／收藏與勝負引擎分離；純收藏車不能參賽。視覺及名稱的規範以 Spec §1 為準。
- **公平電腦出拳**：使用對玩家手勢獨立的三選一亂數，等機率映射三種 Gesture。以注入可控制的亂數函式測試，不根據玩家選擇、連勝或進度修改機率；不需密碼學安全亂數。
- **教學出題**：先由指定的對手 Gesture 透過 `winningGestureAgainst` 求正確選擇。三組各未達 3 次前按 Spec §3.1 的固定輪替題序；全部達 3 後才混合。題目指向三條勝負關係而非平手。
- **獎勵推導**：固定的 MasteryRuleId → collectible ID 一對一對照；每條規則最多累積 3 次合格首答。解鎖 ID 不重新用於另一台車（FR-11）。具體收藏角色素材需在製作時定案，勿讓未定的名稱阻礙 Domain。

### 5.2 教學題的交易邊界

**M0-05 實作取證**：現有 `round-controller.ts` 保持唯一 RoundState，新增嘗試次數及正確／主動／強制示範來源。首次合格確認在 listener／media 之前同步提交 `progress-store.ts`；錯答會清除暫選，連點確認不消耗下一次機會。`learn-domain.ts` 提供固定題序、完整 3/3/3 混合門檻及簡化雙語因果內容；正常重載重置題序，不保存未完成題。`learn-ui.ts` 以一個 delegated click listener 與狀態 renderer 呈現原型；選卡重新渲染保留焦點，沒有額外雙向狀態／listener 同步。原型預設使用完整靜態圖文示範，以「示範看完了」確認展示完成；正式動畫／語音仍留後續任務。此取證尚不足以通過 M0 架構 Gate。

同一題由一個新的「教學回合」識別；只有**第一次有效「確認答案」事件**且答案正確、此前未提供額外答案提示／揭曉，才可通過 Mastery 合格判定。僅點選卡片不是提交。

- 第一次／第二次確認錯誤後，維持當題可重試狀態，發出不直接洩漏答案的提示；第三次仍錯即關閉提交入口，改用正確手勢走**系統強制示範**。
- 第二／第三次才答對、家長主動示範、第三次錯答後強制示範都可以完成教學，但**沒有合格進度事件**。教學錯答也不是一般對戰的 `lose`。
- 合格事件在首次正確提交時同步更新**記憶體中的計數與解鎖推導**，立即嘗試保存一次；**不等動畫／語音完成才發獎**。動畫回放、取消、重新渲染、舊 callback 不得重新進入此提交邏輯。
- 每題合格事件至多一次，計數上限 3。持久化不可用時允許本次遊戲繼續顯示記憶體進度，但必須提示重開後可能消失（參 §9）。
- 達到 3/3/3 才切換混合題；不得把猜中電腦、普通勝場、遊玩總次數或重播轉換成學習成績。

上述是實作 [Spec §3.1、§7.1](../spec.md) 的技術責任分工；**驗收時以 Spec AC-07.x／AC-11.x 為唯一規則**。

## 6. 回合狀態機、事件與非同步安全

### 6.1 控制器選擇

暫採 **Vanilla TypeScript 的純 reducer／controller + 明確 Screen Renderer**；使用者事件經 dispatch 驅動合法轉移，控制器與渲染函式分離。單一目前有效的回合狀態包含 `roundId`、`mode`、`phase`、已確認的手勢、必要的教學嘗試資訊及已判定結果。畫面只按狀態渲染，副作用由受控的 effects 執行。

**建議的相位集合**（可依程式合理合併，不須一個相位對應一個 class）：

~~~text
home / mode-select
learn-prompt -> choosing -> (hint -> choosing) -> confirmed/demo-required
computer: choosing -> opponent-locked
together: choosing-p1 -> handoff -> choosing-p2 -> both-locked
                    \          |           /
                     countdown -> approach -> reveal/rule-effect
                       -> feedback/recovery -> complete
complete -> fresh round of same mode / home
~~~

| 模式／轉移 | 控制器應保持的性質 | 相關 Spec |
|---|---|---|
| Learn：先出題再選拳 | 對手手勢公開；只在確認時判斷；前兩次答錯繼續嘗試 | §3.1、AC-07.x |
| Learn：第三次錯答 | 無第四次提交；自動進正確因果示範，**完整圖文／簡化示範完成後**才可到完成畫面 | §3.1、§4、NFR-AC-04.2 |
| Learn：主動示範／提示後答對 | 以正確示範進入共用結果路徑，但不發 Mastery 合格事件 | AC-07.2～07.4 |
| Computer：對手抽拳 | 保密直到中央揭曉；亂數與玩家選擇獨立 | AC-08.x、§4 |
| Together：P1 → P2 | P1 確認後交接畫面完全無可辨識選擇；P2 確認後才倒數 | AC-09.x |
| 共用結果路徑 | 所有模式用同一 RPS 判定及因果說明；不因動畫失敗改結果 | FR-02／07、NFR-04 |
| Complete／Replay／Home | 每局僅結算一次；重開新 `roundId` 並清空該局暫存 | AC-06.x、NFR-AC-04.3 |

### 6.2 事件、效果與 idempotency

- **事件邊界**：`SELECT_GESTURE` 只更換未確認選項；`CONFIRM_SELECTION` 才固定手勢；`SHOW_DEMONSTRATION` 是獨立路徑；`PHASE_FINISHED`／`MEDIA_FAILED` 不作猜拳或 Mastery 判定。非法相位事件直接忽略，不因連點執行第二次提交。
- **身份隔離**：每次新局產生單調遞增的 `roundId`／generation token。Animation／Audio／timer 完成通知必須攜帶原局 token；token 不符或相位已前進則忽略。`complete` 事件不可使同局再結算。
- **可取消的副作用**：事件訂閱、計時器、動畫、音訊都由 Controller 的 effect／adapter 邊界管理；離開畫面或重玩時明確移除 listener、取消 timer／animation／audio。Renderer 只更新必要 DOM，避免整頁重建破壞進行中的動畫。若 M0 出現大量雙向 DOM 同步、listener 遺漏或自行實作 reactive binding 的需要，記錄為重新評估 React 的客觀證據。
- **播放不等於結果**：對戰結果只計算並鎖定一次，媒體後續狀態為 `playing`／`completed`／`cancelled`／`failed`。動畫結束只決定「何時顯示下一個已確定的畫面」，不決定勝負。
- **避免永久等待**：動畫播放 promise 被取消／拒絕或資產不可用時，立即切到可理解的靜態結果／必要教學示範；對未回報完成的動畫設有限制的 watchdog fallback。**音訊完播不得是必要的通關依賴**。
- **跳過／重播（FR-13，P1）**：如實作，視為對當前已確定結果的純媒體操作；不重新提交選拳、重抽電腦手勢、增加進度或發獎。第三次錯答後即使跳過動態，也不能跳過正確手勢、關係及因果說明的必要內容。
- **重新載入／關頁**：不保存未完成回合及兩人的秘密選擇；重新開啟從安全的非交接畫面開始。正常頁面瀏覽器返回／取消交接時，清除該回合，不回顯 P1 已選拳。

### 6.3 同螢幕保密呈現

因三位工程車與手勢一對一，**揭曉前顯示可辨識的車款即等同洩漏答案**。

- Computer：對手在中央 reveal 前只顯示與實際出拳無關的中性輪廓、煙幕或遮蔽物；不能依內部 Gesture 改變外形或標籤。
- Together：P1 確認後，不應繼續在 DOM、`aria-label`、可聚焦元素或可操作的歷史畫面留下 P1 選項；交接階段應渲染與已選 Gesture 無關的畫面。雙方在中央 reveal 前都使用無法辨認車款的中性外觀。
- Learn：對手是題幹的一部分，原本就應公開手勢；不套用對戰保密邏輯。
- 這是**同一裝置的正常 UI 保密**，不是防止家長使用開發者工具的加密／對抗性安全機制；不引入後端或複雜密碼學。

## 7. 插畫、動畫分鏡與靜態降級

### 7.1 素材與渲染策略

- 一個工地場景、三位固定可出拳主角、三條勝負因果＋平手的視覺腳本；額外三台車只供收藏（Spec §1、§5、§7）。以可辨認的**原創分層 SVG**（車身、表情、動作部件）和少量簡單背景為起點。
- 使用 CSS `transform`／`opacity` 處理入場與表情，需時間序列的部件動作可用 WAAPI；DOM 保留真正的雙語文字和大手勢符號。角色圖片不是全畫面文字的唯一載體。
- 動畫接收 immutable 的 `RoundResult` + 參賽位置／呈現模式，按 `ruleId` 選 storyboard。`rock-beats-scissors`、`scissors-beats-paper`、`paper-beats-rock`、`tie` 的因果內容以 Spec §5 為準。
- 左右互換是**鏡頭／站位**變化，不應鏡像所有文案、emoji 或把剪切／蓋布的因果方向弄錯。優先測試三組勝負的兩個站位與三種平手。
- 只預載當前場景必要的小型媒體；避免把高解析影片、過大字型、非首屏收藏素材當成啟動必需品。是否需延遲載入按真機 Network／Performance 量測決定。

### 7.2 時序與容錯

~~~text
countdown -> approach (隱藏未揭曉的對手)
          -> reveal (已預先計算的結果正式揭曉)
          -> causal-rule (大手勢 + 中英文規則 + 因果動作)
          -> feedback + loser recovery / tie celebration
          -> complete
~~~

- 主要動畫階段的控制權在 RoundController；AnimationPlayer 只回報已完成、被取消或失敗。失敗時仍渲染**正確兩手勢 + 兩語文字 + 可理解的靜態因果圖**；若為 Learn 第三次錯答後的強制示範，完整示範內容必須實際呈現後才能完成，不能僅把狀態標成完成。
- 音訊播放結果不應造成動畫流程卡住；重複 callback 不可觸發再次勝負判定。角色修復結尾要能在縮減動態與降級模式下清楚呈現。
- 可以參考系統 `prefers-reduced-motion` 來弱化非必要位移，保留因果學習資訊；**FR-13 的家長控制、跳過／重播仍為 P1**，是否交付由實作計畫與 Spec 優先級決定。
- 在第一個 Vertical Slice 上檢查 SVG 動畫是否出現 Safari 裁切、意外縮放、文字覆蓋、長時間停頓或音畫不同步；若失敗，按 §2.2 的再選型條件評估。

## 8. 雙語內容與音訊播放方案

### 8.1 文字與素材

- 使用型別化或可驗證的 **content key → { zh-TW, en }** 資料（如 `gesture.paper`、`rule.paper-beats-rock`、`hint.try-again`）；UI 的**每個文字位置**顯示中英並列，而不是依語音模式切換文字（Spec §6.2）。
- 「✋ 布 / Paper」永遠是同一手勢；提示與規則文案使用固定 key，避免散落的字串／語法拼接產生相互矛盾句子。
- 媒體 manifest 以可管理的 ID 指向原創或有適當使用權的 SVG、音檔；缺少語音或圖像時，文字／靜態圖必須仍可辨識。沒有提供合法素材前，placeholder **不可冒充正式授權素材**。

### 8.2 語音、音效與 Safari 互動

- 選定方案：**預先錄製／有權使用的短句音訊，透過 HTMLAudioElement + 可取消的單一播放排程器**。雙語模式先播放中文句，再英文句；中文／英文單語只播對應語音。倒數、提示與重聽同樣遵守語音三選一（FR-09）。
- Browser TTS（`speechSynthesis`）可作為原型暫用的替代來源，但**不當成正式交付的音質、口音、語言包可用性保證**；正式音訊須在目標 Safari 實測。選擇通用且實機確認可播放的音檔格式與編碼。
- 初次音訊「解鎖」安排在孩子／家長明確按下開始等觸控事件中嘗試；`play()` 拒絕、音訊不能載入或裝置靜音都進入**無聲但可玩**路徑，不能讓開始／結果卡住。Safari 的可播放條件與各裝置行為需真機驗證（§12）。
- 使用一個可取消的播放 queue，為語音／重要回饋／短音效安排優先次序，避免互相蓋過。模式切換、離開、重玩、重聽都取消舊 queue；重聽只重播內容，不重送遊戲事件。
- 孩子在 Computer 或 Together 作為 P1 獲勝時播放**完整臺灣版愛的鼓勵節奏**的合法錄製／自製掌聲；其他回合完成與學會規則用短正向音效；P2（家長）勝利不能觸發孩子專屬掌聲。輸家、平手的鼓勵與修復依 Spec §6.1 呈現，不因無聲而省略。
- 聲音設定與語音模式保存至本機；聲音與視覺的**正確結果／教學文字由同一已判定資料來源**產生，不讓音檔名稱或完成時點改寫狀態。

## 9. 本機資料格式、更新時點與降級策略

### 9.1 選擇 localStorage 的理由

MVP 需要保存的只是三個 0～3 計數、三個解鎖 ID 與少量偏好。`localStorage` 可以在同一個 origin 內簡單持久保存，不需要 IndexedDB 的交易／schema 管理成本，也不需伺服器。此方案是對 **Spec §7.2、NFR-07** 的實作選型，不增加跨瀏覽器、跨裝置或私密瀏覽保證。

使用**單一版本化 JSON 紀錄**，例如一個 `construction-rps:progress:v1` key，避免把進度與解鎖分別寫入不同 key 而只更新其中一半：

~~~ts
type SpeechLanguageMode = "bilingual" | "zh" | "en";

type ProgressV1 = {
  schemaVersion: 1;
  masteryCountsByRuleId: {
    "rock-beats-scissors": number;
    "scissors-beats-paper": number;
    "paper-beats-rock": number;
  };
  unlockedCollectibleIds: string[];
  speechLanguageMode: SpeechLanguageMode;
  audio: {
    speechEnabled: boolean;
    effectsEnabled: boolean;
    volume: number; // runtime validated range
  };
  // reducedMotion only if FR-13 / US-13 (P1) is delivered
};
~~~

不保存姓名、照片、裝置識別碼、歷史選拳、孩子答錯明細、完成回合流水帳或攝影機資料。**未完成回合完全屬於記憶體狀態**，關閉頁面或重新載入即重開安全的初始畫面。

### 9.2 單次保存與一致性

1. 頁面啟動時 `try/catch` 取得 localStorage，解析並**驗證實際輸入**：schemaVersion、已知 keys、合法字串枚舉、每個計數 0～3、已知收藏 ID、偏好範圍。TypeScript 型別不能替代載入 JSON 的檢查。
2. 初始化三組計數及三個固定解鎖映射；在同一資料物件內更新計數與 `unlockedCollectibleIds`，經單次 `setItem` 寫入。解鎖條件依 MasteryCounts 推導，不讓 UI 直接操作解鎖陣列。
3. **提交時間點**是 Learn 的首次合格確認，不是動畫完成、完成畫面、重聽或重播。相同回合的重複按鍵／媒體事件不重新更新計數。若從 2→3，當次提交一併保存新解鎖 ID。
4. 讀取資料出現可安全修復的不一致時，以已知固定對照與非倒退原則做明確正規化；若資料無法可信解析，採安全預設並提示儲存狀態，而不是盲目「視為解鎖」。未知更高 schemaVersion **不得被舊程式自動覆寫**；先在記憶體內遊玩並通知家長，待正式版本遷移方案再處理。
5. 無痕模式、私隱限制、QuotaExceededError、SecurityError 或磁碟問題時，繼續用記憶體資料維持本次遊戲；在家長可看到的位置顯示「進度可能不會保留」的中英訊息，不宣稱已持久化。
6. 重設由家長於設定畫面**二次確認**後才清除進度與收藏；重設同時使舊回合 token 失效，避免遲到的 callback 重新寫回獎勵。不能因切換語音、重玩或輸掉比賽而重設。

**已知限制**：localStorage 同源但不是跨分頁交易資料庫。MVP 不承諾多個分頁同時獨立玩而毫無衝突；若試玩顯示真有並行使用需求，再決定簡單互斥／衝突檢測策略，不提前導入同步架構。瀏覽器清除網站資料或私密瀏覽關閉後也可能遺失進度；這是交付說明的一部分。

## 10. 行動裝置、可及性與效能設計

### 10.1 觸控／排版

- 優先 **iPhone 直向、iPad 直向／橫向**，使用響應式 CSS（含 `viewport-fit`、safe-area inset、動態 viewport 考量），讓確認、重玩、返回與語音重播不被 Safari 工具列／瀏海／Home Indicator 遮住（AC-12.2、NFR-AC-02.2）。
- 三張手勢卡與關鍵操作以語義化的原生 `button` 為基礎，增加可點區域；以 Spec NFR-AC-02.1 的 **56×56 CSS px 建議值**為設計參照，但不取代真機誤觸檢查。
- 使用 Pointer／click 事件與明確的確認操作，不把 `touchstart` 與 `click` 同時當兩次提交；控制滾動、文字縮放與手勢區域的瀏覽器預設行為時，保留家長正常的裝置可用性。
- 圖像、文字與必要圖示都可辨識；關閉聲音時能理解結果，提示／錯誤不能只靠紅綠色表示。保留鍵盤焦點、正確的按鈕語意、圖片替代文字；避免讓隱藏選拳透過輔助標籤洩漏。
- 家長設定與重設入口避免幼兒誤觸；長句和設定文案可分組排版，但依 Spec 所有顯示文字仍須繁中／英文並列。

### 10.2 效能／失敗策略

- **先量測、後定門檻**：依 Spec NFR-AC-03.1～03.2，在第一個可玩 Vertical Slice 的目標 iPhone／iPad Safari 記錄首次可操作時間、選拳回應、動畫停頓／掉格及開始到結果的等待；不可把「預計 60 FPS」或某毫秒數自行寫成已批准驗收標準。
- 控制初始 JS、SVG、音訊等資產大小；優先顯示可操作 UI 並避免阻塞主執行緒的大量同步工作。只在實測需要時考慮進一步拆包或更換動畫技術。
- 使用 Playwright 近似覆蓋 WebKit／觸控流程，但**Playwright WebKit 不是 iPhone 上真正的 Safari**，特別是媒體格式、音訊政策、手勢與瀏覽器工具列問題必須實機驗證。
- 遇到資產載入失敗、音訊被拒、動畫取消、背景切換或反覆點擊時，不讓核心猜拳／學習因果說明陷入空白與無限等待。音訊失敗可無聲通過；動畫失敗則提供完整靜態／簡化結果（NFR-04）。

## 11. 驗證設計與交付證據

本章只定義**測試策略與技術風險驗證方式**；任務順序、依賴、排程及完成追蹤應放在 [Implementation Plan](implementation-plan.md)，本文不複製執行清單。

### 11.1 自動化測試分層

| 層級／工具 | 應測試的工程行為 | 主要追蹤 |
|---|---|---|
| **Vitest：Domain** | 3×3＝9 組、三種勝負及三組平手、左右視角、正確 winning gesture、合法 ID | FR-02、NFR-AC-08.x |
| **Vitest：Controller / Mastery** | 第 1／2 次錯答不揭曉答案，第 3 次錯答關閉提交並強制示範；只有首次無提示合格；各組 0→3、3/3/3 後混合、單次解鎖；重播／過期 token 不加計 | AC-07.x、AC-11.x、NFR-AC-04.3 |
| **Vitest：Storage** | 版本化 JSON 正常載入；錯誤資料、不可用 localStorage、寫入失敗、確認重設、未知 schema 不破壞進度 | NFR-AC-07.x |
| **DOM Testing Library** | 雙語同屏、按鈕確認而非點卡即提交、各模式正確的畫面切換、隱藏選拳不留可識別 DOM／ARIA、無聲／靜態降級 | AC-01.x、AC-09.x、AC-10.x |
| **Playwright（Chromium + WebKit）** | 選手勢→倒數→因果→結果→再玩、雙人交接、reload 後進度、音訊失敗／缺資產模擬、基本 mobile viewport | AC-06.x、AC-12.x、NFR-04 |
| **Typecheck / ESLint / build** | 型別、常見靜態錯誤、可重建 production bundle | NFR-08；工程品質 |

測試用可控制的亂數來源和假的動畫／語音完成事件，**不可用真實動畫播放時間來判斷規則正確性**。公平性需證明選拳邏輯不以玩家 Gesture 為輸入；統計抽樣可作補充，不以單次勝率替代決策正確性。更改既有有效測試前，按 AGENTS.md 確認原因，切勿為通過測試改弱驗收。

### 11.2 必須使用實機／人工觀察的驗證

- **Safari**：iPhone 直向、iPad 直／橫向的主要流程、觸控／安全區、語音首次啟動、三語音模式、音量／靜音、SVG 動畫和降級。記錄裝置型號、iOS／Safari 版本、結果與缺陷。
- **Android／桌面**：在選定現代瀏覽器至少完成核心對決與重玩（Spec NFR-AC-01.2）。
- **分鏡語義**：三條勝負兩側站位、三種平手、輸家修復，手勢與中英規則訊息不被動畫遮擋。
- **親子試玩**：孩子能否對照真正手勢理解規則，是否把速度誤認為勝負、是否願意在沒贏後繼續玩；這是產品觀察，不等同單元測試通過。
- **素材／隱私稽核**：確認圖像、語音、完整愛的鼓勵掌聲的使用權；檢查 Network 權限、第三方請求與設定重設的二次確認。

**驗收權威**：所有正式交付標準以 [Spec §2、§9.4、§10](../spec.md) 為準；這裡只記如何產生證據。**文件完成不等於程式完成**，未執行的測試／Safari 試玩／效能定標一律標記為待驗證。

## 12. 技術風險、決策重新開啟條件與參考資料

### 12.1 尚待原型驗證（不是未解產品 OQ）

| 項目 | 主要風險 | 驗證／重新選型條件 |
|---|---|---|
| **SVG/CSS/WAAPI** | Safari 分層、效能、動作控制或美術成本不符預期 | 完成一條完整因果動畫後實機觀測；有具體證據才與 Phaser／Canvas 做小範圍比較 |
| **音訊／合法素材** | Safari 首播被拒、中文／英文錄音品質或完整掌聲授權問題 | 使用者觸控啟動實測；正式素材有權利紀錄；失敗能無聲通關 |
| **localStorage** | 私密瀏覽、配額、資料損壞或多分頁衝突 | 對單一瀏覽器正常 reload 與失敗模式實測；進度不可保存時誠實通知 |
| **同螢幕雙人保密** | 換手時從車形、DOM 或返回操作洩漏先前手勢 | 真機輪流選拳與「返回／取消／重新載入」測試，不洩漏已確認選擇 |
| **效能與幼兒理解** | 過長動畫、文字遮擋或因果不清楚 | Milestone 1 真機基準與親子觀察後，依 Spec 定標；必要時調整呈現技術 |

### 12.2 設計保留與刻意不做

- 未來的更多交通工具、場景、語言、動畫變體、攝影機輸入及三人猜拳，均僅屬 **PRD §5.3 IDEA-01～07**；不得因此現在預設 Camera Adapter、通用 Rules DSL、角色 Plugin、三人狀態機或遠端服務。
- 本文不指定 hosting 品牌、雲端預算、音訊製作供應商或精確插畫管線；除非方案對 Spec 的可驗收品質有明確影響，否則交由實作／原型取證時決定。
- M0 先執行最小 Technical Spike，通過 Architecture Decision Gate 後再進入 M1 正式開發；執行順序與完成證據見 [Implementation Plan](implementation-plan.md)。

### 12.3 M0 Architecture Decision Gate — Vanilla vs React

**決策時點**：M0 Technical Spike 完成後、M1 正式 Vertical Slice 開始前，**正式確認**要沿用 Vanilla TypeScript + Vite，或根據證據重新評估 React。M0 使用 placeholder 素材與最小必要 UI，不必完成 M2 的全部遊戲內容。M0 Gate 是技術選型的工程關卡，不是取代 Spec 的產品驗收。

**需要的兩條代表性原型**：

1. **Learn Flow Spike**：指定對手、三次確認作答／前兩次提示／第三次錯答必要示範與封鎖第四次作答；首次無提示正確的單次計數、localStorage 保存與重新載入。用簡化示範取代正式美術，但必須驗證失敗時能呈現完整正確因果內容。
2. **Together + Animation Spike**：Player 1 確認 → 保密交接 → Player 2 確認 → 簡單倒數／SVG-WAAPI 動畫 → 共同揭曉；含取消／重玩、舊 callback、快速連點及返回／重新載入時不洩漏先前選擇。

**Gate 檢查（紀錄實際證據，不能只憑程式碼行數判斷）**：

| 面向 | Vanilla 可繼續的條件 | 重新評估 React 的訊號 |
|---|---|---|
| UI 狀態一致性 | 同一純 state／controller 驅動畫面，合法狀態與 DOM 對應清楚 | 多處手動同步同一狀態、容易漏更新或畫面矛盾 |
| DOM 與事件生命週期 | listener、渲染與動畫取消邊界明確；重玩與離開安全 | 反覆事件註冊、未清除 listener、為維護 UI 自製 reactive framework |
| 可測試性 | Vitest + DOM Testing Library 能可靠測核心互動，Playwright 可完成必要路徑 | DOM 測試高度脆弱、必須依實際動畫時間測結果或難以隔離 |
| 動畫與保密 | SVG/WAAPI 可獨立取消，雙人秘密選拳不因重新渲染／返回洩漏 | 重新渲染破壞動畫節點或跨畫面狀態使保密難以維持 |
| 實際維護成本 | 模組責任清楚，增加簡單畫面不需要大幅修改 Controller | 開始重造元件生命週期／DOM diff／binding；修改一處影響多畫面 |

**Gate 產物**：在此 TD 的 TD-02／TD-04／TD-07 更新 **Confirmed Vanilla** 或 **Reopened / React selected**，附測試結果、觀察到的 UI／媒體／狀態問題、替代方案的理由，以及 [Implementation Plan](implementation-plan.md) 內的相應驗證紀錄。

**決策規則**：若 Vanilla 可讀、易測、事件清理可控，則確認 Vanilla 並進入 M1。若存在具體失敗訊號，先定位是否為一般實作缺陷；只有確實與 UI 架構相關時才製作**針對該問題的最小 React 對照原型**，比較複雜度／測試／維護後決策，**不要求同時完整開發兩份遊戲**。如果無法決定，M1 主體實作暫不開始，先明確記錄待驗證問題及下一步；不可把「Spike 通過」誤說成 Safari 實機／MVP 已驗收。

### 12.4 技術參考（2026-11-06 查閱；實作前再次核對版本）

- [React — Build a React app from Scratch（包含 Vite react-ts 路線）](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite — Getting Started（支援版本及 scaffolding）](https://vite.dev/guide/)
- [Vitest — Getting Started（與 Vite 的整合及 Node 要求）](https://vitest.dev/guide/)
- [Phaser — What is Phaser?（若需遊戲引擎時的對照方案）](https://www.phaser.io/oss/docs/phaser/getting-started/what-is-phaser)
- [Playwright — Browsers（WebKit 與真實 Safari 的差異）](https://playwright.dev/docs/browsers)
- [MDN — Autoplay guide for media and Web Audio](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [MDN — Using the Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

**本輪結論**：暫以 **Vanilla TypeScript + Vite**、SVG/CSS/WAAPI、純 reducer／controller、localStorage、Vitest／DOM Testing Library／Playwright 進入 **M0 Technical Spike**。React 是有條件的備選，不預先排除、也不預先建置 React 對照版。正式選型須在 M0 Gate 由實際原型與測試證據確認；所有核心產品行為仍由 Spec 定義，M1 Safari 實機驗證與效能定標另行執行。
