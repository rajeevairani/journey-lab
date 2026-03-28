// ══════════════════════════════════════════════════════════════════
//  PurchaseJourney Lab — Google Apps Script Web App
//  Paste this entire file into:
//    Extensions → Apps Script → replace contents → Save → Deploy
// ══════════════════════════════════════════════════════════════════

const SHEET_NAME = "Sessions";

const HEADERS = [
  "session_id", "email", "product", "category", "ad_target_turn",
  "turn_id", "ts", "user_prompt", "assistant_response",
  "stage", "depth", "attribute", "emotion", "reasoning",
  "ad_shown", "ad_product", "ad_brand", "ad_price",
  "ad_stage", "ad_depth", "submitted_at"
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    // Style header row
    const hRange = sheet.getRange(1, 1, 1, HEADERS.length);
    hRange.setBackground("#1b1d2e");
    hRange.setFontColor("#ffffff");
    hRange.setFontWeight("bold");
    hRange.setFontFamily("Courier New");
    hRange.setFontSize(10);
    sheet.setFrozenRows(1);
    // Set column widths
    sheet.setColumnWidth(7,  160); // ts
    sheet.setColumnWidth(8,  280); // user_prompt
    sheet.setColumnWidth(9,  280); // assistant_response
  }
  return sheet;
}

// Called by the tool — accepts POST with JSON body
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    const now = new Date().toISOString();

    // data.rows is an array of row objects
    const rows = data.rows || [];
    rows.forEach(row => {
      sheet.appendRow([
        row.session_id      || "",
        row.email           || "",
        row.product         || "",
        row.category        || "",
        row.ad_target_turn  || "",
        row.turn_id         || "",
        row.ts              || "",
        row.user_prompt     || "",
        row.assistant_response || "",
        row.stage           || "",
        row.depth           || "",
        row.attribute       || "",
        row.emotion         || "",
        row.reasoning       || "",
        row.ad_shown        || 0,
        row.ad_product      || "",
        row.ad_brand        || "",
        row.ad_price        || "",
        row.ad_stage        || "",
        row.ad_depth        || "",
        now
      ]);
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", rows_added: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Health check — visit the Web App URL in browser to confirm it works
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "PurchaseJourney Lab — sheet ready" }))
    .setMimeType(ContentService.MimeType.JSON);
}
