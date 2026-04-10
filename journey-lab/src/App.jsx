import { useState, useRef, useEffect } from "react";

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Epilogue:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Fira+Code:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; overflow: hidden; }
body { font-family: 'Epilogue', sans-serif; background: #090a0f; color: #e8e6f0; }

:root {
  --bg:    #090a0f;
  --L1:    #0f1018;
  --L2:    #141520;
  --L3:    #1b1d2e;
  --bd:    rgba(255,255,255,.07);
  --bd2:   rgba(255,255,255,.13);
  --txt:   #e8e6f0;
  --mut:   rgba(232,230,240,.4);
  --dim:   rgba(232,230,240,.18);
  --acc:   #7c8dff;
  --accD:  #5060d0;
  --amber: #f5a623;
  --green: #3ecf8e;
  --red:   #f16b6b;
  --mono:  'Fira Code', monospace;
  --head:  'Syne', sans-serif;
}

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; }

@keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes slideR  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
@keyframes adPop   { 0%{opacity:0;transform:scale(.91) translateY(12px)} 65%{transform:scale(1.02)} 100%{opacity:1;transform:scale(1) translateY(0)} }
@keyframes shimmer { 0%,100%{opacity:.25} 50%{opacity:1} }
@keyframes glow    { 0%,100%{box-shadow:0 0 10px rgba(124,141,255,.2)} 50%{box-shadow:0 0 24px rgba(124,141,255,.55)} }
@keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
@keyframes toast   { 0%{opacity:0;transform:translateY(10px)} 15%,85%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-6px)} }

.fu  { animation: fadeUp .42s cubic-bezier(.22,.68,0,1) both; }
.fi  { animation: fadeIn .3s ease both; }
.sr  { animation: slideR .32s ease both; }
.adp { animation: adPop .55s cubic-bezier(.22,.68,0,1.3) both; }

button { cursor:pointer; font-family:'Epilogue',sans-serif; }

.btn-p {
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  padding:12px 24px; border-radius:10px; border:none;
  background:var(--acc); color:#fff;
  font-size:14px; font-weight:600; letter-spacing:.2px; transition:all .18s;
}
.btn-p:hover:not(:disabled) { background:var(--accD); transform:translateY(-1px); box-shadow:0 6px 22px rgba(124,141,255,.32); }
.btn-p:disabled { background:rgba(255,255,255,.06); color:var(--dim); cursor:not-allowed; }

.btn-g {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:9px 18px; border-radius:9px;
  background:transparent; color:var(--mut); border:1px solid var(--bd2);
  font-size:13px; font-weight:500; transition:all .18s;
}
.btn-g:hover { border-color:var(--acc); color:var(--acc); background:rgba(124,141,255,.07); }

.inp {
  width:100%; padding:11px 14px; border-radius:9px;
  border:1px solid var(--bd); background:rgba(255,255,255,.03);
  color:var(--txt); font-size:14px; font-family:'Epilogue',sans-serif;
  transition:border .15s,background .15s;
}
.inp:focus { outline:none; border-color:var(--acc); background:rgba(124,141,255,.05); }
.inp::placeholder { color:var(--dim); }

.chip {
  display:inline-flex; align-items:center; padding:5px 12px; border-radius:20px;
  border:1px solid var(--bd); background:transparent;
  color:var(--mut); font-size:12px; font-weight:500;
  cursor:pointer; transition:all .15s; font-family:'Epilogue',sans-serif;
}
.chip:hover { border-color:var(--acc); color:var(--acc); }
.chip.on { border-color:var(--acc); background:rgba(124,141,255,.14); color:var(--acc); }

.lbl {
  display:block; font-family:var(--mono); font-size:10px;
  letter-spacing:1.5px; color:var(--mut); margin-bottom:8px; text-transform:uppercase;
}
`;

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const STAGES = [
  { key:"need_recognition", short:"Need",     label:"Need Recognition",  color:"#a78bfa", glyph:"◎" },
  { key:"research",         short:"Research", label:"Information Search", color:"#7c8dff", glyph:"◉" },
  { key:"comparison",       short:"Compare",  label:"Comparison",         color:"#38bdf8", glyph:"⊙" },
  { key:"risk_evaluation",  short:"Risk",     label:"Risk Evaluation",    color:"#fb923c", glyph:"⊗" },
  { key:"decision",         short:"Decide",   label:"Purchase Decision",  color:"#3ecf8e", glyph:"⊕" },
  { key:"post_purchase",    short:"Post-Buy", label:"Post-Purchase",       color:"#94a3b8", glyph:"●" },
];
const SKEYS = STAGES.map(s => s.key);

const CATS = [
  "Electronics","Automotive","Travel","Fashion","Food & Nutrition",
  "Financial Services","Health & Insurance","Software","Subscriptions",
  "Home & Appliances","Education","Retail","Beauty","Other"
];

/* ══════════════════════════════════════════════════════════
   OLLAMA
══════════════════════════════════════════════════════════ */
async function ollamaChat(url, model, messages) {
  const r = await fetch(`${url}/api/chat`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model, messages, stream:false }),
  });
  if (!r.ok) throw new Error(`Ollama ${r.status}`);
  return (await r.json()).message?.content ?? "";
}

function safeJSON(raw) {
  try { return JSON.parse((raw.match(/\{[\s\S]*\}/)||[])[0] ?? raw); }
  catch { return null; }
}

async function classifyStage(url, model, history, msg) {
  const sys = `You are a purchase-journey classifier. Analyze the conversation.
Return ONLY a JSON object — no markdown, no extra text:
{"stage":"one of [need_recognition,research,comparison,risk_evaluation,decision,post_purchase]","depth":1-7,"attribute":"main concern in 2 words","emotion":"one of [curious,anxious,confident,confused,excited,indifferent]","note":"10 words max"}`;
  const raw = await ollamaChat(url, model, [
    { role:"system", content:sys },
    ...history.slice(-6).map(m=>({ role:m.role, content:m.content })),
    { role:"user", content:msg }
  ]);
  return safeJSON(raw) ?? { stage:"research", depth:3, attribute:"general", emotion:"curious", note:"classified" };
}

/* 3-step agentic ad pipeline */
async function agentAd(url, model, product, category, ctx, onStep) {
  onStep("Selecting best product to advertise…");
  const s1 = await ollamaChat(url, model, [
    { role:"system", content:'Pick ONE specific well-known product. Return ONLY JSON: {"product_name":"...","brand":"...","search_query":"..."}' },
    { role:"user",   content:`User researching: ${product}. Category: ${category}. Context: ${ctx}` }
  ]);
  const pick = safeJSON(s1) ?? { product_name:product, brand:"Top Brand", search_query:`best ${product}` };

  onStep("Fetching live product data…");
  let web = "";
  try {
    const q = encodeURIComponent(pick.search_query || `best ${product}`);
    const d = await (await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`)).json();
    web = [d.AbstractText, ...(d.RelatedTopics||[]).slice(0,4).map(t=>t.Text||"")].filter(Boolean).join(" | ").slice(0,600);
  } catch { web = `${pick.brand} ${pick.product_name} — popular in ${category}.`; }

  onStep("Writing ad copy…");
  const s3 = await ollamaChat(url, model, [
    { role:"system", content:`Write a product ad. Return ONLY JSON no markdown:
{"product_name":"...","brand":"...","price":"realistic price","tagline":"≤8 words","key_features":["f1","f2","f3","f4"],"why_relevant":"1 sentence","badge":"one of [BestSeller,TopRated,NewArrival,Limited,Trending]","cta":"3-4 words"}` },
    { role:"user",   content:`Product: ${pick.product_name} by ${pick.brand}. Web: ${web}. Context: ${ctx}` }
  ]);
  return safeJSON(s3) ?? {
    product_name:pick.product_name, brand:pick.brand, price:"Check latest price",
    tagline:"Highly rated by buyers like you",
    key_features:["Quality build","Great value","Top reviews","Fast delivery"],
    why_relevant:`Matches your interest in ${product}`, badge:"TopRated", cta:"View Details"
  };
}

/* ══════════════════════════════════════════════════════════
   GOOGLE SHEETS — silent background POST
══════════════════════════════════════════════════════════ */
// Send ONE turn at a time as flat URL params — avoids GET length limits
async function pushTurnToSheet(scriptUrl, session, turn) {
  if (!scriptUrl) return;
  const p = new URLSearchParams({
    session_id:         session.id,
    product:            session.product,
    category:           session.category,
    ad_target_turn:     String(session.ad_target_turn),
    turn_id:            String(turn.turn_id),
    ts:                 turn.ts,
    user_prompt:        (turn.user_prompt   || "").slice(0, 800),
    assistant_response: (turn.assistant_response || "").slice(0, 800),
    stage:              turn.stage,
    depth:              String(turn.depth),
    attribute:          turn.attribute || "",
    emotion:            turn.emotion   || "",
    reasoning:          turn.note      || "",
    ad_shown:           turn.ad_shown ? "1" : "0",
    ad_product:         turn.ad_shown ? (session.ad?.product_name ?? "") : "",
    ad_brand:           turn.ad_shown ? (session.ad?.brand  ?? "") : "",
    ad_price:           turn.ad_shown ? (session.ad?.price  ?? "") : "",
    ad_stage:           turn.ad_shown ? turn.stage : "",
    ad_depth:           turn.ad_shown ? String(turn.depth) : "",
  });
  try {
    await fetch(`${scriptUrl}?${p.toString()}`, { method:"GET", mode:"no-cors" });
  } catch(_) {}
}

async function pushToSheet(scriptUrl, session) {
  if (!scriptUrl) return { ok:false, reason:"no_url" };
  try {
    const lastTurn = session.turns.at(-1);
    if (lastTurn) await pushTurnToSheet(scriptUrl, session, lastTurn);
    return { ok:true };
  } catch(e) {
    return { ok:false, reason:e.message };
  }
}

/* ══════════════════════════════════════════════════════════
   CSV FALLBACK
══════════════════════════════════════════════════════════ */
const CSV_HEADERS = [
  "session_id","product","category","ad_target_turn",
  "turn_id","ts","user_prompt","assistant_response",
  "stage","depth","attribute","emotion","reasoning",
  "ad_shown","ad_product","ad_brand","ad_price","ad_stage","ad_depth"
];

function buildCSV(s) {
  const e = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const rows = s.turns.map(t=>[
    s.id,s.product,s.category,s.ad_target_turn,
    t.turn_id,t.ts,t.user_prompt,t.assistant_response,
    t.stage,t.depth,t.attribute,t.emotion,t.note,
    t.ad_shown?1:0,
    t.ad_shown?(s.ad?.product_name??""):"",
    t.ad_shown?(s.ad?.brand??""):"",
    t.ad_shown?(s.ad?.price??""):"",
    t.ad_shown?t.stage:"",
    t.ad_shown?t.depth:"",
  ].map(e).join(","));
  return [CSV_HEADERS.join(","),...rows].join("\n");
}

function downloadCSV(s) {
  const b = new Blob([buildCSV(s)],{type:"text/csv;charset=utf-8;"});
  const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(b),download:`PJL_${s.id}.csv`});
  a.click(); URL.revokeObjectURL(a.href);
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function Toast({ msg, type }) {
  if (!msg) return null;
  const colors = { ok:"var(--green)", error:"var(--red)", info:"var(--acc)", sending:"var(--amber)" };
  return (
    <div style={{
      position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)",
      background:"var(--L3)", border:`1px solid ${colors[type]||colors.info}`,
      borderRadius:10, padding:"11px 22px", zIndex:2000,
      display:"flex", alignItems:"center", gap:9,
      boxShadow:"0 8px 32px rgba(0,0,0,.5)",
      animation:"toast 3.5s ease forwards"
    }}>
      <div style={{ width:7,height:7,borderRadius:"50%",background:colors[type]||colors.info, flexShrink:0,
        animation:type==="sending"?"pulse 1s infinite":"none" }} />
      <span style={{ fontFamily:"var(--mono)",fontSize:12,color:"rgba(232,230,240,.85)" }}>{msg}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONFIG MODAL
══════════════════════════════════════════════════════════ */
function ConfigModal({ cfg, setCfg, onClose }) {
  const [st, setSt] = useState("idle");
  const [ms, setMs] = useState([]);

  async function testOllama() {
    setSt("checking");
    try {
      const r = await fetch(`${cfg.url}/api/tags`);
      if (r.ok) { setMs((await r.json()).models?.map(m=>m.name)||[]); setSt("ok"); }
      else setSt("fail");
    } catch { setSt("fail"); }
  }

  async function testSheet() {
    if (!cfg.sheetUrl) return;
    setSt("sheet_checking");
    try {
      await fetch(cfg.sheetUrl, { mode:"no-cors" });
      setSt("sheet_ok");
    } catch { setSt("sheet_fail"); }
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(5,5,10,.88)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div className="fu" style={{ width:500,background:"var(--L2)",border:"1px solid var(--bd2)",borderRadius:18,padding:38,boxShadow:"0 32px 80px rgba(0,0,0,.65)",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ fontFamily:"var(--head)",fontSize:22,fontWeight:700,marginBottom:6 }}>Configuration</div>
        <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--mut)",letterSpacing:1.5,marginBottom:26 }}>OLLAMA · GOOGLE SHEETS</div>

        {/* Ollama section */}
        <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--acc)",letterSpacing:1.5,marginBottom:14 }}>OLLAMA (LOCAL LLM)</div>
        <div style={{ background:"rgba(245,166,35,.07)",border:"1px solid rgba(245,166,35,.22)",borderRadius:10,padding:13,marginBottom:18,fontSize:12,color:"rgba(245,166,35,.9)",lineHeight:1.7 }}>
          Start with CORS:<br/>
          <code style={{ fontFamily:"var(--mono)",fontSize:11 }}>OLLAMA_ORIGINS=* ollama serve</code>
        </div>
        {[["Ollama URL","url","http://localhost:11434"],["Model","model","llama3"]].map(([l,k,p])=>(
          <div key={k} style={{ marginBottom:14 }}>
            <label className="lbl">{l}</label>
            <input className="inp" value={cfg[k]} placeholder={p} onChange={e=>setCfg(c=>({...c,[k]:e.target.value}))} />
          </div>
        ))}
        {ms.length>0&&(
          <div style={{ marginBottom:14 }}>
            <label className="lbl">Available models</label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {ms.map(m=><button key={m} className={`chip ${cfg.model===m?"on":""}`} onClick={()=>setCfg(c=>({...c,model:m}))} style={{ fontFamily:"var(--mono)",fontSize:11 }}>{m}</button>)}
            </div>
          </div>
        )}
        <div style={{ display:"flex",gap:10,marginBottom:26 }}>
          <button onClick={testOllama} className="btn-g" style={{ flex:1 }}>{st==="checking"?"Testing…":"Test Ollama"}</button>
          {st==="ok"&&<span style={{ fontSize:12,color:"var(--green)",alignSelf:"center" }}>✓ Connected</span>}
          {st==="fail"&&<span style={{ fontSize:12,color:"var(--red)",alignSelf:"center" }}>✗ Failed</span>}
        </div>

        {/* Google Sheets section */}
        <div style={{ height:1,background:"var(--bd)",marginBottom:22 }} />
        <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--green)",letterSpacing:1.5,marginBottom:14 }}>GOOGLE SHEETS (DATA STORE)</div>

        <div style={{ background:"rgba(62,207,142,.06)",border:"1px solid rgba(62,207,142,.2)",borderRadius:10,padding:14,marginBottom:18,fontSize:12,color:"rgba(62,207,142,.85)",lineHeight:1.8 }}>
          <strong>Setup (2 min):</strong><br/>
          1. Create a new Google Sheet<br/>
          2. Click <strong>Extensions → Apps Script</strong><br/>
          3. Paste the <code style={{ fontFamily:"var(--mono)",fontSize:11 }}>apps_script.js</code> file contents<br/>
          4. Click <strong>Deploy → New deployment</strong><br/>
          5. Type: <strong>Web App</strong> · Access: <strong>Anyone</strong><br/>
          6. Copy the Web App URL → paste below
        </div>

        <div style={{ marginBottom:14 }}>
          <label className="lbl">Apps Script Web App URL</label>
          <input className="inp" value={cfg.sheetUrl||""} placeholder="https://script.google.com/macros/s/…/exec"
            onChange={e=>setCfg(c=>({...c,sheetUrl:e.target.value}))} />
        </div>
        <div style={{ display:"flex",gap:10,marginBottom:8 }}>
          <button onClick={testSheet} className="btn-g" style={{ flex:1 }} disabled={!cfg.sheetUrl}>
            {st==="sheet_checking"?"Testing…":"Test Sheet URL"}
          </button>
          {st==="sheet_ok"&&<span style={{ fontSize:12,color:"var(--green)",alignSelf:"center" }}>✓ Reachable</span>}
          {st==="sheet_fail"&&<span style={{ fontSize:12,color:"var(--mut)",alignSelf:"center",fontSize:11 }}>no-cors — deploy and try</span>}
        </div>

        <button onClick={onClose} className="btn-p" style={{ width:"100%",marginTop:16 }}>Save & Close</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   JOURNEY SIDEBAR
══════════════════════════════════════════════════════════ */
function Sidebar({ stage, depth, turns, adTurn, adTargetTurn, syncStatus }) {
  const ai = SKEYS.indexOf(stage);
  const syncColors = { idle:"var(--dim)", sending:"var(--amber)", ok:"var(--green)", error:"var(--red)" };
  const syncLabels = { idle:"Not yet synced", sending:"Syncing to Sheets…", ok:"Synced ✓", error:"Sync failed — CSV saved" };

  return (
    <div style={{ width:210,background:"var(--L1)",borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto" }}>
      <div style={{ padding:"22px 18px 14px" }}>
        <div style={{ fontFamily:"var(--mono)",fontSize:9,letterSpacing:2,color:"var(--dim)",marginBottom:5 }}>PURCHASE JOURNEY</div>
        <div style={{ fontFamily:"var(--head)",fontSize:16,fontWeight:700 }}>Stage Tracker</div>
      </div>
      <div style={{ height:1,background:"var(--bd)",margin:"0 18px" }} />

      <div style={{ padding:"18px 14px",flex:1 }}>
        {STAGES.map((s,i)=>{
          const past=i<ai, cur=i===ai;
          return (
            <div key={s.key} style={{ display:"flex",gap:11,alignItems:"flex-start",marginBottom:22,position:"relative" }}>
              {i<STAGES.length-1&&<div style={{ position:"absolute",left:12,top:27,width:2,height:22,background:past?s.color:"var(--bd)",transition:"background .5s" }} />}
              <div style={{ width:26,height:26,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,transition:"all .4s",
                background:cur?s.color:past?`${s.color}28`:"rgba(255,255,255,.04)",
                color:cur?"#fff":past?s.color:"var(--dim)",
                boxShadow:cur?`0 0 12px ${s.color}55`:"none",
                animation:cur?"glow 2.5s infinite":"none"
              }}>{past?"✓":s.glyph}</div>
              <div style={{ paddingTop:3 }}>
                <div style={{ fontSize:12,fontWeight:cur?600:400,color:cur?"#fff":past?"rgba(255,255,255,.48)":"var(--dim)",transition:"all .3s" }}>{s.short}</div>
                {cur&&<div style={{ fontFamily:"var(--mono)",fontSize:9,color:s.color,marginTop:1,letterSpacing:.5 }}>← active</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height:1,background:"var(--bd)",margin:"0 18px" }} />
      <div style={{ padding:"14px 18px 22px" }}>
        <div style={{ fontFamily:"var(--mono)",fontSize:9,letterSpacing:1.5,color:"var(--dim)",marginBottom:7 }}>DECISION DEPTH</div>
        <div style={{ height:4,background:"rgba(255,255,255,.07)",borderRadius:4,overflow:"hidden",marginBottom:4 }}>
          <div style={{ height:"100%",width:`${(depth/7)*100}%`,background:"linear-gradient(90deg,var(--acc),var(--green))",borderRadius:4,transition:"width .6s cubic-bezier(.22,.68,0,1)" }} />
        </div>
        <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--mut)",marginBottom:16 }}>{depth} / 7</div>

        {[["TURNS",`${turns}`],["AD TARGET",`Turn ${adTargetTurn}`],["AD PLACED",adTurn?`Turn ${adTurn} ✓`:"Pending"]].map(([k,v])=>(
          <div key={k} style={{ display:"flex",justifyContent:"space-between",marginBottom:9 }}>
            <span style={{ fontFamily:"var(--mono)",fontSize:9,letterSpacing:1.5,color:"var(--dim)" }}>{k}</span>
            <span style={{ fontFamily:"var(--mono)",fontSize:10,color:k==="AD PLACED"&&adTurn?"var(--green)":"var(--mut)",fontWeight:500 }}>{v}</span>
          </div>
        ))}

        {/* Sync status */}
        <div style={{ marginTop:14,padding:"9px 11px",borderRadius:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:7 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:syncColors[syncStatus]||syncColors.idle,
              animation:syncStatus==="sending"?"pulse 1s infinite":"none",flexShrink:0 }} />
            <span style={{ fontFamily:"var(--mono)",fontSize:9,color:syncColors[syncStatus]||syncColors.idle,lineHeight:1.5 }}>
              {syncLabels[syncStatus]||syncLabels.idle}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AD CARD
══════════════════════════════════════════════════════════ */
function AdCard({ ad, stage, depth }) {
  const s = STAGES.find(x=>x.key===stage)||STAGES[1];
  return (
    <div className="adp" style={{ margin:"4px 0 16px" }}>
      <div style={{ background:"linear-gradient(135deg,rgba(245,166,35,.09),rgba(245,166,35,.04))",border:"1.5px solid rgba(245,166,35,.3)",borderRadius:16,padding:22,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-25,right:-25,width:120,height:120,background:"radial-gradient(circle,rgba(245,166,35,.13),transparent 70%)",pointerEvents:"none" }} />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:"var(--amber)",animation:"pulse 2s infinite" }} />
            <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--amber)",letterSpacing:2 }}>SPONSORED</span>
          </div>
          <div style={{ display:"flex",gap:7,alignItems:"center" }}>
            <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"rgba(255,255,255,.2)" }}>{s.short} · d{depth}</span>
            {ad.badge&&<span style={{ fontFamily:"var(--mono)",fontSize:9,padding:"3px 8px",borderRadius:6,background:"rgba(62,207,142,.1)",color:"var(--green)",border:"1px solid rgba(62,207,142,.22)" }}>{ad.badge}</span>}
          </div>
        </div>
        <div style={{ fontFamily:"var(--head)",fontSize:20,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:3 }}>{ad.product_name}</div>
        <div style={{ fontSize:13,color:"var(--mut)",marginBottom:12 }}>
          by <strong style={{ color:"rgba(255,255,255,.6)" }}>{ad.brand}</strong> · <span style={{ color:"var(--amber)",fontWeight:600 }}>{ad.price}</span>
        </div>
        <div style={{ fontSize:14,color:"rgba(232,230,240,.65)",fontStyle:"italic",marginBottom:13,lineHeight:1.5 }}>"{ad.tagline}"</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:15 }}>
          {(ad.key_features||[]).map((f,i)=>(
            <span key={i} style={{ fontSize:11,padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",color:"rgba(232,230,240,.65)" }}>✓ {f}</span>
          ))}
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
          <div style={{ fontSize:12,color:"var(--mut)",flex:1 }}>{ad.why_relevant}</div>
          <button style={{ padding:"10px 22px",borderRadius:9,background:"var(--amber)",color:"#000",fontWeight:700,fontSize:13,border:"none",cursor:"pointer",flexShrink:0,transition:"all .15s" }}
            onMouseEnter={e=>{e.target.style.transform="translateY(-1px)";e.target.style.boxShadow="0 4px 16px rgba(245,166,35,.4)"}}
            onMouseLeave={e=>{e.target.style.transform="";e.target.style.boxShadow=""}}>
            {ad.cta} →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RIGHT PANEL
══════════════════════════════════════════════════════════ */
function RightPanel({ session, model, onManualCSV }) {
  return (
    <div style={{ width:230,background:"var(--L1)",borderLeft:"1px solid var(--bd)",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto" }}>
      <div style={{ padding:"22px 16px 14px" }}>
        <div style={{ fontFamily:"var(--mono)",fontSize:9,letterSpacing:2,color:"var(--dim)",marginBottom:5 }}>LIVE DATA</div>
        <div style={{ fontFamily:"var(--head)",fontSize:16,fontWeight:700 }}>Session Log</div>
      </div>
      <div style={{ height:1,background:"var(--bd)",margin:"0 16px" }} />

      <div style={{ padding:"14px 16px",flex:1 }}>
        {[["Product",session.product||"—"],["Category",session.category||"—"],["LLM",model]].map(([k,v])=>(
          <div key={k} style={{ marginBottom:12 }}>
            <div style={{ fontFamily:"var(--mono)",fontSize:9,letterSpacing:1.5,color:"var(--dim)",marginBottom:3 }}>{k}</div>
            <div style={{ fontSize:11,color:"var(--mut)",wordBreak:"break-word",lineHeight:1.4 }}>{v}</div>
          </div>
        ))}

        <div style={{ height:1,background:"var(--bd)",margin:"10px 0 14px" }} />
        <div style={{ fontFamily:"var(--mono)",fontSize:9,letterSpacing:1.5,color:"var(--dim)",marginBottom:9 }}>TURN LOG</div>
        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
          {session.turns.length===0&&<div style={{ fontSize:11,color:"var(--dim)",fontStyle:"italic" }}>No turns yet…</div>}
          {session.turns.slice(-10).map((t,i)=>{
            const s=STAGES.find(x=>x.key===t.stage)||STAGES[0];
            return (
              <div key={i} className="sr" style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderRadius:7,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.05)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <div style={{ width:5,height:5,borderRadius:"50%",background:s.color,flexShrink:0 }} />
                  <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"rgba(255,255,255,.42)" }}>{s.short}</span>
                </div>
                <div style={{ display:"flex",gap:5,alignItems:"center" }}>
                  <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"rgba(255,255,255,.22)" }}>d{t.depth}</span>
                  <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"rgba(255,255,255,.22)" }}>{t.emotion?.slice(0,4)}</span>
                  {t.ad_shown&&<span style={{ fontFamily:"var(--mono)",fontSize:8,color:"var(--amber)",padding:"1px 5px",borderRadius:4,border:"1px solid rgba(245,166,35,.3)" }}>AD</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding:"14px 16px 22px",borderTop:"1px solid var(--bd)" }}>
        <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)",marginBottom:10,lineHeight:1.7 }}>
          Auto-synced to Google Sheets<br/>at session end.
        </div>
        <button onClick={onManualCSV} className="btn-g" style={{ width:"100%",fontSize:12,padding:"10px 14px" }} disabled={session.turns.length===0}>
          ↓ Also Save CSV
        </button>
        <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)",textAlign:"center",marginTop:8,lineHeight:1.6 }}>
          {session.turns.length} turn{session.turns.length!==1?"s":""}
          {session.ad?" · ad captured":" · ad pending"}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SETUP SCREEN
══════════════════════════════════════════════════════════ */
function SetupScreen({ onStart, cfg }) {
  const [f, setF] = useState({ product:"", category:"" });
  const ok = f.product.trim() && f.category;
  const sheetReady = !!cfg.sheetUrl;

  return (
    <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24,overflowY:"auto" }}>
      <div className="fu" style={{ width:"100%",maxWidth:500 }}>
        <div style={{ textAlign:"center",marginBottom:40 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:9,padding:"7px 16px",borderRadius:30,background:"rgba(124,141,255,.1)",border:"1px solid rgba(124,141,255,.22)",marginBottom:20 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"var(--acc)",animation:"pulse 2s infinite" }} />
            <span style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--acc)",letterSpacing:1.2 }}>PURCHASE JOURNEY RESEARCH</span>
          </div>
          <h1 style={{ fontFamily:"var(--head)",fontSize:40,fontWeight:800,lineHeight:1.08,marginBottom:14,letterSpacing:"-1px" }}>
            Journey Lab
          </h1>
          <p style={{ fontSize:14,color:"var(--mut)",lineHeight:1.85,maxWidth:380,margin:"0 auto" }}>
            Chat with a local AI about any product you're considering.
            We study where in your decision journey ads land best.
          </p>
        </div>

        {!sheetReady&&(
          <div style={{ background:"rgba(245,166,35,.07)",border:"1px solid rgba(245,166,35,.22)",borderRadius:12,padding:14,marginBottom:20,fontSize:12,color:"rgba(245,166,35,.88)",lineHeight:1.7,display:"flex",gap:10,alignItems:"flex-start" }}>
            <span style={{ fontSize:16,flexShrink:0 }}>⚠</span>
            <span>Google Sheets URL not set. Data will only be available as CSV download. Open <strong>⚙ Config</strong> to connect your Sheet.</span>
          </div>
        )}

        <div style={{ background:"var(--L2)",border:"1px solid var(--bd2)",borderRadius:18,padding:34 }}>
          <div style={{ marginBottom:20 }}>
            <label className="lbl">What are you thinking of buying?</label>
            <input className="inp" placeholder="e.g. wireless headphones, travel insurance, running shoes…" value={f.product} onChange={e=>setF(x=>({...x,product:e.target.value}))} />
            <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)",marginTop:6 }}>Be as specific or general as you like</div>
          </div>
          <div style={{ marginBottom:30 }}>
            <label className="lbl">Category</label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {CATS.map(c=><button key={c} className={`chip ${f.category===c?"on":""}`} onClick={()=>setF(x=>({...x,category:c}))}>{c}</button>)}
            </div>
          </div>
          <button className="btn-p" style={{ width:"100%",fontSize:15,padding:"14px" }} onClick={()=>onStart(f)} disabled={!ok}>
            Begin Research Session →
          </button>
          <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)",textAlign:"center",marginTop:12,lineHeight:1.7 }}>
            {sheetReady
              ? <span>Data → <span style={{ color:"var(--green)" }}>Google Sheets (auto)</span> + CSV</span>
              : <span>Data → <span style={{ color:"var(--amber)" }}>CSV only</span> (Sheet not configured)</span>
            }<br/>
            LLM: <span style={{ color:"var(--acc)" }}>{cfg.model}</span> on <span style={{ color:"var(--mut)" }}>{cfg.url}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHAT SCREEN
══════════════════════════════════════════════════════════ */
function ChatScreen({ session, setSession, cfg, onSyncDone }) {
  const [inp, setInp]   = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState([]);
  const endRef = useRef(null);
  const txRef  = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); }, [session.turns, busy]);

  const addStep = s => setSteps(p=>[...p,s]);

  async function send() {
    if (!inp.trim()||busy) return;
    const msg = inp.trim();
    setInp(""); setBusy(true); setSteps([]);

    const history = session.turns.flatMap(t=>[
      { role:"user",      content:t.user_prompt },
      { role:"assistant", content:t.assistant_response }
    ]);

    try {
      addStep("Generating response…");
      const [reply, cls] = await Promise.all([
        ollamaChat(cfg.url, cfg.model, [
          { role:"system", content:`You are a concise, knowledgeable product research assistant. The user is researching: "${session.product}" (${session.category}). Be specific, practical, and helpful.` },
          ...history,
          { role:"user", content:msg }
        ]),
        classifyStage(cfg.url, cfg.model, history, msg)
      ]);

      const turnNum  = session.turns.length + 1;
      const isAdTurn = turnNum === session.ad_target_turn;

      let adData = session.ad;
      if (isAdTurn && !adData) {
        const ctx = [...history.slice(-4).map(m=>m.content), msg].join(" ").slice(0,400);
        adData = await agentAd(cfg.url, cfg.model, session.product, session.category, ctx, addStep);
      }

      const newTurn = {
        turn_id: turnNum, ts: new Date().toISOString(),
        user_prompt: msg, assistant_response: reply,
        stage: cls.stage||"research", depth: cls.depth||3,
        attribute: cls.attribute||"", emotion: cls.emotion||"curious", note: cls.note||"",
        ad_shown: isAdTurn,
      };

      const newSession = {
        ...session,
        turns:   [...session.turns, newTurn],
        stage:   newTurn.stage,
        depth:   newTurn.depth,
        ad:      adData ?? session.ad,
        ad_turn: isAdTurn ? turnNum : session.ad_turn,
      };

      setSession(newSession);

      // Auto-push to Sheets — URL hardcoded so it always fires
      const SHEET_URL = "https://script.google.com/macros/s/AKfycbzAzbwv45PrzJG7QSx4Qdvnxnzu9eKs0SzPCqCc80Zy-eJmyHHOmOHjNYUYDiYgw_s/exec";
      onSyncDone("sending");
      pushToSheet(SHEET_URL, newSession).then(res => {
        onSyncDone(res.ok ? "ok" : "error");
      });

    } catch(err) {
      setSession(s=>({ ...s, turns:[...s.turns,{
        turn_id:s.turns.length+1, ts:new Date().toISOString(),
        user_prompt:msg, assistant_response:`⚠ ${err.message}`,
        stage:"research", depth:3, attribute:"", emotion:"confused", note:"error", ad_shown:false
      }]}));
    }
    setSteps([]); setBusy(false);
  }

  const curS = STAGES.find(s=>s.key===session.stage)||STAGES[0];

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"12px 22px",borderBottom:"1px solid var(--bd)",display:"flex",alignItems:"center",gap:14,flexShrink:0,background:"var(--L1)" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"var(--head)",fontSize:15,fontWeight:700 }}>{session.product}</div>
          <div style={{ fontSize:11,color:"var(--mut)" }}>{session.category}</div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 13px",borderRadius:9,background:"var(--L3)",border:"1px solid var(--bd2)" }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:curS.color,boxShadow:`0 0 8px ${curS.color}` }} />
          <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"rgba(255,255,255,.72)",fontWeight:500 }}>{curS.label}</span>
          <span style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--dim)" }}>·d{session.depth}</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1,overflowY:"auto",padding:"24px 26px" }}>
        {session.turns.length===0&&(
          <div className="fi" style={{ textAlign:"center",padding:"36px 20px" }}>
            <div style={{ fontSize:34,marginBottom:14 }}>🔍</div>
            <div style={{ fontFamily:"var(--head)",fontSize:18,fontWeight:700,marginBottom:8 }}>Start your research</div>
            <div style={{ fontSize:13,color:"var(--mut)",lineHeight:1.85,maxWidth:380,margin:"0 auto 24px" }}>
              Ask anything about <strong style={{ color:"rgba(255,255,255,.7)" }}>{session.product}</strong>. 
              A sponsored product will appear at a random point. Every message is logged silently to Google Sheets.
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center" }}>
              {[`What's the best ${session.product}?`,`Compare top ${session.product} brands`,`What should I look for in a ${session.product}?`,`Is ${session.product} worth it?`]
                .map(s=><button key={s} onClick={()=>{setInp(s);txRef.current?.focus();}} className="chip" style={{ fontSize:12 }}>{s}</button>)}
            </div>
          </div>
        )}

        {session.turns.map((t,i)=>(
          <div key={i}>
            {/* User */}
            <div className="fu" style={{ display:"flex",justifyContent:"flex-end",marginBottom:8 }}>
              <div style={{ maxWidth:"72%",padding:"12px 16px",borderRadius:"16px 16px 4px 16px",background:"linear-gradient(135deg,var(--acc),var(--accD))",color:"#fff",fontSize:14,lineHeight:1.65 }}>
                {t.user_prompt}
              </div>
            </div>
            {/* Stage micro-tag */}
            <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:t.ad_shown?10:6 }}>
              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                <div style={{ width:4,height:4,borderRadius:"50%",background:(STAGES.find(s=>s.key===t.stage)||STAGES[0]).color }} />
                <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"rgba(255,255,255,.2)" }}>
                  {(STAGES.find(s=>s.key===t.stage)||STAGES[0]).short} · d{t.depth} · {t.emotion}
                </span>
              </div>
            </div>
            {/* Ad card */}
            {t.ad_shown&&session.ad&&<AdCard ad={session.ad} stage={t.stage} depth={t.depth} />}
            {/* Assistant */}
            <div className="fu" style={{ display:"flex",justifyContent:"flex-start",marginBottom:22 }}>
              <div style={{ display:"flex",gap:10,maxWidth:"82%",alignItems:"flex-start" }}>
                <div style={{ width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,var(--L3),rgba(124,141,255,.18))",border:"1px solid var(--bd2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14 }}>◈</div>
                <div style={{ padding:"12px 16px",borderRadius:"4px 16px 16px 16px",background:"var(--L3)",border:"1px solid var(--bd)",fontSize:14,lineHeight:1.72,color:"rgba(232,230,240,.82)",whiteSpace:"pre-wrap" }}>
                  {t.assistant_response}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading */}
        {busy&&(
          <div>
            {steps.length>0&&(
              <div style={{ marginBottom:8,paddingLeft:38 }}>
                {steps.map((s,i)=>(
                  <div key={i} className="sr" style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--amber)",marginBottom:4,display:"flex",alignItems:"center",gap:7 }}>
                    <div style={{ width:4,height:4,borderRadius:"50%",background:"var(--amber)",animation:"pulse 1.2s infinite" }} />
                    {s}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
              <div style={{ width:28,height:28,borderRadius:8,background:"var(--L3)",border:"1px solid var(--bd2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14 }}>◈</div>
              <div style={{ padding:"14px 16px",borderRadius:"4px 16px 16px 16px",background:"var(--L3)",border:"1px solid var(--bd)",display:"flex",gap:5,alignItems:"center" }}>
                {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"var(--acc)",animation:`shimmer .85s ${i*.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding:"14px 22px 18px",borderTop:"1px solid var(--bd)",flexShrink:0 }}>
        <div style={{ display:"flex",gap:9,background:"var(--L2)",border:"1px solid var(--bd2)",borderRadius:13,padding:"8px 8px 8px 16px",transition:"border .15s",boxShadow:"0 2px 18px rgba(0,0,0,.28)" }}
          onFocusCapture={e=>e.currentTarget.style.borderColor="var(--acc)"}
          onBlurCapture={e=>e.currentTarget.style.borderColor="var(--bd2)"}>
          <textarea ref={txRef} value={inp} onChange={e=>setInp(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
            placeholder={`Ask about ${session.product}…  (Enter to send)`}
            rows={1} style={{ flex:1,background:"transparent",border:"none",resize:"none",color:"var(--txt)",fontSize:14,fontFamily:"'Epilogue',sans-serif",lineHeight:1.55,maxHeight:130,overflowY:"auto",padding:"5px 0" }} />
          <button onClick={send} disabled={!inp.trim()||busy}
            style={{ width:40,height:40,borderRadius:9,flexShrink:0,border:"none",
              background:inp.trim()&&!busy?"var(--acc)":"rgba(255,255,255,.06)",
              color:inp.trim()&&!busy?"#fff":"var(--dim)",
              fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s" }}>→</button>
        </div>
        <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)",textAlign:"center",marginTop:7 }}>
          Ad randomised to turn {session.ad_target_turn} · Stage classified silently · Each turn auto-saved to Sheets
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function App() {
  const [cfg, setCfg]         = useState({ url:"http://localhost:11434", model:"llama3", sheetUrl:"https://script.google.com/macros/s/AKfycbzAzbwv45PrzJG7QSx4Qdvnxnzu9eKs0SzPCqCc80Zy-eJmyHHOmOHjNYUYDiYgw_s/exec" });
  const [showCfg, setShowCfg] = useState(false);
  const [session, setSession] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [toast, setToast]     = useState(null);

  function showToast(msg, type="info") {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3600);
  }

  function onSyncDone(status) {
    setSyncStatus(status);
    if (status==="ok")    showToast("Session saved to Google Sheets ✓", "ok");
    if (status==="error") showToast("Sheets sync failed — download CSV as backup", "error");
    if (status==="sending") showToast("Syncing to Google Sheets…", "sending");
  }

  function startSession(form) {
    const adTarget = Math.floor(Math.random() * 6) + 3; // turns 3–8 random
    setSyncStatus("idle");
    setSession({
      id:             `PJL_${Date.now()}`,
      product:        form.product,
      category:       form.category,
      started_at:     new Date().toISOString(),
      ad_target_turn: adTarget,
      turns:          [],
      stage:          "need_recognition",
      depth:          1,
      ad:             null,
      ad_turn:        null,
    });
  }

  return (
    <>
      <style>{CSS}</style>
      {showCfg&&<ConfigModal cfg={cfg} setCfg={setCfg} onClose={()=>setShowCfg(false)} />}
      {toast&&<Toast msg={toast.msg} type={toast.type} />}

      <div style={{ height:"100vh",display:"flex",flexDirection:"column",background:"var(--bg)" }}>
        {/* Topnav */}
        <div style={{ height:50,background:"var(--L1)",borderBottom:"1px solid var(--bd)",display:"flex",alignItems:"center",paddingInline:22,gap:14,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,flex:1 }}>
            <div style={{ width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,var(--acc),var(--accD))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700 }}>◈</div>
            <span style={{ fontFamily:"var(--head)",fontWeight:700,fontSize:15 }}>PurchaseJourney Lab</span>
            <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--dim)",letterSpacing:1.5,marginLeft:2 }}>AD PLACEMENT RESEARCH</span>
          </div>
          {/* Sheet status indicator */}
          <div style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 11px",borderRadius:7,background:"rgba(255,255,255,.03)",border:"1px solid var(--bd)" }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:cfg.sheetUrl?"var(--green)":"var(--amber)" }} />
            <span style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--mut)" }}>{cfg.sheetUrl?"Sheets connected":"No Sheet"}</span>
          </div>
          {session&&<button onClick={()=>setSession(null)} className="btn-g" style={{ fontSize:12,padding:"6px 13px" }}>+ New Session</button>}
          <button onClick={()=>setShowCfg(true)} className="btn-g" style={{ fontSize:12,padding:"6px 13px" }}>⚙ {cfg.model}</button>
        </div>

        {/* Body */}
        <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
          {!session ? (
            <SetupScreen onStart={startSession} cfg={cfg} />
          ) : (
            <>
              <Sidebar stage={session.stage} depth={session.depth} turns={session.turns.length}
                adTurn={session.ad_turn} adTargetTurn={session.ad_target_turn} syncStatus={syncStatus} />
              <ChatScreen session={session} setSession={setSession} cfg={cfg} onSyncDone={onSyncDone} />
              <RightPanel session={session} model={cfg.model} onManualCSV={()=>downloadCSV(session)} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
