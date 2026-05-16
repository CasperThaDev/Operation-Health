import React, { useState } from "react";
import { S, CopyBtn } from "./UI";
import { DM_SCRIPTS } from "../constants";

export function FloatScripts() {
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
