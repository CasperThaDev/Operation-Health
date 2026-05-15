import React, { useState, useEffect, useMemo } from "react";
import { useLocalState } from "../../hooks/useLocalState";
import { useAnimNum } from "../../hooks/useAnimNum";
import { safeNum, exportCSV } from "../../utils";
import { DEFAULT_CLIENTS, PHASES, TIER1_NICHES, TIER2_NICHES, STATUS_OPTIONS, STATUS_COLORS, TIER_COLORS, SERVICE_TIERS } from "../../constants";
import { S, Pill, NumInput } from "../UI";

export function AgencyTab({mobile}) {
  const [clients,setClients] = useLocalState("v5_clients",DEFAULT_CLIENTS);
  const [showAdd,setShowAdd] = useState(false);
  const [newC,setNewC]       = useState({name:"",tier:1,niche:"Gym",status:"DM Sent",serviceTier:"basic",lastContact:"",followUp:"",sar:"",notes:"",platform: "", contactLink: ""});
  const [addTouched,setAddTouched] = useState(false); // tracks whether ADD was attempted
  const [expandId,setExpandId]     = useState(null);
  const [activePhase,setActivePhase] = useLocalState("v5_phase",1);
  const [filter,setFilter]   = useState("ALL");

  useEffect(()=>{ const h=()=>exportCSV(clients,"clients.csv"); document.addEventListener("csv_clients",h); return()=>document.removeEventListener("csv_clients",h); },[clients]);

  const activeSAR = useMemo(()=>clients.filter(c=>["Active","Trial Sent"].includes(c.status)).reduce((a,c)=>a+c.sar,0),[clients]);
  const pipelineSAR = useMemo(()=>clients.reduce((a,c)=>a+c.sar,0),[clients]);

  const addClient=()=>{
    const nameOk = newC.name.trim().length > 0;
    const sarOk  = safeNum(newC.sar) > 0;
    if (!nameOk || !sarOk) { setAddTouched(true); return; }
    const sar = safeNum(newC.sar);
    setClients(cs=>[...cs,{id:crypto.randomUUID(),...newC,sar}]);
    setNewC({name:"",tier:1,niche:"Gym",status:"DM Sent",serviceTier:"basic",lastContact:"",followUp:"",sar:"",notes:"",platform: "", contactLink: ""});
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
            {addTouched&&!(safeNum(newC.sar)>0)&&<span style={{...S.mono(8,"#ff2244"),letterSpacing:1}}>⚠ SAR &gt; 0</span>}
          </div>
          {[["lastContact","Last MM/DD",100],["followUp","Follow-up",100],["platform","Platform",80],["contactLink","Link",100],["notes","Notes",150]].map(([k,ph,w])=>(
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
            <div onClick={()=>setExpandId(expandId===c.id?null:c.id)} style={{display:"flex",gap:8,padding:"11px 12px",borderRadius:expandId===c.id?"8px 8px 0 0":8,cursor:"pointer",alignItems:"center",border:`1px solid ${expandId===c.id?"#ffffff12":"#0f0f0f"}`,borderLeft:`3px solid ${tc}`,background:expandId===c.id?"#0d0d0d":"#080808",transition:"all .15s",flexWrap:"wrap"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:tc,boxShadow:`0 0 4px ${tc}`,flexShrink:0}}/>
              <div style={{flex:1,minWidth:100}}>
                <span style={S.mono(12,"#ccc")}><strong>{c.name}</strong></span>
                <span style={{...S.mono(9,"#2a2a2a"),marginLeft:8}}>{c.niche} {c.platform && `· ${c.platform}`}</span>
              </div>
              {!mobile&&c.contactLink&&<a href={c.contactLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{...S.mono(9,"#4488ff"), textDecoration: "none", borderBottom: "1px solid #4488ff44"}}>OPEN LINK</a>}
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
                {[["LAST","lastContact",90],["FOLLOW-UP","followUp",90],["PLATFORM", "platform", 80], ["LINK", "contactLink", 120], ["NOTES","notes",170]].map(([lbl,f,w])=>(
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
