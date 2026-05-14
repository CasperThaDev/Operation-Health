import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TIER1_NICHES = ["Gym","Real Estate","Influencer"];
const TIER2_NICHES = ["Café","Salon","Clinic","Restaurant","Retail"];
const STATUS_OPTIONS = ["DM Sent","Trial Sent","Negotiating","Active","Closed","Ghost"];
const STATUS_COLORS  = {"DM Sent":"#ffcc00","Trial Sent":"#00ff88","Negotiating":"#ff8833","Active":"#00ccff","Closed":"#555","Ghost":"#ff2244"};
const TIER_COLORS    = {1:"#ffcc00",2:"#4488ff",3:"#888"};
const DM_TARGET      = 50;

const SERVICE_TIERS = [
  { id:"basic",   name:"BASIC EDIT",      sarPrice:1200, features:["4 Reels/month","48h delivery","Arabic captions"],                             color:"#4488ff", badge:"ENTRY" },
  { id:"growth",  name:"GROWTH RETAINER", sarPrice:2500, features:["8 Reels/month","Same-day delivery","Arabic + English captions","1 Ad edit"], color:"#00ff88", badge:"POPULAR" },
  { id:"premium", name:"PREMIUM RETAINER",sarPrice:5000, features:["Unlimited Reels","Priority same-day","Full ad package","Monthly strategy call","Dedicated editor"], color:"#ffcc00", badge:"PRO" },
];

const PHASES = [
  {n:1,focus:"Survival (4–7 Clients)",target:"3k–10k SAR"},
  {n:2,focus:"Scale / Retainers",     target:"10k–30k SAR"},
  {n:3,focus:"Digital Products",      target:"15k–50k SAR"},
  {n:4,focus:"Mini-Agency",           target:"100k SAR"},
];

const DM_SCRIPTS = {
  arabic:  {label:"Arabic DM",       rtl:true,  script:`السلام عليكم،\n\nشفت محتواكم وعندي فكرة تساعد في زيادة التفاعل على حساباتكم.\n\nأنا متخصص في مونتاج فيديوهات قصيرة للأعمال في السعودية — ريلز، تيك توك، وإعلانات.\n\nبعطيكم ٣ ريلز مجاناً تجربة بدون أي التزام.\n\nيهمكم نجرب؟`},
  english: {label:"English DM",      rtl:false, script:`Hey [Name],\n\nNoticed your content and think I can help you get way more engagement with short-form video.\n\nI'm a video editor specializing in Reels & TikToks for KSA businesses — fast turnaround, Arabic captions included.\n\nI'll edit 3 Reels for FREE, no strings attached.\n\nWorth a quick try?`},
  followup:{label:"Follow-Up (Day 3)",rtl:true,  script:`مرحبا [الاسم]،\n\nبس أتابع معاكم — هل فكرتوا بالموضوع؟\n\nالأوفر لسه موجودة، ٣ ريلز مجاناً.\n\n— [اسمك]`},
  close:   {label:"Trial Close",     rtl:false, script:`Hey [Name],\n\nGlad you liked the trial edits! 🎬\n\nBased on your content volume, I'd suggest the Growth Package:\n• 8 Reels/month • Same-day delivery • Arabic + English captions\n\nInvestment: [X] SAR/month.\n\nWant to lock it in this week?`},
};

const NON_NEGS = [
  {id:"n1",text:"Reply to ALL messages within 1 hour"},
  {id:"n2",text:"Send 50 DMs (Arabic first)"},
  {id:"n3",text:"Follow up every open lead (3-day rule)"},
  {id:"n4",text:"Deliver all promised edits same-day"},
  {id:"n5",text:"Ask for payment / close 1 deal"},
  {id:"n6",text:"Log every riyal spent today"},
];

const DEFAULT_TELEMETRY = [
  {id:1,date:"2025-03-02",health:1,dmsSent:50,delivery:1,finLogged:1,finDisc:1,note:""},
  {id:2,date:"2025-03-03",health:1,dmsSent:23,delivery:1,finLogged:1,finDisc:0,note:"Only 23 DMs — distracted"},
];
const DEFAULT_CLIENTS  = [
  {id:1,name:"Al-Nassr Gym",tier:1,niche:"Gym",status:"Trial Sent",lastContact:"03/02",followUp:"03/04",sar:2500,serviceTier:"growth",notes:"Loves fast edits"},
  {id:2,name:"Jeddah Café", tier:2,niche:"Café",status:"DM Sent",  lastContact:"03/02",followUp:"03/03",sar:1200,serviceTier:"basic", notes:"WhatsApp only"},
];
const DEFAULT_BUDGET   = [
  {id:1,cat:"Personal",name:"Rent/Utilities",     budget:2000,actual:2000},
  {id:2,cat:"Personal",name:"Groceries (No Apps)",budget:600, actual:430},
  {id:3,cat:"Work",    name:"Adobe/DaVinci/AI",   budget:300, actual:300},
  {id:4,cat:"Work",    name:"Cloud/Storage",      budget:150, actual:120},
];
const DEFAULT_PROPOSALS = [{id:1,client:"Al-Nassr Gym",value:2500,status:"Sent",date:"03/02",notes:"8 Reels/mo"}];
const DEFAULT_INVOICES  = [{id:1,client:"Al-Nassr Gym",amount:2500,status:"Pending",issued:"03/02",due:"03/09"}];

// Stable ISO date: always "YYYY-MM-DD", unaffected by locale or device region
function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}



// Debounced localStorage — writes only after 400ms of no changes (fixes memory leak / jank)
function useLocalState(key, def) {
  const [s, set] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
  });
  const timer = useRef(null);
  const setAndSync = useCallback((val) => {
    set(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(typeof val === "function" ? val : val)); } catch {}
    }, 400);
  }, [key]);
  // Flush on unmount
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return [s, setAndSync];
}

function useAnimNum(target, dur=600) {
  const [v,setV] = useState(target); const prev = useRef(target);
  useEffect(() => {
    const s=prev.current, t0=performance.now();
    const tick = now => { const t=Math.min((now-t0)/dur,1),e=t<.5?2*t*t:-1+(4-2*t)*t; setV(Math.round(s+(target-s)*e)); if(t<1) requestAnimationFrame(tick); else prev.current=target; };
    requestAnimationFrame(tick);
  },[target]);
  return v;
}

function useMobile() {
  const [m,setM] = useState(() => window.innerWidth < 700);
  useEffect(() => { const h=()=>setM(window.innerWidth<700); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return m;
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
// Outreach XP: full credit at 50 DMs, partial below (honest logging)
function dmXP(sent) { return Math.min(Math.round((sent/DM_TARGET)*100),100); }
function rowXP(r) {
  const parts = [r.health*100, dmXP(r.dmsSent??0), r.delivery*100, r.finLogged*100, r.finDisc*100];
  return Math.round(parts.reduce((a,b)=>a+b,0)/parts.length);
}
function xpColor(v) { return v===100?"#00ff88":v>=60?"#ffcc00":"#ff2244"; }

// Strict number parser — returns 0 for any non-numeric input
function safeNum(v, fallback=0) { const n=Number(String(v).replace(/[^0-9.-]/g,"")); return isFinite(n)?n:fallback; }

function exportCSV(data, filename) {
  if (!data.length) return;
  const keys=Object.keys(data[0]);
  const csv=[keys.join(","),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(","))].join("\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=filename; a.click();
}

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
const S = {
  // Responsive grid helper
  grid: (cols, gap=10) => ({display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap}),
  card: (accent="#fff") => ({padding:"14px 16px",background:"#090909",border:`1px solid ${accent}18`,borderRadius:8}),
  mono: (size=11,color="#ccc") => ({fontFamily:"monospace",fontSize:size,color}),
  label: {fontFamily:"monospace",fontSize:9,color:"#2a2a2a",letterSpacing:3,marginBottom:5},
  big: (color="#fff") => ({fontFamily:"'Bebas Neue',cursive",fontSize:34,color,lineHeight:1,textShadow:`0 0 16px ${color}44`}),
  row: {display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},
  input: {background:"#0d0d0d",border:"1px solid #222",color:"#fff",padding:"8px 10px",borderRadius:4,fontFamily:"monospace",fontSize:11},
  btn: (c="#00ff88",bg="") => ({padding:"8px 16px",borderRadius:4,cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700,background:bg||`${c}12`,border:`1px solid ${c}33`,color:c,transition:"all .15s"}),
};

function Bit({val,onClick}) {
  const [f,setF]=useState(false); const c=val?"#00ff88":"#ff2244";
  return <button onClick={()=>{if(onClick){setF(true);setTimeout(()=>setF(false),200);onClick();}}} style={{width:30,height:30,borderRadius:4,cursor:onClick?"pointer":"default",background:`${c}18`,border:`1.5px solid ${c}`,color:c,fontFamily:"monospace",fontWeight:900,fontSize:13,lineHeight:"30px",textAlign:"center",boxShadow:f?`0 0 18px ${c}`:`0 0 5px ${c}44`,transition:"all .18s",outline:"none",transform:f?"scale(1.18)":"scale(1)"}}>{val}</button>;
}

function Bar({pct,color="#00ff88",h=3,animate=true}) {
  const [w,setW]=useState(animate?0:pct);
  useEffect(()=>{if(animate){const t=setTimeout(()=>setW(Math.min(pct,100)),60);return()=>clearTimeout(t);} else setW(Math.min(pct,100));},[pct]);
  return <div style={{width:"100%",height:h,background:"#181818",borderRadius:2,overflow:"hidden"}}><div style={{width:`${w}%`,height:"100%",background:color,borderRadius:2,transition:animate?"width .7s cubic-bezier(.4,0,.2,1)":"none",boxShadow:`0 0 4px ${color}88`}}/></div>;
}

function NumInput({value,onChange,min=0,max,placeholder,style={}}) {
  const [raw,setRaw]=useState(String(value));
  // keep raw in sync when parent updates
  useEffect(()=>setRaw(String(value)),[value]);
  const commit=()=>{
    const n=safeNum(raw,min);
    const clamped=max!==undefined?Math.min(Math.max(n,min),max):Math.max(n,min);
    setRaw(String(clamped)); onChange(clamped);
  };
  return <input
    value={raw}
    placeholder={placeholder}
    onChange={e=>setRaw(e.target.value)}
    onBlur={commit}
    onKeyDown={e=>{if(e.key==="Enter")commit();}}
    style={{...S.input,...style}}
    inputMode="numeric"
  />;
}

function CopyBtn({text}) {
  const [c,setC]=useState(false);
  return <button onClick={()=>{navigator.clipboard.writeText(text).then(()=>{setC(true);setTimeout(()=>setC(false),2000)});}} style={S.btn(c?"#00ff88":"#444")}>{c?"✓ COPIED":"COPY"}</button>;
}

function Pill({label,color}) {
  return <span style={{fontSize:10,padding:"3px 9px",borderRadius:4,background:`${color}14`,color,border:`1px solid ${color}28`,fontFamily:"monospace",whiteSpace:"nowrap"}}>{label}</span>;
}

// ─── REVENUE TICKER ──────────────────────────────────────────────────────────
function RevTicker({clients}) {
  const active=clients.filter(c=>["Active","Trial Sent"].includes(c.status)).reduce((a,c)=>a+c.sar,0);
  const anim=useAnimNum(active); const prev=useRef(active); const [flash,setFlash]=useState(false);
  useEffect(()=>{if(prev.current!==active){setFlash(true);setTimeout(()=>setFlash(false),700);prev.current=active;}},[active]);
  return <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 12px",border:`1px solid ${flash?"#00ff8855":"#111"}`,borderRadius:20,background:flash?"#00ff8806":"transparent",transition:"all .3s"}}>
    <div style={{width:5,height:5,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 6px #00ff88",animation:"pulse 2s infinite"}}/>
    <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,color:flash?"#00ff88":"#2a2a2a",transition:"color .3s",letterSpacing:1}}>{anim.toLocaleString()} SAR/mo</span>
  </div>;
}

// ─── COMMAND PALETTE ─────────────────────────────────────────────────────────
function CmdPalette({onNav,onClose}) {
  const [q,setQ]=useState(""); const ref=useRef();
  useEffect(()=>ref.current?.focus(),[]);
  const cmds=[
    {l:"Telemetry — Daily Log",     icon:"📊",a:()=>onNav(0)},
    {l:"Agency — Client Pipeline",  icon:"🏢",a:()=>onNav(1)},
    {l:"Budget — Burn Rate",        icon:"💰",a:()=>onNav(2)},
    {l:"Proposals — Deals",         icon:"📋",a:()=>onNav(3)},
    {l:"Invoicing — Payments",      icon:"🧾",a:()=>onNav(4)},
    {l:"Service Tiers — Packages",  icon:"💎",a:()=>onNav(5)},
    {l:"Architecture — Rules",      icon:"⚙️",a:()=>onNav(6)},
    {l:"Export Telemetry CSV",      icon:"⬇️",a:()=>document.dispatchEvent(new CustomEvent("csv_telem"))},
    {l:"Export Clients CSV",        icon:"⬇️",a:()=>document.dispatchEvent(new CustomEvent("csv_clients"))},
    {l:"Export Invoices CSV",       icon:"⬇️",a:()=>document.dispatchEvent(new CustomEvent("csv_inv"))},
    {l:"Export Proposals CSV",      icon:"⬇️",a:()=>document.dispatchEvent(new CustomEvent("csv_prop"))},
  ].filter(c=>c.l.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",backdropFilter:"blur(4px)",zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"14vh"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(540px,92vw)",background:"#0a0a0a",border:"1px solid #00ff8838",borderRadius:12,overflow:"hidden",boxShadow:"0 40px 80px #000000ee"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",borderBottom:"1px solid #141414"}}>
          <span style={{color:"#2a2a2a",fontSize:15}}>⌘</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search commands..." style={{flex:1,background:"none",border:"none",outline:"none",fontFamily:"monospace",fontSize:13,color:"#fff"}} onKeyDown={e=>{if(e.key==="Escape")onClose();if(e.key==="Enter"&&cmds.length){cmds[0].a();onClose();}}}/>
          <kbd style={S.mono(9,"#2a2a2a")}>ESC</kbd>
        </div>
        <div style={{maxHeight:300,overflowY:"auto"}}>
          {cmds.map((c,i)=>(
            <div key={i} onClick={()=>{c.a();onClose();}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",cursor:"pointer",borderBottom:"1px solid #0a0a0a",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background="#141414"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span>{c.icon}</span><span style={S.mono(13,"#aaa")}>{c.l}</span>
            </div>
          ))}
          {!cmds.length&&<div style={{padding:20,...S.mono(11,"#2a2a2a"),textAlign:"center"}}>No commands found</div>}
        </div>
        <div style={{padding:"7px 16px",borderTop:"1px solid #0f0f0f",display:"flex",gap:14}}>
          {[["↵","select"],["↑↓","nav"],["Esc","close"]].map(([k,v])=>(
            <span key={k} style={S.mono(9,"#2a2a2a")}><kbd style={{background:"#141414",border:"1px solid #1e1e1e",borderRadius:3,padding:"1px 5px",color:"#3a3a3a"}}>{k}</kbd> {v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 1: TELEMETRY ────────────────────────────────────────────────────────
function Tab1({mobile}) {
  const [rows,setRows]   = useLocalState("v5_telem", DEFAULT_TELEMETRY);
  const [nnDone,setNnDone] = useLocalState("v5_nn",{});
  const today = isoToday(); // "YYYY-MM-DD" — stable across all locales and devices
  const [form,setForm]   = useState({date:today,health:0,dmsSent:0,delivery:0,finLogged:0,finDisc:0,note:""});
  const [editNote,setEditNote] = useState(null);
  const [delId,setDelId] = useState(null);
  const [committed,setCommitted] = useState(false);
  const nid = useRef(Date.now());

  useEffect(()=>{ if(localStorage.getItem("v5_nn_date")!==today){ setNnDone({}); localStorage.setItem("v5_nn_date",today); } },[today]);
  useEffect(()=>{ const h=()=>exportCSV(rows,"telemetry.csv"); document.addEventListener("csv_telem",h); return()=>document.removeEventListener("csv_telem",h); },[rows]);

  const avg     = rows.length ? Math.round(rows.reduce((a,r)=>a+rowXP(r),0)/rows.length) : 0;
  const animAvg = useAnimNum(avg);
  const streak  = useMemo(()=>{ let s=0; for(let i=rows.length-1;i>=0;i--){ if(rowXP(rows[i])>=80)s++; else break; } return s; },[rows]);
  const nnCount = NON_NEGS.filter(n=>nnDone[n.id]).length;

  const commit = () => {
    if (!form.date.trim()) return;
    setRows(rs=>[...rs,{id:nid.current++,...form,dmsSent:safeNum(form.dmsSent,0,DM_TARGET)}]);
    setForm({date:isoToday(),health:0,dmsSent:0,delivery:0,finLogged:0,finDisc:0,note:""});
    setCommitted(true); setTimeout(()=>setCommitted(false),2000);
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{...S.grid(mobile?2:4),marginBottom:16}}>
        {[
          {l:"AVG XP",      v:`${animAvg}%`,           c:xpColor(animAvg), s:animAvg>=80?"NOMINAL":"PATCH REQ"},
          {l:"DAYS LOGGED", v:rows.length,              c:"#00ccff",        s:"entries"},
          {l:"🔥 STREAK",   v:`${streak}d`,             c:"#ff8833",        s:streak>=3?"ON FIRE":"build it"},
          {l:"NON-NEGS",    v:`${nnCount}/${NON_NEGS.length}`, c:nnCount===NON_NEGS.length?"#00ff88":"#ffcc00", s:"today"},
        ].map(k=>(
          <div key={k.l} style={S.card(k.c)}>
            <div style={S.label}>{k.l}</div>
            <div style={S.big(k.c)}>{k.v}</div>
            <div style={{...S.mono(9,"#2a2a2a"),marginTop:4}}>{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 250px",gap:14}}>
        {/* Left: table + form */}
        <div>
          <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #141414",marginBottom:12}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:11,minWidth:500}}>
              <thead><tr style={{borderBottom:"1px solid #141414"}}>
                {["DATE","HEALTH","DMs SENT","DELIVERY","FIN LOG","FIN DISC","XP","NOTE",""].map(h=>(
                  <th key={h} style={{padding:"7px 8px",color:"#2a2a2a",textAlign:"left",fontSize:9,letterSpacing:2,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r,i)=>{
                  const rXP=rowXP(r); const dms=r.dmsSent??0;
                  return <tr key={r.id} style={{borderBottom:"1px solid #0c0c0c",animation:`rowIn .22s ease ${i*.03}s both`}}>
                    <td style={{padding:"8px 8px",color:"#555",fontWeight:700,whiteSpace:"nowrap"}}>{r.date}</td>
                    <td style={{padding:"8px 8px"}}><Bit val={r.health} onClick={()=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,health:x.health?0:1}:x))}/></td>
                    {/* DM counter cell with mini bar */}
                    <td style={{padding:"8px 8px",minWidth:80}}>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,color:dms>=DM_TARGET?"#00ff88":dms>20?"#ffcc00":"#ff2244"}}>{dms}<span style={{fontSize:10,color:"#333"}}>/{DM_TARGET}</span></span>
                        <Bar pct={(dms/DM_TARGET)*100} color={dms>=DM_TARGET?"#00ff88":dms>20?"#ffcc00":"#ff2244"}/>
                      </div>
                    </td>
                    {["delivery","finLogged","finDisc"].map(f=>(
                      <td key={f} style={{padding:"8px 8px"}}><Bit val={r[f]} onClick={()=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,[f]:x[f]?0:1}:x))}/></td>
                    ))}
                    <td style={{padding:"8px 8px",minWidth:80}}>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,color:xpColor(rXP)}}>{rXP}%</span>
                        <Bar pct={rXP} color={xpColor(rXP)}/>
                      </div>
                    </td>
                    <td style={{padding:"8px 8px",maxWidth:140}}>
                      {editNote===r.id
                        ?<input autoFocus value={r.note} onBlur={()=>setEditNote(null)} onChange={e=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,note:e.target.value}:x))} style={{...S.input,border:"1px solid #00ff8830",width:"100%",padding:"3px 7px",fontSize:10}}/>
                        :<span onClick={()=>setEditNote(r.id)} style={{...S.mono(10,r.note?"#555":"#1e1e1e"),cursor:"text",borderBottom:"1px dashed #1e1e1e"}}>{r.note||"add note…"}</span>
                      }
                    </td>
                    <td style={{padding:"8px 4px"}}>
                      {delId===r.id
                        ?<div style={{display:"flex",gap:3}}>
                          <button onClick={()=>{setRows(rs=>rs.filter(x=>x.id!==r.id));setDelId(null);}} style={{...S.btn("#ff2244"),padding:"2px 7px",fontSize:9}}>DEL</button>
                          <button onClick={()=>setDelId(null)} style={{...S.btn("#444"),padding:"2px 7px",fontSize:9}}>NO</button>
                        </div>
                        :<button onClick={()=>setDelId(r.id)} onMouseEnter={e=>e.target.style.color="#ff2244"} onMouseLeave={e=>e.target.style.color="#1e1e1e"} style={{background:"none",border:"none",color:"#1e1e1e",cursor:"pointer",fontSize:12,padding:3,transition:"color .2s"}}>✕</button>
                      }
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>

          {/* Log form */}
          <div style={{padding:14,border:"1px solid #141414",borderRadius:8,background:"#070707",position:"relative",overflow:"hidden"}}>
            {committed&&<div style={{position:"absolute",inset:0,background:"#00ff8808",border:"1px solid #00ff8828",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}><span style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:"#00ff88",letterSpacing:5}}>COMMITTED ✓</span></div>}
            <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:10}}>// LOG_TODAY</div>
            <div style={{...S.row,gap:7}}>
              <input value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} placeholder="MM/DD" style={{...S.input,width:72,fontSize:12}}/>
              {/* Health toggle */}
              <button onClick={()=>setForm(p=>({...p,health:p.health?0:1}))} style={{...S.btn(form.health?"#00ff88":"#333"),padding:"8px 10px",transform:form.health?"translateY(-1px)":"none"}}>HLTH {form.health}</button>
              {/* DMs — number input with live mini bar */}
              <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:90}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <NumInput value={form.dmsSent} onChange={v=>setForm(p=>({...p,dmsSent:v}))} min={0} max={200} placeholder="DMs" style={{width:60,padding:"8px 8px",fontSize:12}}/>
                  <span style={{...S.mono(9,"#2a2a2a")}}>/{DM_TARGET}</span>
                </div>
                <Bar pct={(form.dmsSent/DM_TARGET)*100} color={form.dmsSent>=DM_TARGET?"#00ff88":form.dmsSent>20?"#ffcc00":"#ff2244"} h={2}/>
              </div>
              {[["delivery","DEL"],["finLogged","F.LOG"],["finDisc","F.DISC"]].map(([k,lbl])=>(
                <button key={k} onClick={()=>setForm(p=>({...p,[k]:p[k]?0:1}))} style={{...S.btn(form[k]?"#00ff88":"#333"),padding:"8px 10px",transform:form[k]?"translateY(-1px)":"none"}}>{lbl} {form[k]}</button>
              ))}
              <input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="note…" style={{...S.input,flex:1,minWidth:90,color:"#666",fontSize:10}}/>
              <button onClick={commit} style={{...S.btn("#00ff88"),background:form.date?"#00ff88":"#141414",color:form.date?"#000":"#2a2a2a",border:"none",padding:"8px 18px",boxShadow:form.date?"0 4px 16px #00ff8838":"none"}}>COMMIT →</button>
            </div>
          </div>

          <div style={{marginTop:8,display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>exportCSV(rows,"telemetry.csv")} style={S.btn("#3a3a3a")} onMouseEnter={e=>e.currentTarget.style.color="#00ff88"} onMouseLeave={e=>e.currentTarget.style.color="#3a3a3a"}>⬇ EXPORT CSV</button>
          </div>
        </div>

        {/* Right: non-negotiables */}
        <div style={{padding:14,background:"#080808",border:"1px solid #141414",borderRadius:8,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={S.label}>NON-NEGOTIABLES</div>
            <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:17,color:nnCount===NON_NEGS.length?"#00ff88":"#ffcc00"}}>{nnCount}/{NON_NEGS.length}</span>
          </div>
          <div style={{...S.mono(9,"#2a2a2a"),marginBottom:10}}>{today} · resets midnight</div>
          <div style={{display:"flex",flexDirection:"column",gap:5,flex:1}}>
            {NON_NEGS.map(n=>(
              <div key={n.id} onClick={()=>setNnDone(d=>({...d,[n.id]:!d[n.id]}))} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 10px",borderRadius:6,cursor:"pointer",background:nnDone[n.id]?"#00ff8806":"#050505",border:`1px solid ${nnDone[n.id]?"#00ff8820":"#0d0d0d"}`,transition:"all .18s"}}>
                <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${nnDone[n.id]?"#00ff88":"#2a2a2a"}`,background:nnDone[n.id]?"#00ff8815":"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .18s"}}>{nnDone[n.id]&&<span style={{color:"#00ff88",fontSize:9,fontWeight:900}}>✓</span>}</div>
                <span style={{...S.mono(10,nnDone[n.id]?"#2a2a2a":"#777"),textDecoration:nnDone[n.id]?"line-through":"none",lineHeight:1.5}}>{n.text}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:10}}>
            <Bar pct={(nnCount/NON_NEGS.length)*100} color={nnCount===NON_NEGS.length?"#00ff88":"#ffcc00"} h={4}/>
            <div style={{...S.mono(9,"#2a2a2a"),marginTop:5}}>{nnCount===NON_NEGS.length?"ALL SYSTEMS GO ✓":`${NON_NEGS.length-nnCount} remaining`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: AGENCY ───────────────────────────────────────────────────────────
function Tab2({mobile}) {
  const [clients,setClients] = useLocalState("v5_clients",DEFAULT_CLIENTS);
  const [showAdd,setShowAdd] = useState(false);
  const [newC,setNewC]       = useState({name:"",tier:1,niche:"Gym",status:"DM Sent",serviceTier:"basic",lastContact:"",followUp:"",sar:"",notes:""});
  const [addTouched,setAddTouched] = useState(false); // tracks whether ADD was attempted
  const [expandId,setExpandId]     = useState(null);
  const [activePhase,setActivePhase] = useLocalState("v5_phase",1);
  const [filter,setFilter]   = useState("ALL");
  const nid = useRef(Date.now());

  useEffect(()=>{ const h=()=>exportCSV(clients,"clients.csv"); document.addEventListener("csv_clients",h); return()=>document.removeEventListener("csv_clients",h); },[clients]);

  const activeSAR = useMemo(()=>clients.filter(c=>["Active","Trial Sent"].includes(c.status)).reduce((a,c)=>a+c.sar,0),[clients]);
  const pipelineSAR = useMemo(()=>clients.reduce((a,c)=>a+c.sar,0),[clients]);

  const addClient=()=>{
    const nameOk = newC.name.trim().length > 0;
    const sarOk  = safeNum(newC.sar) > 0;
    if (!nameOk || !sarOk) { setAddTouched(true); return; }
    const sar = safeNum(newC.sar);
    setClients(cs=>[...cs,{id:nid.current++,...newC,sar}]);
    setNewC({name:"",tier:1,niche:"Gym",status:"DM Sent",serviceTier:"basic",lastContact:"",followUp:"",sar:"",notes:""});
    setAddTouched(false); setShowAdd(false);
  };
  const upd=(id,f,v)=>setClients(cs=>cs.map(c=>c.id===id?{...c,[f]:f==="sar"?safeNum(v):f==="tier"?safeNum(v):v}:c));
  const filtered=filter==="ALL"?clients:filter==="T1"?clients.filter(c=>c.tier===1):filter==="T2"?clients.filter(c=>c.tier===2):clients.filter(c=>c.status===filter);

  return (
    <div>
      <div style={{...S.grid(mobile?2:3),marginBottom:16}}>
        {[
          {l:"ACTIVE REVENUE",v:useAnimNum(activeSAR), c:"#00ff88",suf:"SAR/mo"},
          {l:"PIPELINE",       v:useAnimNum(pipelineSAR),c:"#ffcc00",suf:"SAR"},
          {l:"CLIENTS",        v:clients.length,          c:"#00ccff",suf:"total"},
        ].map(k=>(
          <div key={k.l} style={S.card(k.c)}>
            <div style={S.label}>{k.l}</div>
            <div style={{...S.big(k.c)}}>{typeof k.v==="number"?k.v.toLocaleString():k.v} <span style={{...S.mono(13,"#333")}}>{k.suf}</span></div>
          </div>
        ))}
      </div>

      {/* Phases */}
      <div style={{...S.grid(mobile?2:4,7),marginBottom:16}}>
        {PHASES.map(p=>{const ia=p.n===activePhase,il=p.n>activePhase,id=p.n<activePhase;
          return <div key={p.n} onClick={()=>setActivePhase(p.n)} style={{padding:"11px 13px",borderRadius:8,cursor:"pointer",position:"relative",overflow:"hidden",border:`1.5px solid ${ia?"#00ff8848":id?"#ffffff12":"#141414"}`,background:ia?"#00ff8806":id?"#ffffff03":"#070707",transition:"all .2s"}}>
            {il&&<div style={{position:"absolute",inset:0,background:"#000000bb",backdropFilter:"blur(2px)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:7}}>🔒</div>}
            <div style={{...S.mono(8,"#2a2a2a"),letterSpacing:2,marginBottom:4}}>PHASE {p.n}</div>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,color:ia?"#00ff88":id?"#ffffff25":"#2a2a2a",letterSpacing:1}}>{p.target}</div>
            <div style={S.mono(9,"#2a2a2a")}>{p.focus}</div>
            {ia&&<div style={{marginTop:6,width:5,height:5,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 5px #00ff88",animation:"pulse 2s infinite"}}/>}
          </div>;
        })}
      </div>

      {/* Tier legend */}
      <div style={{...S.row,marginBottom:12}}>
        {[{t:1,n:TIER1_NICHES,c:"#ffcc00",l:"T1 GOLD"},{t:2,n:TIER2_NICHES,c:"#4488ff",l:"T2 BLUE"}].map(x=>(
          <div key={x.t} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 11px",border:`1px solid ${x.c}20`,borderRadius:20,background:`${x.c}08`}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:x.c,boxShadow:`0 0 4px ${x.c}`}}/>
            <span style={S.mono(9,x.c)}>{x.l}</span>
            <span style={S.mono(9,"#2a2a2a")}>· {x.n.join(", ")}</span>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{display:"flex",gap:6,marginBottom:10,justifyContent:"space-between",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["ALL","T1","T2","Active","Trial Sent","DM Sent"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{...S.btn(filter===f?"#00ff88":"#2a2a2a"),padding:"4px 10px",fontSize:9}}>{f}</button>
          ))}
        </div>
        <div style={S.row}>
          <button onClick={()=>exportCSV(clients,"clients.csv")} style={S.btn("#2a2a2a")} onMouseEnter={e=>e.currentTarget.style.color="#00ff88"} onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}>⬇ CSV</button>
          <button onClick={()=>{ setShowAdd(!showAdd); setAddTouched(false); }} style={S.btn(showAdd?"#ff2244":"#00ff88")}>{showAdd?"✕ CANCEL":"+ ADD CLIENT"}</button>
        </div>
      </div>

      {showAdd&&(
        <div key={addTouched ? "shaking" : "still"} className={addTouched ? "shake" : ""} style={{padding:13,border:`1px dashed ${addTouched?"#ff224440":"#00ff8825"}`,borderRadius:8,marginBottom:12,background:"#00ff8803",display:"flex",flexWrap:"wrap",gap:7}}>
          {/* Name — red border + error label if blank after submit attempt */}
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <input
              placeholder="Business name *"
              value={newC.name}
              onChange={e=>{ setNewC(n=>({...n,name:e.target.value})); if(addTouched&&e.target.value.trim()) setAddTouched(false); }}
              style={{...S.input, width:"min(160px,100%)", borderColor: addTouched&&!newC.name.trim() ? "#ff2244" : "#222", boxShadow: addTouched&&!newC.name.trim() ? "0 0 0 2px #ff224420" : "none", transition:"border-color .2s, box-shadow .2s"}}
            />
            {addTouched&&!newC.name.trim()&&<span style={{...S.mono(8,"#ff2244"),letterSpacing:1}}>⚠ NAME REQUIRED</span>}
          </div>
          <select value={newC.niche} onChange={e=>{const ni=e.target.value;setNewC(n=>({...n,niche:ni,tier:TIER1_NICHES.includes(ni)?1:2}));}} style={{...S.input,color:"#aaa"}}>
            <optgroup label="Tier 1 — Gold">{TIER1_NICHES.map(x=><option key={x}>{x}</option>)}</optgroup>
            <optgroup label="Tier 2 — Blue">{TIER2_NICHES.map(x=><option key={x}>{x}</option>)}</optgroup>
          </select>
          <select value={newC.status} onChange={e=>setNewC(n=>({...n,status:e.target.value}))} style={{...S.input,color:"#aaa"}}>
            {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
          </select>
          <select value={newC.serviceTier} onChange={e=>setNewC(n=>({...n,serviceTier:e.target.value}))} style={{...S.input,color:"#aaa"}}>
            {SERVICE_TIERS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {/* SAR — red border + error label if zero after submit attempt */}
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <NumInput
              value={newC.sar||0}
              onChange={v=>setNewC(n=>({...n,sar:v}))}
              placeholder="SAR/mo *"
              style={{width:90, borderColor: addTouched&&!(safeNum(newC.sar)>0) ? "#ff2244" : "#222", boxShadow: addTouched&&!(safeNum(newC.sar)>0) ? "0 0 0 2px #ff224420" : "none", transition:"border-color .2s, box-shadow .2s"}}
            />
            {addTouched&&!(safeNum(newC.sar)>0)&&<span style={{...S.mono(8,"#ff2244"),letterSpacing:1}}>⚠ SAR > 0</span>}
          </div>
          {[["lastContact","Last MM/DD",100],["followUp","Follow-up",100],["notes","Notes",150]].map(([k,ph,w])=>(
            <input key={k} placeholder={ph} value={newC[k]} onChange={e=>setNewC(n=>({...n,[k]:e.target.value}))} style={{...S.input,width:`min(${w}px,100%)`}}/>
          ))}
          <button onClick={addClient} style={{...S.btn("#00ff88"),background:"#00ff88",color:"#000",border:"none",opacity:addTouched&&(!newC.name.trim()||!(safeNum(newC.sar)>0))?0.5:1}}>ADD →</button>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {filtered.map(c=>{
          const tc=TIER_COLORS[c.tier]||"#888";
          const st=SERVICE_TIERS.find(s=>s.id===c.serviceTier);
          return <div key={c.id}>
            <div onClick={()=>setExpandId(expandId===c.id?null:c.id)} style={{display:"flex",gap:8,padding:"11px 12px",borderRadius:expandId===c.id?"8px 8px 0 0":8,cursor:"pointer",alignItems:"center",borderLeft:`3px solid ${tc}`,border:`1px solid ${expandId===c.id?"#ffffff12":"#0f0f0f"}`,borderLeft:`3px solid ${tc}`,background:expandId===c.id?"#0d0d0d":"#080808",transition:"all .15s",flexWrap:"wrap"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:tc,boxShadow:`0 0 4px ${tc}`,flexShrink:0}}/>
              <div style={{flex:1,minWidth:100}}>
                <span style={S.mono(12,"#ccc")}><strong>{c.name}</strong></span>
                <span style={{...S.mono(9,"#2a2a2a"),marginLeft:8}}>{c.niche}</span>
              </div>
              {!mobile&&<Pill label={`T${c.tier}`} color={tc}/>}
              {st&&!mobile&&<Pill label={st.name} color={st.color}/>}
              {!mobile&&<Pill label={c.status} color={STATUS_COLORS[c.status]||"#888"}/>}
              <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,color:"#00ff88",marginLeft:"auto"}}>{c.sar.toLocaleString()}</span>
              <span style={{color:"#2a2a2a",display:"inline-block",transition:"transform .2s",transform:`rotate(${expandId===c.id?180:0}deg)`}}>▼</span>
            </div>
            {expandId===c.id&&(
              <div style={{padding:"12px 14px",border:"1px solid #0f0f0f",borderTop:"none",borderRadius:"0 0 8px 8px",background:"#060606",display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-end"}}>
                {[{lbl:"NICHE",f:"niche",type:"niche"},{lbl:"STATUS",f:"status",type:"status"},{lbl:"SERVICE TIER",f:"serviceTier",type:"service"}].map(({lbl,f,type})=>(
                  <div key={f}><div style={{...S.label,marginBottom:3}}>{lbl}</div>
                    {type==="niche"&&<select value={c[f]} onChange={e=>{const ni=e.target.value;upd(c.id,"niche",ni);upd(c.id,"tier",TIER1_NICHES.includes(ni)?1:2);}} style={{...S.input,color:"#aaa"}}><optgroup label="T1">{TIER1_NICHES.map(x=><option key={x}>{x}</option>)}</optgroup><optgroup label="T2">{TIER2_NICHES.map(x=><option key={x}>{x}</option>)}</optgroup></select>}
                    {type==="status"&&<select value={c[f]} onChange={e=>upd(c.id,"status",e.target.value)} style={{...S.input,color:"#aaa"}}>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select>}
                    {type==="service"&&<select value={c[f]} onChange={e=>upd(c.id,"serviceTier",e.target.value)} style={{...S.input,color:"#aaa"}}>{SERVICE_TIERS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>}
                  </div>
                ))}
                <div><div style={{...S.label,marginBottom:3}}>SAR/MO</div><NumInput value={c.sar} onChange={v=>upd(c.id,"sar",v)} min={0} style={{width:90}}/></div>
                {[["LAST","lastContact",90],["FOLLOW-UP","followUp",90],["NOTES","notes",170]].map(([lbl,f,w])=>(
                  <div key={f}><div style={{...S.label,marginBottom:3}}>{lbl}</div><input value={c[f]} onChange={e=>upd(c.id,f,e.target.value)} style={{...S.input,width:`min(${w}px,100%)`}}/></div>
                ))}
                <button onClick={()=>setClients(cs=>cs.filter(x=>x.id!==c.id))} style={S.btn("#ff2244")}>REMOVE</button>
              </div>
            )}
          </div>;
        })}
        {!filtered.length&&<div style={{...S.mono(11,"#1e1e1e"),padding:20,textAlign:"center"}}>NO CLIENTS MATCH FILTER</div>}
      </div>
    </div>
  );
}

// ─── TAB 3: BUDGET ───────────────────────────────────────────────────────────
function Tab3({mobile}) {
  const [income,setIncome] = useLocalState("v5_income",3700);
  const [items,setItems]   = useLocalState("v5_budget",DEFAULT_BUDGET);
  const [newItem,setNewItem] = useState({cat:"Personal",name:"",budget:"",actual:""});
  const [showAdd,setShowAdd] = useState(false);
  const nid = useRef(Date.now());

  const totalBudget = useMemo(()=>items.reduce((a,i)=>a+i.budget,0),[items]);
  const totalActual = useMemo(()=>items.reduce((a,i)=>a+i.actual,0),[items]);
  const surplus     = income - totalActual;
  const dailyBurn   = +(totalActual/30).toFixed(0);
  const dailyIncome = +(income/30).toFixed(0);
  const dailyNet    = dailyIncome - dailyBurn;
  const daysToGoal  = surplus>0 ? Math.ceil(37500/surplus*30) : null;
  const animS       = useAnimNum(surplus);
  const animBurn    = useAnimNum(dailyBurn);

  const upd=(id,f,v)=>setItems(is=>is.map(i=>i.id===id?{...i,[f]:["budget","actual"].includes(f)?safeNum(v):v}:i));
  const addItem=()=>{
    if(!newItem.name.trim())return;
    setItems(is=>[...is,{id:nid.current++,...newItem,budget:safeNum(newItem.budget),actual:safeNum(newItem.actual)}]);
    setNewItem({cat:"Personal",name:"",budget:"",actual:""}); setShowAdd(false);
  };

  return (
    <div>
      {/* Top KPIs */}
      <div style={{...S.grid(mobile?2:4),marginBottom:12}}>
        <div style={S.card("#00ccff")}>
          <div style={S.label}>INCOME</div>
          <NumInput value={income} onChange={setIncome} min={0} style={{background:"none",border:"none",fontFamily:"'Bebas Neue',cursive",fontSize:34,color:"#00ccff",width:"100%",padding:0}}/>
          <div style={{...S.mono(9,"#2a2a2a"),marginTop:4}}>SAR / month</div>
        </div>
        {[
          {l:"TOTAL BURN",   v:totalActual.toLocaleString(), c:"#ff2244",   s:"SAR spent"},
          {l:"NET SURPLUS",  v:`${animS>=0?"+":""}${animS.toLocaleString()}`, c:surplus>=0?"#00ff88":"#ff2244", s:"SAR/mo"},
          {l:"TIME TO 10K",  v:surplus>0?(37500/surplus).toFixed(1):"∞", c:"#ffcc00", s:"months"},
        ].map(k=>(
          <div key={k.l} style={S.card(k.c)}>
            <div style={S.label}>{k.l}</div>
            <div style={S.big(k.c)}>{k.v}</div>
            <div style={{...S.mono(9,"#2a2a2a"),marginTop:4}}>{k.s}</div>
          </div>
        ))}
      </div>

      {/* Daily burn rate — the "drift" panel */}
      <div style={{padding:16,background:"#090909",border:"1px solid #ff224418",borderRadius:8,marginBottom:14}}>
        <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:12}}>// DAILY BURN RATE — EVERY DAY WITHOUT A SALE</div>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:12}}>
          {[
            {l:"DAILY BURN",   v:`${animBurn.toLocaleString()} SAR`,  c:"#ff2244", s:"costs you daily"},
            {l:"DAILY INCOME", v:`${dailyIncome.toLocaleString()} SAR`,c:"#00ccff", s:"avg revenue/day"},
            {l:"DAILY NET",    v:`${dailyNet>=0?"+":""}${dailyNet.toLocaleString()} SAR`, c:dailyNet>=0?"#00ff88":"#ff2244", s:"per day"},
            {l:"DAYS TO 10K",  v:daysToGoal?`${daysToGoal}d`:"∞",    c:"#ffcc00", s:"at current rate"},
          ].map(k=>(
            <div key={k.l}>
              <div style={S.label}>{k.l}</div>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,color:k.c,textShadow:`0 0 10px ${k.c}44`}}>{k.v}</div>
              <div style={{...S.mono(9,"#2a2a2a"),marginTop:3}}>{k.s}</div>
            </div>
          ))}
        </div>
        {/* Miss-a-sale drift message */}
        <div style={{padding:"10px 14px",background:"#0d0400",border:"1px solid #ff224420",borderRadius:6}}>
          <span style={S.mono(10,"#ff2244")}>⚠ REALITY CHECK: </span>
          <span style={S.mono(10,"#555")}>Every day you miss your 50 DMs costs you <strong style={{color:"#ff8833"}}>{dailyBurn.toLocaleString()} SAR</strong> in opportunity drift. At current surplus, your $10k target moves <strong style={{color:"#ff8833"}}>{surplus>0?Math.round(37500/surplus/30):"∞"} day(s) further away</strong> for every missed outreach day.</span>
        </div>
      </div>

      {/* Goal bar */}
      <div style={{padding:"12px 14px",background:"#090909",border:"1px solid #141414",borderRadius:8,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4}}>
          <span style={S.mono(9,"#2a2a2a")}>SAVINGS GOAL: 37,500 SAR</span>
          <span style={S.mono(9,surplus>0?"#00ff88":"#ff2244")}>{surplus>0?`+${surplus.toLocaleString()}`:surplus.toLocaleString()} SAR/mo → {surplus>0?(37500/surplus).toFixed(1):"∞"} months</span>
        </div>
        <Bar pct={Math.min(Math.max((surplus/37500)*100*7,0),100)} color="linear-gradient(90deg,#00ff88,#00ccff)" h={5}/>
      </div>

      {/* Ledger */}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center"}}>
        <div style={S.label}>// EXPENSE LEDGER</div>
        <button onClick={()=>setShowAdd(!showAdd)} style={S.btn(showAdd?"#ff2244":"#00ff88")}>{showAdd?"✕":"+ LINE"}</button>
      </div>
      {showAdd&&(
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10,padding:12,border:"1px dashed #00ff8822",borderRadius:8}}>
          <select value={newItem.cat} onChange={e=>setNewItem(n=>({...n,cat:e.target.value}))} style={{...S.input,color:"#aaa"}}><option>Personal</option><option>Work</option></select>
          <input placeholder="Name" value={newItem.name} onChange={e=>setNewItem(n=>({...n,name:e.target.value}))} style={{...S.input,width:"min(140px,100%)"}}/>
          <NumInput value={newItem.budget||0} onChange={v=>setNewItem(n=>({...n,budget:v}))} placeholder="Budget" style={{width:80}}/>
          <NumInput value={newItem.actual||0} onChange={v=>setNewItem(n=>({...n,actual:v}))} placeholder="Actual"  style={{width:80}}/>
          <button onClick={addItem} style={{...S.btn("#00ff88"),background:"#00ff88",color:"#000",border:"none"}}>ADD</button>
        </div>
      )}
      <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #141414"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:11,minWidth:460}}>
          <thead><tr style={{borderBottom:"1px solid #141414"}}>{["LEDGER","ITEM","BUDGET","ACTUAL","DELTA","BAR",""].map(h=><th key={h} style={{padding:"7px 9px",color:"#2a2a2a",textAlign:"left",fontSize:9,letterSpacing:2}}>{h}</th>)}</tr></thead>
          <tbody>
            {items.map(item=>{
              const pct=item.budget?item.actual/item.budget:0, delta=item.budget-item.actual;
              const sc=pct<=.85?"#00ff88":pct<=1?"#ffcc00":"#ff2244";
              return <tr key={item.id} style={{borderBottom:"1px solid #0c0c0c"}}>
                <td style={{padding:"8px 9px"}}><span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:item.cat==="Personal"?"#ffffff07":"#0044ff10",color:item.cat==="Personal"?"#3a3a3a":"#4488ff",border:`1px solid ${item.cat==="Personal"?"#1a1a1a":"#4488ff20"}`}}>{item.cat.toUpperCase()}</span></td>
                <td style={{padding:"8px 9px"}}><input value={item.name} onChange={e=>upd(item.id,"name",e.target.value)} style={{background:"none",border:"none",outline:"none",color:"#ccc",fontFamily:"monospace",fontSize:11,width:"100%"}}/></td>
                <td style={{padding:"8px 9px"}}><NumInput value={item.budget} onChange={v=>upd(item.id,"budget",v)} style={{width:75,padding:"3px 7px",color:"#666"}}/></td>
                <td style={{padding:"8px 9px"}}><NumInput value={item.actual} onChange={v=>upd(item.id,"actual",v)} style={{width:75,padding:"3px 7px"}}/></td>
                <td style={{padding:"8px 9px",color:delta>=0?"#00ff88":"#ff2244",fontWeight:700}}>{delta>=0?"+":""}{delta}</td>
                <td style={{padding:"8px 9px",minWidth:90}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{flex:1,height:3,background:"#111",borderRadius:2}}><div style={{width:`${Math.min(pct*100,100)}%`,height:"100%",background:sc,borderRadius:2,boxShadow:`0 0 3px ${sc}`}}/></div>
                    <span style={S.mono(9,sc)}>{Math.round(pct*100)}%</span>
                  </div>
                </td>
                <td style={{padding:"8px 4px"}}><button onClick={()=>setItems(is=>is.filter(i=>i.id!==item.id))} onMouseEnter={e=>e.target.style.color="#ff2244"} onMouseLeave={e=>e.target.style.color="#1a1a1a"} style={{background:"none",border:"none",color:"#1a1a1a",cursor:"pointer",fontSize:12,transition:"color .2s"}}>✕</button></td>
              </tr>;
            })}
            <tr style={{borderTop:"1px solid #1a1a1a",background:"#0a0a0a"}}>
              <td colSpan={2} style={{padding:"9px",fontFamily:"monospace",color:"#2a2a2a",fontSize:9,letterSpacing:2}}>TOTAL</td>
              <td style={{padding:"9px",fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#3a3a3a"}}>{totalBudget.toLocaleString()}</td>
              <td style={{padding:"9px",fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#ddd"}}>{totalActual.toLocaleString()}</td>
              <td colSpan={3} style={{padding:"9px",fontFamily:"'Bebas Neue',cursive",fontSize:18,color:surplus>=0?"#00ff88":"#ff2244"}}>PROFIT: {surplus.toLocaleString()} SAR</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 4: PROPOSALS ────────────────────────────────────────────────────────
const PROP_S = ["Draft","Sent","Viewed","Accepted","Rejected"];
const PROP_C = {Draft:"#555",Sent:"#ffcc00",Viewed:"#ff8833",Accepted:"#00ff88",Rejected:"#ff2244"};
function Tab4({mobile}) {
  const [proposals,setProposals] = useLocalState("v5_proposals",DEFAULT_PROPOSALS);
  const [showAdd,setShowAdd]     = useState(false);
  const [newP,setNewP]           = useState({client:"",value:"",status:"Draft",date:"",notes:""});
  const nid = useRef(Date.now());
  useEffect(()=>{ const h=()=>exportCSV(proposals,"proposals.csv"); document.addEventListener("csv_prop",h); return()=>document.removeEventListener("csv_prop",h); },[proposals]);
  const totalWon = proposals.filter(p=>p.status==="Accepted").reduce((a,p)=>a+p.value,0);
  const winRate  = proposals.length?Math.round((proposals.filter(p=>p.status==="Accepted").length/proposals.length)*100):0;
  const addP=()=>{ if(!newP.client.trim())return; setProposals(ps=>[...ps,{id:nid.current++,...newP,value:safeNum(newP.value)}]); setNewP({client:"",value:"",status:"Draft",date:"",notes:""}); setShowAdd(false); };
  const upd=(id,f,v)=>setProposals(ps=>ps.map(p=>p.id===id?{...p,[f]:f==="value"?safeNum(v):v}:p));
  return (
    <div>
      <div style={{...S.grid(mobile?2:4),marginBottom:16}}>
        {[
          {l:"PROPOSALS",v:proposals.length,c:"#00ccff",s:"total"},
          {l:"VALUE SENT",v:proposals.filter(p=>["Sent","Viewed","Accepted"].includes(p.status)).reduce((a,p)=>a+p.value,0).toLocaleString(),c:"#ffcc00",s:"SAR"},
          {l:"WON",v:totalWon.toLocaleString(),c:"#00ff88",s:"SAR"},
          {l:"WIN RATE",v:`${winRate}%`,c:winRate>=50?"#00ff88":"#ff8833",s:"conversion"},
        ].map(k=>(
          <div key={k.l} style={S.card(k.c)}><div style={S.label}>{k.l}</div><div style={S.big(k.c)}>{k.v}</div><div style={{...S.mono(9,"#2a2a2a"),marginTop:4}}>{k.s}</div></div>
        ))}
      </div>
      {/* Funnel */}
      <div style={{padding:14,background:"#090909",border:"1px solid #141414",borderRadius:8,marginBottom:14}}>
        <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:10}}>// PROPOSAL FUNNEL</div>
        {PROP_S.map(s=>{ const n=proposals.filter(p=>p.status===s).length, pct=proposals.length?(n/proposals.length)*100:0;
          return <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:65,...S.mono(9,PROP_C[s]),textAlign:"right"}}>{s}</div>
            <div style={{flex:1,height:5,background:"#111",borderRadius:2}}><div style={{width:`${pct}%`,height:"100%",background:PROP_C[s],borderRadius:2,boxShadow:`0 0 4px ${PROP_C[s]}`,transition:"width .5s"}}/></div>
            <div style={{width:24,...S.mono(9,"#333"),textAlign:"right"}}>{n}</div>
          </div>;
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,alignItems:"center",flexWrap:"wrap",gap:6}}>
        <div style={S.label}>// PROPOSALS ({proposals.length})</div>
        <div style={S.row}>
          <button onClick={()=>exportCSV(proposals,"proposals.csv")} style={S.btn("#2a2a2a")} onMouseEnter={e=>e.currentTarget.style.color="#00ff88"} onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}>⬇ CSV</button>
          <button onClick={()=>setShowAdd(!showAdd)} style={S.btn(showAdd?"#ff2244":"#00ff88")}>{showAdd?"✕":"+ PROPOSAL"}</button>
        </div>
      </div>
      {showAdd&&(
        <div style={{padding:13,border:"1px dashed #00ff8822",borderRadius:8,marginBottom:12,display:"flex",flexWrap:"wrap",gap:7}}>
          <input placeholder="Client" value={newP.client} onChange={e=>setNewP(n=>({...n,client:e.target.value}))} style={{...S.input,width:"min(150px,100%)"}}/>
          <NumInput value={newP.value||0} onChange={v=>setNewP(n=>({...n,value:v}))} placeholder="SAR value" style={{width:95}}/>
          <input placeholder="MM/DD" value={newP.date} onChange={e=>setNewP(n=>({...n,date:e.target.value}))} style={{...S.input,width:80}}/>
          <select value={newP.status} onChange={e=>setNewP(n=>({...n,status:e.target.value}))} style={{...S.input,color:"#aaa"}}>{PROP_S.map(s=><option key={s}>{s}</option>)}</select>
          <input placeholder="Notes" value={newP.notes} onChange={e=>setNewP(n=>({...n,notes:e.target.value}))} style={{...S.input,flex:1,minWidth:120}}/>
          <button onClick={addP} style={{...S.btn("#00ff88"),background:"#00ff88",color:"#000",border:"none"}}>ADD →</button>
        </div>
      )}
      <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #141414"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:11,minWidth:440}}>
          <thead><tr style={{borderBottom:"1px solid #141414"}}>{["CLIENT","VALUE (SAR)","STATUS","DATE","NOTES",""].map(h=><th key={h} style={{padding:"7px 9px",color:"#2a2a2a",textAlign:"left",fontSize:9,letterSpacing:2}}>{h}</th>)}</tr></thead>
          <tbody>
            {proposals.map(p=>(
              <tr key={p.id} style={{borderBottom:"1px solid #0c0c0c"}}>
                <td style={{padding:"8px 9px",color:"#ccc",fontWeight:700}}>{p.client}</td>
                <td style={{padding:"8px 9px"}}><NumInput value={p.value} onChange={v=>upd(p.id,"value",v)} style={{width:90,fontFamily:"'Bebas Neue',cursive",fontSize:16,color:"#00ff88",padding:"2px 7px"}}/></td>
                <td style={{padding:"8px 9px"}}><select value={p.status} onChange={e=>upd(p.id,"status",e.target.value)} style={{background:`${PROP_C[p.status]}14`,border:`1px solid ${PROP_C[p.status]}28`,color:PROP_C[p.status],padding:"3px 8px",borderRadius:4,fontFamily:"monospace",fontSize:10,cursor:"pointer"}}>{PROP_S.map(s=><option key={s}>{s}</option>)}</select></td>
                <td style={{padding:"8px 9px",...S.mono(10,"#2a2a2a")}}>{p.date}</td>
                <td style={{padding:"8px 9px"}}><input value={p.notes} onChange={e=>upd(p.id,"notes",e.target.value)} style={{background:"none",border:"none",outline:"none",...S.mono(10,"#444"),width:"100%"}}/></td>
                <td style={{padding:"8px 4px"}}><button onClick={()=>setProposals(ps=>ps.filter(x=>x.id!==p.id))} onMouseEnter={e=>e.target.style.color="#ff2244"} onMouseLeave={e=>e.target.style.color="#1a1a1a"} style={{background:"none",border:"none",color:"#1a1a1a",cursor:"pointer",fontSize:12,transition:"color .2s"}}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 5: INVOICING ────────────────────────────────────────────────────────
const INV_S = ["Pending","Sent","Paid","Overdue"];
const INV_C = {Pending:"#ffcc00",Sent:"#00ccff",Paid:"#00ff88",Overdue:"#ff2244"};
function Tab5({mobile}) {
  const [invoices,setInvoices] = useLocalState("v5_invoices",DEFAULT_INVOICES);
  const [showAdd,setShowAdd]   = useState(false);
  const [newI,setNewI]         = useState({client:"",amount:"",status:"Pending",issued:"",due:"",notes:""});
  const nid = useRef(Date.now());
  useEffect(()=>{ const h=()=>exportCSV(invoices,"invoices.csv"); document.addEventListener("csv_inv",h); return()=>document.removeEventListener("csv_inv",h); },[invoices]);
  const paid    = useMemo(()=>invoices.filter(i=>i.status==="Paid").reduce((a,i)=>a+i.amount,0),[invoices]);
  const animP   = useAnimNum(paid);
  const outstanding = useMemo(()=>invoices.filter(i=>i.status!=="Paid").reduce((a,i)=>a+i.amount,0),[invoices]);
  const overdue = invoices.filter(i=>i.status==="Overdue").length;
  const addI=()=>{ if(!newI.client.trim())return; setInvoices(is=>[...is,{id:nid.current++,...newI,amount:safeNum(newI.amount)}]); setNewI({client:"",amount:"",status:"Pending",issued:"",due:"",notes:""}); setShowAdd(false); };
  const upd=(id,f,v)=>setInvoices(is=>is.map(i=>i.id===id?{...i,[f]:f==="amount"?safeNum(v):v}:i));
  return (
    <div>
      <div style={{...S.grid(mobile?2:4),marginBottom:16}}>
        {[
          {l:"COLLECTED",    v:`${animP.toLocaleString()}`,  c:"#00ff88",s:"SAR paid"},
          {l:"OUTSTANDING",  v:outstanding.toLocaleString(), c:"#ffcc00",s:"SAR owed"},
          {l:"OVERDUE",      v:overdue,                      c:overdue?"#ff2244":"#00ff88",s:"invoices"},
          {l:"TOTAL ISSUED", v:invoices.length,              c:"#00ccff",s:"invoices"},
        ].map(k=>(
          <div key={k.l} style={S.card(k.c)}><div style={S.label}>{k.l}</div><div style={S.big(k.c)}>{k.v}</div><div style={{...S.mono(9,"#2a2a2a"),marginTop:4}}>{k.s}</div></div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6,alignItems:"center"}}>
        <div style={S.label}>// INVOICE LEDGER</div>
        <div style={S.row}>
          <button onClick={()=>exportCSV(invoices,"invoices.csv")} style={S.btn("#2a2a2a")} onMouseEnter={e=>e.currentTarget.style.color="#00ff88"} onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}>⬇ CSV</button>
          <button onClick={()=>setShowAdd(!showAdd)} style={S.btn(showAdd?"#ff2244":"#00ff88")}>{showAdd?"✕":"+ INVOICE"}</button>
        </div>
      </div>
      {showAdd&&(
        <div style={{padding:13,border:"1px dashed #00ff8822",borderRadius:8,marginBottom:12,display:"flex",flexWrap:"wrap",gap:7}}>
          <input placeholder="Client" value={newI.client} onChange={e=>setNewI(n=>({...n,client:e.target.value}))} style={{...S.input,width:"min(150px,100%)"}}/>
          <NumInput value={newI.amount||0} onChange={v=>setNewI(n=>({...n,amount:v}))} placeholder="SAR amount" style={{width:100}}/>
          {[["issued","Issued MM/DD",100],["due","Due MM/DD",95]].map(([k,ph,w])=>(
            <input key={k} placeholder={ph} value={newI[k]} onChange={e=>setNewI(n=>({...n,[k]:e.target.value}))} style={{...S.input,width:`min(${w}px,100%)`}}/>
          ))}
          <select value={newI.status} onChange={e=>setNewI(n=>({...n,status:e.target.value}))} style={{...S.input,color:"#aaa"}}>{INV_S.map(s=><option key={s}>{s}</option>)}</select>
          <input placeholder="Notes" value={newI.notes} onChange={e=>setNewI(n=>({...n,notes:e.target.value}))} style={{...S.input,flex:1,minWidth:120}}/>
          <button onClick={addI} style={{...S.btn("#00ff88"),background:"#00ff88",color:"#000",border:"none"}}>ADD →</button>
        </div>
      )}
      <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #141414"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:11,minWidth:500}}>
          <thead><tr style={{borderBottom:"1px solid #141414"}}>{["CLIENT","AMOUNT","STATUS","ISSUED","DUE","NOTES","ACTION",""].map(h=><th key={h} style={{padding:"7px 9px",color:"#2a2a2a",textAlign:"left",fontSize:9,letterSpacing:2,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>
            {invoices.map(inv=>(
              <tr key={inv.id} style={{borderBottom:"1px solid #0c0c0c",opacity:inv.status==="Paid"?.55:1}}>
                <td style={{padding:"8px 9px",color:"#ccc",fontWeight:700}}>{inv.client}</td>
                <td style={{padding:"8px 9px"}}><NumInput value={inv.amount} onChange={v=>upd(inv.id,"amount",v)} style={{width:85,fontFamily:"'Bebas Neue',cursive",fontSize:16,color:"#00ff88",padding:"2px 7px"}}/></td>
                <td style={{padding:"8px 9px"}}><select value={inv.status} onChange={e=>upd(inv.id,"status",e.target.value)} style={{background:`${INV_C[inv.status]}14`,border:`1px solid ${INV_C[inv.status]}28`,color:INV_C[inv.status],padding:"3px 8px",borderRadius:4,fontFamily:"monospace",fontSize:10,cursor:"pointer"}}>{INV_S.map(s=><option key={s}>{s}</option>)}</select></td>
                <td style={{padding:"8px 9px",...S.mono(10,"#2a2a2a"),whiteSpace:"nowrap"}}>{inv.issued}</td>
                <td style={{padding:"8px 9px",...S.mono(10,inv.status==="Overdue"?"#ff2244":"#2a2a2a"),whiteSpace:"nowrap"}}>{inv.due}</td>
                <td style={{padding:"8px 9px"}}><input value={inv.notes||""} onChange={e=>upd(inv.id,"notes",e.target.value)} style={{background:"none",border:"none",outline:"none",...S.mono(10,"#3a3a3a"),width:"100%"}}/></td>
                <td style={{padding:"8px 9px",whiteSpace:"nowrap"}}>
                  {inv.status!=="Paid"
                    ?<button onClick={()=>upd(inv.id,"status","Paid")} style={{...S.btn("#00ff88"),padding:"3px 10px",fontSize:9}}>MARK PAID</button>
                    :<span style={S.mono(9,"#2a2a2a")}>✓ PAID</span>
                  }
                </td>
                <td style={{padding:"8px 4px"}}><button onClick={()=>setInvoices(is=>is.filter(x=>x.id!==inv.id))} onMouseEnter={e=>e.target.style.color="#ff2244"} onMouseLeave={e=>e.target.style.color="#1a1a1a"} style={{background:"none",border:"none",color:"#1a1a1a",cursor:"pointer",fontSize:12,transition:"color .2s"}}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 6: SERVICE TIERS ────────────────────────────────────────────────────
function Tab6({clients}) {
  const [activeTier,setActiveTier] = useLocalState("v5_svc_tier","growth");
  const tierStats = useMemo(()=>
    SERVICE_TIERS.map(t=>({
      ...t,
      clientCount: clients.filter(c=>c.serviceTier===t.id).length,
      totalSAR:    clients.filter(c=>c.serviceTier===t.id).reduce((a,c)=>a+c.sar,0),
    }))
  ,[clients]);
  const totalServiceRevenue = tierStats.reduce((a,t)=>a+t.totalSAR,0);
  const animTotal = useAnimNum(totalServiceRevenue);

  return (
    <div>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:36,color:"#fff",letterSpacing:3,marginBottom:4}}>AGENCY SERVICE <span style={{color:"#00ff88"}}>TIERS</span></div>
        <div style={S.mono(11,"#3a3a3a")}>Assign every client to a tier. This is how you scale from survival to 100k SAR.</div>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:"#00ff88",marginTop:10}}>TOTAL TIER REVENUE: {animTotal.toLocaleString()} <span style={S.mono(14,"#333")}>SAR/mo</span></div>
      </div>

      {/* Live stats per tier */}
      <div style={{...S.grid(3,12),marginBottom:24}}>
        {tierStats.map(t=>(
          <div key={t.id} style={{padding:20,borderRadius:10,border:`2px solid ${t.color}30`,background:activeTier===t.id?`${t.color}08`:"#080808",position:"relative",transition:"all .2s",cursor:"pointer",transform:activeTier===t.id?"translateY(-3px)":"none",boxShadow:activeTier===t.id?`0 16px 32px ${t.color}14`:"none"}} onClick={()=>setActiveTier(t.id)}>
            <div style={{position:"absolute",top:-9,right:12,background:t.color,color:t.color==="#ffcc00"||t.color==="#00ff88"?"#000":"#000",fontFamily:"monospace",fontSize:8,fontWeight:900,padding:"2px 10px",borderRadius:10,letterSpacing:2}}>{t.badge}</div>
            <div style={S.label}>{t.name}</div>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:36,color:t.color,lineHeight:1,marginBottom:4,textShadow:`0 0 16px ${t.color}44`}}>{t.sarPrice.toLocaleString()} <span style={S.mono(12,"#333")}>SAR/mo</span></div>
            <div style={{display:"flex",gap:14,marginTop:10,marginBottom:14}}>
              <div><div style={S.label}>CLIENTS</div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:t.clientCount>0?t.color:"#2a2a2a"}}>{t.clientCount}</div></div>
              <div><div style={S.label}>REVENUE</div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:t.totalSAR>0?t.color:"#2a2a2a"}}>{t.totalSAR.toLocaleString()}</div></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {t.features.map((f,i)=>(
                <div key={i} style={S.row}>
                  <span style={{color:t.color,fontSize:10}}>✓</span>
                  <span style={S.mono(10,"#666")}>{f}</span>
                </div>
              ))}
            </div>
            {activeTier===t.id&&<div style={{marginTop:12,padding:"7px 10px",background:`${t.color}18`,borderRadius:5,border:`1px solid ${t.color}28`,textAlign:"center",...S.mono(10,t.color),fontWeight:700}}>✓ SELECTED DEFAULT</div>}
          </div>
        ))}
      </div>

      {/* Assigned clients breakdown */}
      <div style={{padding:16,background:"#090909",border:"1px solid #141414",borderRadius:8}}>
        <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:12}}>// CLIENT — TIER BREAKDOWN</div>
        {tierStats.map(t=>(
          <div key={t.id} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,flexWrap:"wrap",gap:4}}>
              <span style={S.mono(10,t.color)}>{t.name}</span>
              <span style={S.mono(9,"#2a2a2a")}>{t.clientCount} clients · {t.totalSAR.toLocaleString()} SAR</span>
            </div>
            <Bar pct={totalServiceRevenue?((t.totalSAR/totalServiceRevenue)*100):0} color={t.color} h={5} animate={false}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
              {clients.filter(c=>c.serviceTier===t.id).map(c=>(
                <div key={c.id} style={{padding:"3px 10px",borderRadius:4,background:`${t.color}10`,border:`1px solid ${t.color}20`,...S.mono(10,t.color)}}>{c.name} · {c.sar.toLocaleString()} SAR</div>
              ))}
              {clients.filter(c=>c.serviceTier===t.id).length===0&&<span style={S.mono(9,"#1e1e1e")}>No clients on this tier yet</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB 7: ARCHITECTURE ─────────────────────────────────────────────────────
function Tab7({mobile}) {
  const [tasks,setTasks]  = useLocalState("v5_tasks",[
    {id:1,time:"06:00",action:"16oz water + sunlight",done:false},
    {id:2,time:"06:30",action:"30 min gym",done:false},
    {id:3,time:"08:00",action:"Send 50 DMs (Arabic first)",done:false},
    {id:4,time:"12:00",action:"Deliver all pending edits",done:false},
    {id:5,time:"18:00",action:"Log every riyal",done:false},
    {id:6,time:"21:00",action:"SUN: Weekly XP audit",done:false},
  ]);
  const [newTask,setNewTask] = useState({time:"",action:""});
  const [showAdd,setShowAdd] = useState(false);
  const [hov,setHov] = useState(null);
  const [activeScript,setActiveScript] = useState("arabic");
  const nid = useRef(Date.now());
  const done = tasks.filter(t=>t.done).length;
  const rules=[
    {id:"01",icon:"⚡",title:"IDENTITY PROTOCOL",body:"\"I am a high-performance system. I do not 'try,' I execute.\""},
    {id:"02",icon:"📱",title:"KSA META",body:"WhatsApp > Everything. Speed is the only advantage. Reply under 1 hour."},
    {id:"03",icon:"🔒",title:"FINANCIAL CONSTRAINT",body:"Zero non-essential spending until $10,000 / 37,500 SAR milestone."},
    {id:"04",icon:"⚠️",title:"THE ANTI-VISION",body:"\"Missed DMs + junk food = choosing to stay broke and tired for 5 more years.\""},
  ];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:16}}>
        <div>
          <div style={{padding:14,background:"#090909",border:"1px solid #141414",borderRadius:8,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={S.label}>DAILY PROTOCOL</div>
              <div style={S.row}>
                <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:done===tasks.length?"#00ff88":"#ffcc00"}}>{done}/{tasks.length}</span>
                <button onClick={()=>setShowAdd(!showAdd)} style={S.btn(showAdd?"#ff2244":"#00ff88","")}>{showAdd?"✕":"+TASK"}</button>
              </div>
            </div>
            {showAdd&&<div style={{...S.row,marginBottom:10}}>
              <input placeholder="HH:MM" value={newTask.time} onChange={e=>setNewTask(n=>({...n,time:e.target.value}))} style={{...S.input,width:65}}/>
              <input placeholder="Action..." value={newTask.action} onChange={e=>setNewTask(n=>({...n,action:e.target.value}))} style={{...S.input,flex:1}}/>
              <button onClick={()=>{if(newTask.action){setTasks(ts=>[...ts,{id:nid.current++,...newTask,done:false}]);setNewTask({time:"",action:""});setShowAdd(false);}}} style={{...S.btn("#00ff88"),background:"#00ff88",color:"#000",border:"none"}}>ADD</button>
            </div>}
            {tasks.map(t=>(
              <div key={t.id} onClick={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:!x.done}:x))} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:5,cursor:"pointer",background:t.done?"#00ff8806":"#050505",border:`1px solid ${t.done?"#00ff8818":"#0d0d0d"}`,transition:"all .18s",opacity:t.done?.5:1,marginBottom:4}}>
                <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${t.done?"#00ff88":"#2a2a2a"}`,background:t.done?"#00ff8815":"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .18s"}}>{t.done&&<span style={{color:"#00ff88",fontSize:9,fontWeight:900}}>✓</span>}</div>
                <span style={S.mono(9,"#2a2a2a")}>{t.time}</span>
                <span style={{...S.mono(10,t.done?"#2a2a2a":"#777"),flex:1,textDecoration:t.done?"line-through":"none"}}>{t.action}</span>
                <button onClick={e=>{e.stopPropagation();setTasks(ts=>ts.filter(x=>x.id!==t.id));}} onMouseEnter={e=>e.target.style.color="#ff2244"} onMouseLeave={e=>e.target.style.color="#1a1a1a"} style={{background:"none",border:"none",color:"#1a1a1a",cursor:"pointer",fontSize:11,padding:2,transition:"color .2s"}}>✕</button>
              </div>
            ))}
          </div>
          <div style={{...S.grid(2,8)}}>
            {rules.map(r=>(
              <div key={r.id} onMouseEnter={()=>setHov(r.id)} onMouseLeave={()=>setHov(null)} style={{padding:14,border:`1px solid ${hov===r.id?"#ffffff14":"#0f0f0f"}`,borderRadius:8,background:hov===r.id?"#0d0d0d":"#080808",transition:"all .2s",position:"relative",overflow:"hidden"}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:52,color:"#ffffff04",position:"absolute",top:-4,right:8,lineHeight:1,pointerEvents:"none"}}>{r.id}</div>
                <div style={{fontSize:16,marginBottom:6}}>{r.icon}</div>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:13,color:hov===r.id?"#00ff88":"#ddd",letterSpacing:2,marginBottom:5,transition:"color .2s"}}>{r.title}</div>
                <div style={S.mono(9,"#444")}>{r.body}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:16,background:"#080808",border:"1px solid #141414",borderRadius:8,display:"flex",flexDirection:"column"}}>
          <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:12}}>// SCRIPT_REPOSITORY</div>
          <div style={{...S.row,marginBottom:12,flexWrap:"wrap"}}>
            {Object.entries(DM_SCRIPTS).map(([k,v])=>(
              <button key={k} onClick={()=>setActiveScript(k)} style={S.btn(activeScript===k?"#00ff88":"#2a2a2a")}>{v.label.split(" ")[0]}</button>
            ))}
          </div>
          {Object.entries(DM_SCRIPTS).map(([k,v])=>activeScript===k&&(
            <div key={k} style={{flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center"}}>
                <span style={S.mono(10,"#444")}>{v.label}</span>
                <CopyBtn text={v.script}/>
              </div>
              <div style={{flex:1,padding:12,background:"#050505",border:"1px solid #141414",borderRadius:8,...S.mono(11,"#777"),lineHeight:1.9,whiteSpace:"pre-wrap",direction:v.rtl?"rtl":"ltr",minHeight:140,overflowY:"auto"}}>{v.script}</div>
            </div>
          ))}
          <div style={{marginTop:12,padding:12,background:"#050400",borderRadius:8,border:"1px solid #ffcc0010"}}>
            <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:8}}>10K FORMULA</div>
            <div style={{...S.mono(10,"#444"),lineHeight:2.2}}>
              <span style={{color:"#ffcc00"}}>GOAL</span> = 37,500 SAR<br/>
              <span style={{color:"#ffcc00"}}>SURPLUS</span> = Income − Burn<br/>
              <span style={{color:"#ffcc00"}}>MONTHS</span> = 37,500 ÷ Surplus
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FLOATING SCRIPTS ────────────────────────────────────────────────────────
function FloatScripts() {
  const [open,setOpen] = useState(false);
  const [active,setActive] = useState("arabic");
  return (
    <>
      {open&&(
        <div style={{position:"fixed",bottom:72,right:14,width:"min(330px,90vw)",background:"#0a0a0a",border:"1px solid #00ff8828",borderRadius:10,boxShadow:"0 20px 60px #000000cc",zIndex:800,overflow:"hidden"}}>
          <div style={{padding:"11px 14px",borderBottom:"1px solid #141414",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={S.mono(10,"#00ff88")}>⚡ QUICK SCRIPTS</span>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#2a2a2a",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
          <div style={{padding:"8px 12px",display:"flex",gap:5,borderBottom:"1px solid #0f0f0f",flexWrap:"wrap"}}>
            {Object.entries(DM_SCRIPTS).map(([k,v])=>(
              <button key={k} onClick={()=>setActive(k)} style={S.btn(active===k?"#00ff88":"#2a2a2a")}>{v.label.split(" ")[0]}</button>
            ))}
          </div>
          <div style={{padding:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7,alignItems:"center"}}>
              <span style={S.mono(9,"#3a3a3a")}>{DM_SCRIPTS[active].label}</span>
              <CopyBtn text={DM_SCRIPTS[active].script}/>
            </div>
            <div style={{...S.mono(10,"#666"),lineHeight:1.8,background:"#060606",padding:10,borderRadius:7,border:"1px solid #0f0f0f",whiteSpace:"pre-wrap",maxHeight:190,overflowY:"auto",direction:DM_SCRIPTS[active].rtl?"rtl":"ltr"}}>{DM_SCRIPTS[active].script}</div>
          </div>
        </div>
      )}
      <button onClick={()=>setOpen(!open)} style={{position:"fixed",bottom:14,right:14,width:46,height:46,borderRadius:"50%",background:open?"#ff224818":"#00ff8818",border:`2px solid ${open?"#ff2244":"#00ff88"}`,color:open?"#ff2244":"#00ff88",fontSize:18,cursor:"pointer",boxShadow:`0 0 16px ${open?"#ff224440":"#00ff8840"}`,transition:"all .2s",zIndex:801,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {open?"✕":"💬"}
      </button>
    </>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
const TABS=[
  {id:0,label:"TELEMETRY", sub:"daily log",icon:"📊"},
  {id:1,label:"AGENCY",    sub:"pipeline", icon:"🏢"},
  {id:2,label:"BUDGET",    sub:"burn rate",icon:"💰"},
  {id:3,label:"PROPOSALS", sub:"deals",    icon:"📋"},
  {id:4,label:"INVOICING", sub:"payments", icon:"🧾"},
  {id:5,label:"SVC TIERS", sub:"packages", icon:"💎"},
  {id:6,label:"ARCH",      sub:"rules",    icon:"⚙️"},
];

export default function Dashboard() {
  const [active,setActive]   = useState(0);
  const [booted,setBooted]   = useState(false);
  const [bootStep,setBootStep] = useState(0);
  const [cmdOpen,setCmdOpen] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const mobile = useMobile();
  const [clients] = useLocalState("v5_clients", DEFAULT_CLIENTS);

  const bootMsgs=["LOADING KSA_OS v5.0…","PATCHING MEMORY LEAKS…","APPLYING DATA VALIDATION…","INJECTING BUSINESS LOGIC…","MOUNTING DAILY BURN ENGINE…","SYSTEM READY ✓"];
  useEffect(()=>{ if(bootStep<bootMsgs.length){ const t=setTimeout(()=>setBootStep(s=>s+1),300); return()=>clearTimeout(t); } else setTimeout(()=>setBooted(true),200); },[bootStep]);
  useEffect(()=>{ const h=e=>{ if((e.metaKey||e.ctrlKey)&&e.key==="k"){ e.preventDefault(); setCmdOpen(o=>!o); } if(e.key==="Escape") setCmdOpen(false); }; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[]);

  if(!booted) return (
    <div style={{minHeight:"100vh",background:"#030303",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>
      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:52,color:"#00ff88",letterSpacing:10,textShadow:"0 0 40px #00ff8855"}}>KSA_OS</div>
      <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:240}}>
        {bootMsgs.slice(0,bootStep).map((m,i)=>(
          <div key={i} style={{fontFamily:"monospace",fontSize:10,color:i===bootStep-1?"#00ff88":"#1e1e1e",letterSpacing:1}}>
            <span style={{color:"#141414",marginRight:8}}>›</span>{m}
          </div>
        ))}
      </div>
      <div style={{width:200,height:2,background:"#111",borderRadius:2,overflow:"hidden",marginTop:4}}>
        <div style={{height:"100%",background:"#00ff88",borderRadius:2,transition:"width .3s ease",width:`${(bootStep/bootMsgs.length)*100}%`,boxShadow:"0 0 8px #00ff88"}}/>
      </div>
    </div>
  );

  const Components=[Tab1,Tab2,Tab3,Tab4,Tab5,(p)=><Tab6 {...p} clients={clients}/>,Tab7];
  const ActiveComponent=Components[active];

  return (
    <div style={{minHeight:"100vh",background:"#030303",color:"#fff"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.85)}}
        @keyframes rowIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        .shake{animation:shake .35s ease}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input:focus,select:focus{outline:none;border-color:#00ff8850!important}
        ::-webkit-scrollbar{width:3px;height:3px;background:#0a0a0a}
        ::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}
        select option{background:#111} optgroup{font-style:normal;color:#3a3a3a}
        /* Prevent iOS font zoom */
        input,select,textarea{font-size:max(16px,11px)}
      `}</style>

      {/* Sticky header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:mobile?"10px 12px":"11px 22px",borderBottom:"1px solid #0d0d0d",background:"#020202",position:"sticky",top:0,zIndex:300}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:5,whiteSpace:"nowrap"}}>KSA<span style={{color:"#00ff88"}}>_OS</span> <span style={{fontSize:10,color:"#1e1e1e",letterSpacing:2}}>v5</span></div>
          {!mobile&&<><div style={{width:1,height:15,background:"#181818"}}/><RevTicker clients={clients}/></>}
          {!mobile&&<div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 6px #00ff88",animation:"pulse 2s infinite"}}/>
            <span style={S.mono(8,"#00ff88")}>LIVE · DEBOUNCED</span>
          </div>}
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <button onClick={()=>setCmdOpen(true)} style={{padding:"5px 10px",borderRadius:6,background:"#0d0d0d",border:"1px solid #1e1e1e",color:"#2a2a2a",cursor:"pointer",fontFamily:"monospace",fontSize:9,display:"flex",gap:5,alignItems:"center",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ff8830";e.currentTarget.style.color="#00ff88";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e1e1e";e.currentTarget.style.color="#2a2a2a";}}>
            <span>⌘K</span>{!mobile&&<span>CMD</span>}
          </button>
          {mobile&&<button onClick={()=>setMenuOpen(!menuOpen)} style={{padding:"5px 9px",borderRadius:5,background:"#0d0d0d",border:"1px solid #1e1e1e",color:"#444",cursor:"pointer",fontSize:13}}>☰</button>}
          {!mobile&&<span style={S.mono(9,"#1a1a1a")}>{isoToday()}</span>}
        </div>
      </div>

      {/* Mobile full-screen menu */}
      {mobile&&menuOpen&&(
        <div style={{position:"fixed",inset:0,background:"#000000f0",zIndex:400,display:"flex",flexDirection:"column",paddingTop:52}} onClick={()=>setMenuOpen(false)}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setActive(t.id);setMenuOpen(false);}} style={{padding:"16px 22px",background:active===t.id?"#00ff8806":"transparent",border:"none",borderBottom:"1px solid #141414",cursor:"pointer",display:"flex",gap:12,alignItems:"center",textAlign:"left"}}>
              <span style={{fontSize:20}}>{t.icon}</span>
              <div>
                <div style={{fontFamily:"monospace",fontSize:13,color:active===t.id?"#00ff88":"#666",fontWeight:700,letterSpacing:2}}>{t.label}</div>
                <div style={S.mono(9,"#2a2a2a")}>{t.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Desktop tabs */}
      {!mobile&&(
        <div style={{display:"flex",borderBottom:"1px solid #0d0d0d",background:"#020202",padding:"0 14px",overflowX:"auto",position:"sticky",top:44,zIndex:200}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActive(t.id)} style={{padding:"9px 14px",background:"none",border:"none",cursor:"pointer",borderBottom:`2px solid ${active===t.id?"#00ff88":"transparent"}`,transition:"all .2s",flexShrink:0}}>
              <div style={{fontFamily:"monospace",fontSize:10,color:active===t.id?"#00ff88":"#2a2a2a",letterSpacing:2,fontWeight:700,whiteSpace:"nowrap"}}>{t.icon} {t.label}</div>
              <div style={S.mono(8,active===t.id?"#00ff8840":"#141414")}>{t.sub}</div>
            </button>
          ))}
        </div>
      )}

      {/* Mobile icon tabs */}
      {mobile&&(
        <div style={{display:"flex",borderBottom:"1px solid #0d0d0d",background:"#020202",overflowX:"auto",position:"sticky",top:44,zIndex:200}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActive(t.id)} style={{padding:"9px 13px",background:"none",border:"none",cursor:"pointer",borderBottom:`2px solid ${active===t.id?"#00ff88":"transparent"}`,flexShrink:0,fontSize:17,opacity:active===t.id?1:.4,transition:"opacity .2s"}}>{t.icon}</button>
          ))}
        </div>
      )}

      {/* Page content */}
      <div key={active} style={{padding:mobile?"12px 10px":"20px 22px",maxWidth:1180,margin:"0 auto",animation:"fadeSlide .2s ease"}}>
        <ActiveComponent mobile={mobile}/>
      </div>

      {cmdOpen&&<CmdPalette onNav={i=>{setActive(i);setCmdOpen(false);}} onClose={()=>setCmdOpen(false)}/>}
      <FloatScripts/>
    </div>
  );
}
