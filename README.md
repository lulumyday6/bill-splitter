# 聚餐分帳器

免登入的 GitHub Pages 分帳網頁。支援平均分帳、依餐點分帳、服務費、外幣紀錄與台幣刷卡手續費。

## 收據辨識

中文模式使用 PP-OCRv5 mobile 模型，在裝置的 Web Worker 內執行。網站只下載靜態程式及模型，不會傳送照片、辨識內容或人員資料，也不使用 localStorage、IndexedDB 或分析追蹤。首次下載約 46 MB；需要支援 WebAssembly、Web Worker、OffscreenCanvas 的現代瀏覽器。其餘語言保留 Tesseract.js 免費辨識。

餐點使用名稱、數量、單價及小計四個欄位。數量或單價變更會更新小計；直接修正小計會反推單價。內部保留精確分數比例，顯示單價最多六位小數，避免除不盡造成累積誤差；小計依幣別四捨五入，分帳仍以小計為準。疑似夾在餐名裡的價格可按建議按鈕拆分，餐名本身的數字不強制刪除。

辨識後只呈現餐點候選列，使用者可以修改名稱、數量、小計，或取消選取。訂購卡片、表格欄位、換行餐名、零元附餐、數量／價格黏連均有處理。不保證文字、數量或金額完全正確，所有結果仍需對照照片確認；未完成總額核對不提供正式收款清單。

## 開發與測試

開啟 index.html 可以使用基本手動分帳；照片辨識請使用 GitHub Pages 或本機 HTTP 伺服器。

- `node test.cjs`：金額分配、外幣、手續費。
- `node test-app.cjs`：介面狀態與收款核對。
- `node test-pricing.cjs`：單價／數量／小計連動與精確比例。
- `node test-receipt.cjs`：合成資料測試，不含真實收據或聯絡資料。
- `npm install` 後執行 `npm run build:ocr`，可重新建置 `ocr-src/worker.js`。已提交建置成品供 Pages 直接使用。

建置時對 Guten OCR 做小範圍轉換：保留個別文字框給餐點解析器、避免把細長的數字旋轉，以及複製影像記憶體後釋放 OpenCV 物件。使用 OffscreenCanvas 讓辨識留在背景執行，取消時終止 Worker。

私人測試目錄 `.local-qa/`、`node_modules/`、密碼及鑰匙檔一律忽略，不得加入版本控制。

## 模型與授權

- PP-OCRv5 mobile det / rec：PaddleOCR，Apache-2.0。原始下載目錄：`https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/`，檔案 `PP-OCRv5_mobile_det_onnx_infer.tar`、`PP-OCRv5_mobile_rec_onnx_infer.tar`。字典取自 recognition inference.yml 的 character_dict。
- Guten OCR 1.4.9 / browser 1.4.8：MIT。
- ONNX Runtime Web 1.30.0：MIT。
- OpenCV.js 4.9.0-release.3：Apache-2.0。
- Clipper / JSBN / tiny-invariant：授權全文與著作權標示見 `ocr-assets/licenses/`。

模型 SHA-256：

| 檔案 | SHA-256 |
|---|---|
| detection.onnx | a431985659dc921974177a95adcfbb90fd9e51989a5e04d70d0b75f597b6e61d |
| recognition.onnx | da72dc72ca4dc220df0dfde68c1dedc31c58d3e76a25871122e5056227d50092 |
| dictionary.txt | 17665d27ed39f0deb82007859992d626d3105d0ee4578c120b7c72138dc04d05 |
