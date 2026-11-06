# Technical Design — 工地猜拳大賽

> 文件版本：TD v0.7（同步 Spec v1.5 的三次教學作答上限；Proposed / 待開發驗證）
> 日期：2026-11-06
> 產品依據：[PRD](../PRD.md)（願景、範圍、優先級）
> 功能依據：[Spec](../spec.md)（FR／US／AC／NFR 與驗收 SSOT）
> 對應產品版本：MVP v1.0 — Browser-First / Touch-First
> 文件目的：記錄可調整的技術方案、架構取捨及擴充策略；**不是**取代 PRD 的產品需求。

## 1. 技術目標、邊界與決策原則

### 1.1 交付目標

- 以網址進入、可在 iPad / iPhone Safari 觸控遊玩的網頁遊戲，同時相容桌面及 Android 現代瀏覽器（Spec US-12）。
- 支援教學（Learn）、單人電腦對戰（Computer）與親子同螢幕（Together）（US-07～US-09）。
- 一回合一個結果；相同的規則計算，能由不同的畫面、動畫與音訊呈現（US-02、US-03、US-06）。
- 採用本機進度，無登入要求；離線功能、攝影機辨識、原生 App 與雲端同步均非 MVP。攝影機及真實手勢等僅為待使用者回饋驗證的可能方向（PRD §5.3 IDEA-05），未有預定後續版本。

### 1.2 Architecture decision guidelines

1. **PRD 定義 Why / Product Scope；Spec 定義 canonical What / Acceptance**；此文件定義建議的 How、權衡與可變更決策。技術替換若符合 Spec 的 FR / NFR、US-AC / NFR-AC，不需要反向修改產品需求。
2. 優先 KISS、YAGNI：MVP 不建置後端、微服務、CMS、角色 Plugin System 或通用動畫 DSL。
3. 透過**純邏輯**與呈現分離，降低競賽動畫誤改猜拳結果的風險；不為尚未確定的功能提前建立複雜抽象。
4. 以 Safari 真機驗證優先；自動化測試無法代替幼兒試玩與視覺／音訊驗收。
5. 本文件選型為**建議方案**，不是尚未實作產品的已驗證結論。

## 2. 候選技術選型與部署架構

| 類別 | MVP 建議 | 原因與取捨 |
|---|---|---|
| Web UI | **React + TypeScript** | 元件化、型別檢查與生態成熟；不是 PRD 的硬性要求 |
| 開發與打包 | **Vite** | 靜態 SPA 開發／建置簡單，避免不必要的 SSR |
| 動畫 | **SVG + CSS animations / Web Animations API** 為起點 | 針對 3 台主角 + 1 工地場景足夠輕量；若分鏡複雜可再比較其他工具 |
| 規則引擎 | **TypeScript pure functions** | 決策可測試，無 UI / 動畫 / 儲存相依 |
| 流程控制 | **輕量明確狀態機**（先不用外部狀態機套件） | 防止雙擊、重複發獎與尚未選完就揭曉 |
| 文案與語音 | **key-based bilingual content + short owned audio assets** | 保留中英兩種來源、重播與音訊降級能力 |
| 進度保存 | **localStorage，帶 schema version 與容錯** | 不需後端；同一瀏覽器內保存收藏／偏好，失效仍能玩 |
| 單元測試 | **Vitest** | 核心九種手勢配對、獎勵與流程轉移 |
| 瀏覽器流程測試 | **Playwright** + iOS Safari 手動真機測試 | 自動化保證主要流程，但無法等同真實 iOS Safari 驗證 |
| 部署 | **HTTPS 靜態託管** | 無常駐後端、無 App Store；PWA 不是 MVP 必要條件 |

**前後端分離決策**：MVP 是**無後端的靜態前端 Web App**，因此不存在需要部署的 API server；但前端**內部**仍應將 Domain、Orchestration、Rendering、Audio 與 Storage 分開。將來真的需要帳號／跨裝置同步時，再以新增 API boundary 的方式評估獨立後端，不必預先建立空殼服務。

## 3. 內部模組與依賴方向

~~~text
UI (Screens / Cards / Controls)
             |
             v
   RoundController (mode + state)
      |         |          |
      v         v          v
  RpsRules   Animation   Audio / I18n
  (pure)      Player       Player
      |
      v
 Content definitions (gesture / character / scene / animation IDs)
             |
        optional use
             v
 ProgressStore (local device)
~~~

- **RpsRules**：只處理 rock / scissors / paper、tie / win / lose 與勝負關係；不存任何工程車名稱或動畫檔案。
- **RoundController**：一次回合狀態與事件（選擇、確認、交接、倒數、結果、完成、再玩）；決定何時隱藏／揭曉對手，不負責動畫渲染。
- **ContentDefinitions**：三位主角、圖像、舞台、文案及結果視覺所需的簡單內容對照；不包含可以修改規則的參數。
- **AnimationPlayer**：接受已算好的回合結果與對應動畫 ID，只負責視覺；支援結束通知、跳過、重播與中斷。
- **Audio / I18n**：接受語音／字串 key，處理雙語順序、音效隊列、靜音與重播，不決定勝負。
- **ProgressStore**：保存每組勝負規則的 0～3 次合格無提示首答正確計數、已解鎖收藏 ID 與三種語音偏好；處理版本、讀取錯誤和儲存失敗。
- **UI**：可測試的各畫面元件；不在 React event handler 內複製九種規則或拼接錯誤結果文案。

跨模組依賴盡量單向：Domain 不依賴 React、瀏覽器、動畫或儲存；不要將每個模組做成可任意掛載的 Plugin。

## 4. 核心領域資料模型（建議）

以下為**介面草案**，可隨開發調整命名，不要求建立完整 Domain-Driven Design 框架：

~~~ts
type Gesture = "rock" | "scissors" | "paper";
type Mode = "learn" | "computer" | "together";
type Outcome = "win" | "lose" | "tie";
type RuleId = "rock-beats-scissors" | "scissors-beats-paper" |
              "paper-beats-rock" | "tie";
type MasteryRuleId = Exclude<RuleId, "tie">; // 三組可學習且可解鎖的勝負規則
type MasteryCounts = Record<MasteryRuleId, 0 | 1 | 2 | 3>; // 最多各 3 次合格首答

type RoundResult = {
  playerGesture: Gesture;
  opponentGesture: Gesture;
  outcome: Outcome; // 以 Player 1 / 孩子的視角
  ruleId: RuleId;
};

type Vehicle = {
  id: string;             // 不隨翻譯或資產重命名
  displayNameKey: string; // 中英語文案 key
  assetId: string;
  kind: "playable" | "collectible";
};

type Scene = {
  id: string;
  backgroundAssetId: string;
  optionalAmbientAudioId?: string;
};
~~~

**MVP 已確認的不變條件（Spec FR-02、FR-07 與 PRD §5.3 原則）**：
- Gesture 僅有三種；角色是手勢的**視覺對應**，不得以車速、稀有度或其他資料覆蓋 RPS 勝負。
- 在 MVP，唯一可參賽角色對應如下：rock → Captain Dozer；scissors → Snip-Snip；paper → Cover Crane。收藏車**不能**出拳（Spec §1、§7）；更多收藏僅為可能的 IDEA-01。
- 規則引擎對 3 × 3 = 9 組輸入始終給相同結果；平手必須具有獨立的 RuleId。
- 「同一手勢的多台可參賽車輛」只是 IDEA-06，是否值得實作需先依試玩回饋做產品決策；目前 `kind` 的分離僅服務 MVP 已有的可參賽／純收藏區別，不是提前建造候選功能。

### 4.1 必須集中維護的結果規則

~~~text
rock     > scissors
scissors > paper
paper    > rock
same     = tie
~~~

- 應用同一個純函式計算單人或親子結果；教學模式只使用**已知對手手勢**的提示／驗證，而非不同勝負規則。
- 電腦出拳以對玩家選擇**獨立且近似等機率**的三選一產生，不做暗中保勝／保輸；對手選擇在揭曉前需保密。
- 可測試的演算法與隨機來源應分離，以便在測試中注入固定選擇；不需要為一般遊戲引入密碼學安全對抗機制。

## 5. 狀態與對戰流程設計

### 5.1 建議的單回合狀態

~~~text
home -> mode-select
mode-select -> opponent-prompt -> choosing (Learn: show opponent first)
mode-select -> choosing (Computer or Together)
choosing -> choosing (Learn: incorrect answer -> hint -> retry)
choosing -> ready (Learn: confirmed correct answer)
choosing -> ready (Learn: parent requests direct demonstration; use correct winning gesture, do not mark independently correct)
choosing -> opponent-hidden -> ready (Computer: player confirmed)
choosing -> handoff (Together: Player 1 confirmed, hide choice)
handoff -> choosing (Together: Player 2)
choosing -> ready (Together: Player 2 confirmed)
ready -> countdown -> race -> rule-effect -> feedback -> complete
complete -> mode-specific new round (Play again)
complete -> home
~~~

控制原則：
- 只有在合法 state 才接受對應事件；開始後多次點按不會觸發第二次對局。
- 每個回合建立一個唯一 round token；動畫／音訊非同步結束時須檢查 token，不能回寫舊回合結果。
- 再玩一次或離開時取消正在進行的計時、動畫與語音，並清空上一局的選擇、結果與暫存成就通知。
- 親子雙人於交接後返回、取消或重新載入時，不能重現上一位已確認的手勢選擇畫面；可安全清除並重開該局（Spec AC-09.1）。
- 獎勵在「真正完成回合」時**最多發一次**，即使回放動畫、重複完成 callback 或重新渲染也不能重複授予。
- 教學選拳只在**按確認後**判定答對／錯；**第 1、2 次確認答錯**各給不洩漏正確答案的溫和提示，**第 3 次確認仍答錯**才揭曉正確答案；**每題最多 3 次提交，不接受第 4 次作答**。第二或第三次答對仍可完成教學但不獲首次無提示正確計數；第三次答錯後可觀看示範或開始新題。答錯不生成正式比賽的 lose 結果。
- 教學的「直接看示範」是家長明確觸發的獨立路徑，依已知對手自動帶入正確獲勝手勢並提供短鼓勵，但**不記為孩子獨立答對，也不累計收藏進度**（Spec OQ-05＝C）。
- 一題只有**首次確認前未受任何答案提示**且首次答案正確，才增加該題所屬 MasteryRuleId 的計數（上限 3）。錯答後補答、示範、對戰、重播與舊 callback 都不可計入。三組計數皆達 3 後再切換混合出題；不需連續三題。

### 5.2 關鍵 UI 保密細節（US-08、US-09）

由於**每個手勢對應固定工程車**，一旦比賽開始就完整顯示對手車種，等於在揭曉前洩漏對手手勢。這需要明確解決：

- **電腦對戰**：Ready 與 Race 階段只顯示玩家角色；對手使用被塵煙遮住的輪廓、工地帷幕或中性「神秘工程車」視覺，**不可依實際出拳露出可辨認車種或手勢**。中央 reveal 時再換成實際對手角色、接續規則動畫。
- **親子雙人**：在 Player 1 選擇確認後切至完全遮蔽的交接頁；Player 2 確認前不得看到 Player 1 選項。共同揭曉前，**雙方可辨識的車種／手勢都應遮蔽**，倒數與競賽先呈現中性輪廓或遮擋，抵達中央後才同時呈現雙方。
- **教學模式**：對手手勢本來就是提前展示的，可直接顯示雙方工程車，以便理解。

上述是滿足 Spec「保密選拳」與「工程車比賽動畫」的建議視覺取捨；實際美術可在 prototype 中調整，但不能讓比賽模式提前洩漏猜拳手勢。

## 6. 動畫資產與場景設計

- 初版固定 **construction-site** 場景；不用先實作場景選單或多舞台載入器。
- 依**已計算的 RuleId + 玩家左右位置**決定動畫：rock-beats-scissors、scissors-beats-paper、paper-beats-rock、tie。
- 動畫建議分段：entrance / countdown / approach / causal-rule / feedback / recovery / exit；可共用位移及背景，但因果動畫須各自明確。
- 動畫以資料 key 對應原創素材，不與勝負引擎相依；只需簡單的動畫 ID 對照，不要做通用時間軸編輯器。
- 角色由可辨識的主圖／表情與少量活動部位組成；動畫始終保留手勢及雙語規則訊息。
- 支援不同左右方向與結果，但不要錯把鏡像用於所有字樣或造成吊車／剪刀的操作方向錯誤。
- 如交付 FR-13／US-13（P1）的減少動態選項，縮短移動與粒子效果並**保留規則因果重點**；不因未實作 P1 控制阻擋 MVP 的核心動畫。動畫資產載入失敗時，仍須以靜態關係圖與結果語音／文字降級（NFR-04）。

## 7. 中英文字、音訊與 Safari 行為

- 文字與音訊依 stable key 管理（例如 gesture.rock、rule.paper-beats-rock、feedback.lose.calm），避免分散於多處判斷。
- **所有畫面文字始終繁中與英文並列**（含次要 UI），不隨語音切換。語音僅有**雙語（預設：繁中→英文依序播放）／中文／英文**三種偏好；語音重播和倒數旁白也遵循此偏好（Spec §6.2、PRD §1.1）。
- 音訊播放以可取消的隊列處理：倒數聲、規則旁白、愛的鼓勵、短音效不得互相覆蓋或重複。
- iOS Safari 的音訊啟動需連到使用者按下「開始」等互動，若播放被拒絕，遊戲繼續且保留文字提示。
- 預先錄製或具合法授權的語音／掌聲資產優先；Prototype 可以先採用替代音源。確保「愛的鼓勵」使用來源合法。
- 不建置語音辨識／麥克風功能；是否需要新語言／語音內容由使用者回饋決定（PRD §5.3 IDEA-04），目前只支援已確認的中英雙語。

## 8. 本機進度與版本相容性

- 建議本機資料包含：schemaVersion、**masteryCountsByRuleId**（三種 MasteryRuleId 各 0～3）、unlockedCollectibleIds、**speechLanguageMode**（bilingual/zh/en）及 audioPreferences；若交付 FR-13（P1）再加 reducedMotion。不要把 `completedLessonIds` 或一般完成次數直接當成獨立掌握進度。
- 由固定 **MasteryRuleId → collectibleId** 一對一對照判定首次達 3 時的解鎖；三位猜拳主角則始終可使用。額外收藏 ID 應穩定，既有 unlock 不可因對戰結果、示範或重播而倒退。資料寫入需使計數與解鎖狀態一致，重複提交／刷新不可重複加計；若儲存雙方資料，讀取時須避免不一致。
- 提供三組規則依固定輪替題序進入混合出題的判斷；在 3/3/3 前仍固定輪替，在全滿後混合出題。單題資格由首次提交及是否出現額外提示的狀態決定。
- 不儲存孩子姓名、照片、精確位置或任何攝影機資料（MVP 根本不開啟攝影機）。
- 對未知 key、舊版本、無法解析 JSON、儲存配額不足或受限瀏覽器模式須有容錯；應以安全預設啟動遊戲。
- **收藏 ID 持久且不重用**：新增角色不應導致舊收藏進度指向錯誤車種；若調整內容 id，需要明確版本遷移。
- 如無法持久寫入進度，應讓遊戲繼續運作，並告知家長「關閉後可能無法保留收藏」；不宣稱保存成功。
- 「重設」需家長二次確認，不得因切換語言或重啟回合而清除收藏。

## 9. 對未來方向的技術態度（不構成實作承諾）

PRD §5.3 的 **IDEA-01～IDEA-07 是等待孩子試玩與家長回饋的假設，不是已批准功能**。技術設計**不應**將這些假設轉成必須預留的模組、架構抽象、版本任務或測試交付項目。需要新功能時再根據已驗證的需求設計最低必要擴充。

| 候選想法（僅供參考） | 如果日後獲准，可再評估的技術問題 | MVP 目前不需要做 |
|---|---|---|
| IDEA-01 更多收藏 | 既有收藏 ID／內容資料是否足以新增其他車種？ | 角色編輯器、Plugin Marketplace、超出 §7 的收藏內容 |
| IDEA-02 更多場景 | 新場景是否需要獨立資產管理及場景選擇？ | 多場景系統、場景選單、通用 Scene Manager |
| IDEA-03 動畫變體 | 目前規則與渲染的分離是否足以容納變體？ | 通用動畫 DSL、時間軸編輯器 |
| IDEA-04 更多語言 | 現有中英文字／音訊 key 是否方便維護？ | 額外語言資產或動態翻譯服務 |
| IDEA-05 真實手勢／攝影機 | 假如產品決定導入，是否需要輸入適配層、辨識誤差處理與隱私機制？ | Camera Adapter、MediaPipe 或錄影權限 |
| IDEA-06 同手勢多車 | 假如試玩證明值得做，如何避免影響對應手勢的教學直覺？ | 多可參賽車輛選擇系統或角色能力系統 |
| IDEA-07 三人猜拳 | 孩子掌握雙人規則後若有需求，才確認三人判定規則（包含三拳全同／全不同／兩同一異）、輪流保密選擇、結果動畫及三方情緒回饋的可行性。 | 三人 UI、三方規則引擎、狀態機泛化、提前抽象多人對戰或額外測試 |

**MVP 仍要保持的品質界線**：猜拳規則應與角色、速度、動畫分離；九種結果皆正確；三位可參賽角色和 §7 已要求的基本收藏運作正常；既有進度能保存／讀取。這些由已確認的 FR／AC 驅動，不是因為 IDEA 清單而新增的「未來擴充驗收」。

**決策門檻**：只有在獲得回饋、明確產品價值及正式新增 FR／US／AC 之後，才評估需要哪些技術更動；否則保持 YAGNI，避免為未知需求增加開發與維護成本。

## 10. 測試與驗證策略

### 10.1 自動化（建議）

- Domain unit tests：全部 9 種結果、平手、結果對應 RuleId；對角色／場景變化不敏感。
- Mode/controller tests：教學第 1、2 次錯答各顯示**不直接洩漏答案**的提示；第 3 次仍錯才揭曉答案、封鎖第 4 次提交；第 2／3 次答對仍可完成本題但不加計，只有第 1 次確認正確才算無提示獨立答對；答錯後補答或示範不加計；電腦選擇與玩家手勢獨立；雙人 handoff 全程不洩漏；回合只完成一次。
- Mastery/collectible tests：三組規則各需 **3 次不同題目的首次無提示正確**才能逐一解鎖其一對一收藏；2/3 不解鎖、3/3 只解鎖一次、全部 3/3/3 才混合；錯答補答、家長示範、電腦／親子 win／lose／tie、replay／skip、重渲染均不加計；以上仍可給短鼓勵。重新載入保留計數和收藏，寫入失敗不阻塞遊玩。
- UI flows：三張選卡、點擊確認、倒數、遮蔽、結果、重玩、家長設定；音訊無法播放時不阻塞。
- Content validation：每個 RuleId 有正確中英文案、對應動畫（或安全降級）；不存在第四個不合法 Gesture。
- 減少動態：若 FR-13／US-13（P1）納入實作，跳過／重播後勝負、收藏與回合狀態不能改變；不將其默認升級為 P0。

### 10.2 實機／人工（必做）

- iPhone Safari 直向、iPad Safari 直／橫向：文字清楚、無瀏覽器工具列遮擋、按鈕大小適合幼兒、音效可啟動。
- Android 與桌面現代瀏覽器：完成主要遊戲流程即可。
- 真正親子試玩：是否看得懂「車代表手勢」，是否會誤以為車跑快就贏；輸掉後是否願意再玩；能否在螢幕外說出三組勝負關係。
- 結果動畫反覆試播：三組勝負兩種左右位置及三組平手的視覺語義與修復結尾皆正確。

### 10.3 對應 Spec NFR-01～NFR-08 的驗證策略

| NFR | 建議技術驗證／交付證據 |
|---|---|
| NFR-01 Compatibility | iPhone／iPad Safari 真機，Android 與桌面現代瀏覽器的實際流程記錄；交付網址可使用 HTTPS 開啟。 |
| NFR-02 Usability | 實機檢查觸控區、安全區、直／橫向與幼兒試玩；56×56 CSS px 為 PRD 建議目標，不能取代實機操作證據。 |
| NFR-03 Performance | **Milestone 1 量測**首次可操作時間、選拳回應延遲、動畫流暢度、等待時間，記錄裝置與條件；依試玩資料訂出最終 MVP 門檻，**不在技術設計預設未量測的數字**。 |
| NFR-04 Reliability | 模擬音訊被阻擋、資產不存在、中斷、快速連點與舊回合 callback；結果仍正確，學習計數與收藏解鎖不重複。 |
| NFR-05 Privacy & Safety | 實際檢查瀏覽器權限提示、網路請求及 UI，確認無兒童個資輸入／追蹤／付費；進度重設需二次確認。 |
| NFR-06 Accessibility | 關聲音仍可辨識手勢與結果、非色彩唯一辨識；如交付 FR-13（P1），再測減少動態、跳過／重播的正確性。 |
| NFR-07 Data Persistence | 重新載入後三組 0～3 計數及已解鎖收藏保持一致、語音三選一持續保存；測試本機儲存不可用／損毀及二次確認重設，記錄降級行為與資料相容性。 |
| NFR-08 Maintainability | 九組規則回歸測試；更換角色資產、文案與動畫後仍通過，不要求特定外部架構套件。 |

Spec §9.4 的 `NFR-AC-xx.y` 是正式驗收條件；本節只是建議技術手段。依 Spec §10.3 保留裝置版本、測試結果、失敗情境及待修問題的驗收證據。

## 11. 交付順序與保留決策

1. **M0**：搭起網頁骨架、純規則函式與狀態流程；用 placeholder 素材驗證觸控與一回合重玩。
2. **M1**：完整第一條工地規則動畫 Vertical Slice（選車 → 倒數 → 比賽 → 因果 → 情緒回饋），先拿給孩子試玩，並取得 NFR-03 在目標 Safari 裝置上的初步效能基準。
3. **M2**：完整 Learn / Computer / Together 三模式與三組勝負／平手動畫；Learn 的首次無提示正確計數、**第 1／2 次錯答各提示、第 3 次錯答才揭曉及封鎖第 4 次提交**、3/3/3 後混合題皆能驗證。
4. **M3**：全畫面中英並列、三模式語音、完整掌聲、按各規則 3 次合格答對解鎖的三台額外收藏、本機資料、iOS 真機 QA，並完成 Spec §10.3 的 NFR 品質驗收及 NFR-03 定標／複測。

這是 PRD §6 的**技術落地建議**，不是已承諾的開發工期。

### 11.1 尚待實作驗證的取捨

- React + Vite、SVG/CSS 是否足以達成預期角色動畫表現；若須替代，應比較 bundle 體積、Safari 效能、可維護性與美術流程。
- 工程車素材是 SVG 圖層或其他可授權資產格式，依第一個 Vertical Slice 效果決定。
- 音訊製作、合法「愛的鼓勵」掌聲素材與中英文發音品質。
- Player 2 交接畫面的保密體驗，以及電腦對戰中的神秘車輪廓是否能兼顧期待感與公平揭曉。
- 收藏資料 schema 的第一個版本號與必要遷移策略；不要在未開始實作時設計空的遷移框架。
- **新增可參賽車輛**（不同車可代表同一手勢）僅為 PRD §5.3 的 IDEA-06；沒有使用者回饋與產品決策前，不應視為已要求的功能。

**完成條件**：實作與驗收以 [Spec](../spec.md) 的正式 FR、US、AC、NFR 為準，並遵守 [PRD](../PRD.md) 的範圍與優先級；§5.3 IDEA 清單**不列入交付／驗收範圍**，除非日後根據回饋正式批准並轉成需求。本文件可因新技術證據、原型試玩或效能量測調整，但不得默默更改已確認的產品承諾。
