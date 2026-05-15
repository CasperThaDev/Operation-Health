import React, { useRef, useEffect, useState } from "react";
import { useAnimNum } from "../hooks/useAnimNum";

export function RevTicker({clients}) {
  const active=clients.filter(c=>["Active","Trial Sent"].includes(c.status)).reduce((a,c)=>a+c.sar,0);
  const anim=useAnimNum(active); const prev=useRef(active); const [flash,setFlash]=useState(false);
  useEffect(()=>{if(prev.current!==active){setFlash(true);setTimeout(()=>setFlash(false),700);prev.current=active;}},[active]);
  return <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 12px",border:`1px solid ${flash?"#00ff8855":"#111"}`,borderRadius:20,background:flash?"#00ff8806":"transparent",transition:"all .3s"}}>
    <div style={{width:5,height:5,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 6px #00ff88",animation:"pulse 2s infinite"}}/>
    <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,color:flash?"#00ff88":"#2a2a2a",transition:"color .3s",letterSpacing:1}}>{anim.toLocaleString()} SAR/mo</span>
  </div>;
}
