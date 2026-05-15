import React, { useState, useEffect } from "react";
import { useLocalState } from "./hooks/useLocalState";
import { useMobile } from "./hooks/useMobile";
import { isoToday } from "./utils";
import { DEFAULT_CLIENTS } from "./constants";
import { S } from "./components/UI";
import { RevTicker } from "./components/RevTicker";
import { CmdPalette } from "./components/CmdPalette";
import { FloatScripts } from "./components/FloatScripts";
import { DataSync } from "./components/DataSync";
import { TelemetryTab } from "./components/Tabs/TelemetryTab";
import { AgencyTab } from "./components/Tabs/AgencyTab";
import { BudgetTab } from "./components/Tabs/BudgetTab";
import { ProposalsTab } from "./components/Tabs/ProposalsTab";
import { InvoicingTab } from "./components/Tabs/InvoicingTab";
import { ServiceTiersTab } from "./components/Tabs/ServiceTiersTab";
import { ArchitectureTab } from "./components/Tabs/ArchitectureTab";

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

  const Components=[TelemetryTab, AgencyTab, BudgetTab, ProposalsTab, InvoicingTab, (p)=><ServiceTiersTab {...p} clients={clients}/>, ArchitectureTab];
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
          {!mobile && <DataSync />}
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
          <div style={{padding: 22, marginTop: "auto", borderTop: "1px solid #141414"}}>
            <DataSync />
          </div>
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
