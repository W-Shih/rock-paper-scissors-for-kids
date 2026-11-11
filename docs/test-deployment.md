# M1 HTTPS 測試部署

用途：2026-11-10 使用者要求的 iPhone Safari 試玩及 M1-08 真機取證；不是正式 MVP Release。

## 部署設定

- Hosting：Sites 靜態 HTTPS；站台 ID 存於 [hosting.json](../.openai/hosting.json)，後續更新沿用同一 ID。
- 測試網址：[HTTPS Safari 試玩](https://construction-rps-safari-trial.workspace-085079.chatgpt.site)。Sites 已回報 `succeeded`，並完成下方無登入 HTTP smoke。
- 存取：使用者已明確選擇知道連結即可開啟、免登入；Sites access mode 已設為 public。
- 遊戲來源基線：`0039cf2b76b5afc4ec52fa9e28b11db6e1a0df26`（`codex/m1-08-integration-baseline`）。部署用獨立來源副本包含本次 hosting 設定及驗收表；Sites 的實際來源 commit／版本／部署 ID 見下方。發布完成後補填的本機證據文字未包含在第 1 版來源快照，遊戲程式與產物未變更。
- 建置：`npm run build`，靜態目錄 `dist`；上傳 artifact 僅含 `.openai/hosting.json` 及建置資產，不提供來源文件或憑證下載。
- 不使用後端、資料庫、帳號、Service Worker 或新增追蹤；保留既有遊戲流程及 localStorage 語義。

## 驗證與限制

- 本輪 `npm run build`、`npm run typecheck`、`npm run lint` 通過；`npm test` 為 111/111 通過。
- 首次 lint 因暫存部署副本位於專案內被重複掃描而失敗；副本移出專案後，未修改 lint 規則，重跑通過。
- 既有 30/30 Chromium／WebKit E2E 證據見 [M1-08 evidence](m1-08-evidence.md)。本次未更動遊戲程式，尚未重跑 E2E；線上 smoke 與真機結果分開記錄。
- **部署時（2026-11-10）紀錄**：當時尚無 iPhone／iPad Safari 實機回報；親子觀察及 NFR-03 真機基線亦未驗證。其後收到的 iPad 使用者回報見下節；M1-08 仍 Blocked、M1 Exit 關閉。
- 正式音訊／掌聲、完整 Learn／Together、Garage、設定、全套因果動畫與正式 Release 稽核仍待 M2／M3；請優先測 Computer。

## 操作與更新

Safari 開啟成功網址後：首頁「比賽 / Play」→「電腦 / Computer」→選卡→確認→看結果→完成→再玩／首頁。填寫 [真機紀錄表](m1-08-device-record.md)，每種裝置與方向另留一份實測紀錄。

更新時沿用 `.openai/hosting.json` 的 project_id，使用 Sites 官方 source helper 在獨立副本建置、提交並推送對應來源，保存版本後部署。記錄來源 commit、版本及部署結果；不得只替換本機 dist 就宣稱上線。

第一版尚無可回退的已驗證線上版本。後續更新若需回退，從 Sites 歷史選擇前一個已驗證版本重新部署，保留相同 origin。更換網域、瀏覽器、裝置或清除網站資料不保證保留進度；回退不應手動清除或改寫既有進度。

## 發布結果

| 欄位 | 已驗證值 |
|---|---|
| 發布日（America/Tijuana） | 2026-11-10 |
| Sites 結果時間（UTC） | 2026-11-11T04:46:14.797009+00:00 |
| 狀態／版本 | succeeded／第 1 版 |
| Sites source commit | `b6c5e32ebfde62308f7c29655379f67dbc882808` |
| Saved version ID | `appgprj_6af3f155dba88191a3fc6b07c2376c3f~appgver_755fec0e0bc48191b0b033e154c81c80` |
| Deployment ID | `appgdep_6af3f30cf8808191a504c6758d8b6b40` |
| Artifact SHA-256（Sites 回傳） | `dd3c4d57b3454aee1e7b4fd39c1424714089a17840576c5022359c9d62f30b38` |

無登入 HTTP smoke 使用 `Invoke-WebRequest`，不帶 cookie／登入資訊且禁止重新導向：

| 路徑 | HTTP／Content-Type |
|---|---|
| `/` | 200／text/html；有遊戲 title、`#app` 及正確 module script |
| `/assets/index-BikqDjWM.js` | 200／text/javascript |
| `/assets/index-BhyBqIn0.css` | 200／text/css |
| `/assets/characters/captain-dozer.svg` | 200／image/svg+xml |
| `/assets/characters/cover-crane.svg` | 200／image/svg+xml |
| `/assets/characters/snip-snip.svg` | 200／image/svg+xml |
| `/assets/scenes/warm-construction-site.svg` | 200／image/svg+xml |

線上及本機 JS SHA-256 均為 `738604201FF3D64AA76281A7710848C860072149C3E51B685D2301ADD939D494`。HTML 回應含 Cloudflare `/cdn-cgi/challenge-platform/` 安全腳本注入；完整執行時 Network／隱私稽核仍待人工瀏覽器驗證，不能僅憑靜態來源宣稱 hosting 無額外請求。

已呼叫 Codex browser 開啟測試網址，工具回報 queued；這不是瀏覽器互動或 Safari 真機證據。此次 smoke 僅驗證 HTTP、資產與程式版本，未宣稱已執行線上完整遊戲或實機驗收。

## 後續 iPad 使用者回報（2026-11-11）

使用者回報 iPad Air 第 5 代、iPadOS 17.6.1、Safari 上的直向 Computer 流程、再玩／返回首頁、橫向重複流程與版面，以及定性操作反應均通過；範圍、證據來源與限制詳見[真機紀錄表的使用者回報](m1-08-device-record.md#ipad-使用者回報本次對話)。此為部署後收到的回報；執行時的部署版本、日期／時間、網路與快取未知，不能據此確認當時載入的確切版本。

此回報不改變上述部署結果或 HTTP smoke 範圍，也不涵蓋 iPhone、量化效能／FPS、工具列展開／收合、全部結果組合、親子觀察或 Network／隱私稽核。M1-08 仍 Blocked，M1 Exit 仍關閉。

## 交付文件核對（2026-11-11）

本次交付僅整理既有部署與使用者回報的證據脈絡；未變更遊戲程式或部署產物，未重新部署。交付核對重新確認 Sites 第 1 版來源 commit `b6c5e32ebfde62308f7c29655379f67dbc882808`、artifact SHA-256 `dd3c4d57b3454aee1e7b4fd39c1424714089a17840576c5022359c9d62f30b38` 及已記錄 Deployment ID 狀態為 `succeeded`。無 cookie、禁止重新導向的 HTTP 請求再次確認首頁與記錄中的遊戲 JS 回應 200；JS SHA-256 `738604201FF3D64AA76281A7710848C860072149C3E51B685D2301ADD939D494` 與部署紀錄一致。這是部署狀態及 HTTP／資產核對，不是瀏覽器互動、完整遊戲流程或新的真機驗收。既有 smoke 清單見上文；後續 iPad 回報與未驗證範圍見[真機紀錄表](m1-08-device-record.md)。
