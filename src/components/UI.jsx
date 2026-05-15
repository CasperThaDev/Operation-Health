import React, { useState, useEffect } from "react";
import { safeNum } from "../utils";

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
export const S = {
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

export function Bit({val,onClick}) {
  const [f,setF]=useState(false); const c=val?"#00ff88":"#ff2244";
  return <button onClick={()=>{if(onClick){setF(true);setTimeout(()=>setF(false),200);onClick();}}} style={{width:30,height:30,borderRadius:4,cursor:onClick?"pointer":"default",background:`${c}18`,border:`1.5px solid ${c}`,color:c,fontFamily:"monospace",fontWeight:900,fontSize:13,lineHeight:"30px",textAlign:"center",boxShadow:f?`0 0 18px ${c}`:`0 0 5px ${c}44`,transition:"all .18s",outline:"none",transform:f?"scale(1.18)":"scale(1)"}}>{val}</button>;
}

export function Bar({pct,color="#00ff88",h=3,animate=true}) {
  const [w,setW]=useState(animate?0:pct);
  useEffect(()=>{if(animate){const t=setTimeout(()=>setW(Math.min(pct,100)),60);return()=>clearTimeout(t);} else setW(Math.min(pct,100));},[pct]);
  return <div style={{width:"100%",height:h,background:"#181818",borderRadius:2,overflow:"hidden"}}><div style={{width:`${w}%`,height:"100%",background:color,borderRadius:2,transition:animate?"width .7s cubic-bezier(.4,0,.2,1)":"none",boxShadow:`0 0 4px ${color}88`}}/></div>;
}

export function NumInput({value,onChange,min=0,max,placeholder,style={}}) {
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

export function CopyBtn({text}) {
  const [c,setC]=useState(false);
  return <button onClick={()=>{navigator.clipboard.writeText(text).then(()=>{setC(true);setTimeout(()=>setC(false),2000)});}} style={S.btn(c?"#00ff88":"#444")}>{c?"✓ COPIED":"COPY"}</button>;
}

export function Pill({label,color}) {
  return <span style={{fontSize:10,padding:"3px 9px",borderRadius:4,background:`${color}14`,color,border:`1px solid ${color}28`,fontFamily:"monospace",whiteSpace:"nowrap"}}>{label}</span>;
}
