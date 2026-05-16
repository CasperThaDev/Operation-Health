import React, { useState, useEffect, useRef } from "react";
import { S } from "./UI";
import { TABS } from "../constants";

export function CmdPalette({onNav,onClose}) {
  const [q,setQ]=useState(""); const ref=useRef();
  useEffect(()=>ref.current?.focus(),[]);

  const cmds = [
    ...TABS.map(tab => ({
      l: `${tab.label.charAt(0) + tab.label.slice(1).toLowerCase()} — ${tab.sub}`,
      icon: tab.icon,
      a: () => onNav(tab.id)
    })),
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
