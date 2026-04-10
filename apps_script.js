const SHEET_NAME = "Sessions";
const HEADERS = [
  "session_id","product","category","ad_target_turn",
  "turn_id","ts","user_prompt","assistant_response",
  "stage","depth","attribute","emotion","reasoning",
  "ad_shown","ad_product","ad_brand","ad_price",
  "ad_stage","ad_depth","submitted_at"
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function handle(payloadStr) {
  const data = JSON.parse(payloadStr);
  const sheet = getOrCreateSheet();
  const now = new Date().toISOString();
  (data.rows || []).forEach(r => {
    sheet.appendRow([
      r.session_id||"", r.product||"", r.category||"", r.ad_target_turn||"",
      r.turn_id||"", r.ts||"", r.user_prompt||"", r.assistant_response||"",
      r.stage||"", r.depth||"", r.attribute||"", r.emotion||"", r.reasoning||"",
      r.ad_shown||0, r.ad_product||"", r.ad_brand||"", r.ad_price||"",
      r.ad_stage||"", r.ad_depth||"", now
    ]);
  });
  return ContentService.createTextOutput(JSON.stringify({status:"ok",rows:(data.rows||[]).length}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try { return handle(e.postData.contents); }
  catch(err) { return ContentService.createTextOutput(JSON.stringify({status:"error",msg:err.message})); }
}

function doGet(e) {
  if (e.parameter && e.parameter.data) {
    try { return handle(decodeURIComponent(e.parameter.data)); }
    catch(err) { return ContentService.createTextOutput(JSON.stringify({status:"error",msg:err.message})); }
  }
  return ContentService.createTextOutput(JSON.stringify({status:"ready"}));
}