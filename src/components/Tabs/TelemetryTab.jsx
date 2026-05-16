import React, { useState, useEffect, useMemo } from "react";
import { useLocalState } from "../../hooks/useLocalState";
import { useAnimNum } from "../../hooks/useAnimNum";
import { isoToday, rowXP, xpColor, safeNum, exportCSV } from "../../utils";
import { NON_NEGS, DM_TARGET } from "../../constants";
import { S, Bit, Bar, NumInput } from "../UI";

function XPTrend({ rows }) {
  const last14 = useMemo(() => rows.slice(-14).map(r => rowXP(r)), [rows]);
  if (last14.length < 2) return null;

  const width = 200;
  const height = 40;
  const padding = 5;
  const points = last14.map((xp, i) => {
    const x = (i / (last14.length - 1)) * (width - 2 * padding) + padding;
    const y = height - (xp / 100) * (height - 2 * padding) - padding;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ marginTop: 10, background: "#050505", borderRadius: 4, padding: 8, border: "1px solid #141414" }}>
      <div style={{ ...S.mono(8, "#2a2a2a"), marginBottom: 4, letterSpacing: 1 }}>XP TREND (14D)</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="#00ff88"
          strokeWidth="1.5"
          points={points}
          style={{ transition: "all 0.5s ease" }}
        />
        {last14.map((xp, i) => {
          const x = (i / (last14.length - 1)) * (width - 2 * padding) + padding;
          const y = height - (xp / 100) * (height - 2 * padding) - padding;
          return <circle key={i} cx={x} cy={y} r="2" fill={xpColor(xp)} />;
        })}
      </svg>
    </div>
  );
}

export function TelemetryTab({mobile, rows, setRows}) {
  const [nnDone,setNnDone] = useLocalState("v5_nn",{});
  const today = isoToday(); // "YYYY-MM-DD" — stable across all locales and devices
  const [form,setForm]   = useState({date:today,health:0,dmsSent:0,delivery:0,finLogged:0,finDisc:0,note:""});
  const [editNote,setEditNote] = useState(null);
  const [delId,setDelId] = useState(null);
  const [committed,setCommitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(()=>{ if(localStorage.getItem("v5_nn_date")!==today){ setNnDone({}); localStorage.setItem("v5_nn_date",today); } },[today]);
  useEffect(()=>{ const h=()=>exportCSV(rows,"telemetry.csv"); document.addEventListener("csv_telem",h); return()=>document.removeEventListener("csv_telem",h); },[rows]);

  const avg     = rows.length ? Math.round(rows.reduce((a,r)=>a+rowXP(r),0)/rows.length) : 0;
  const animAvg = useAnimNum(avg);
  const streak  = useMemo(()=>{ let s=0; for(let i=rows.length-1;i>=0;i--){ if(rowXP(rows[i])>=80)s++; else break; } return s; },[rows]);
  const nnCount = NON_NEGS.filter(n=>nnDone[n.id]).length;

  const commit = () => {
    if (!form.date.trim()) {
      setError("Date is required");
      return;
    }
    setError("");
    setRows(rs=>[...rs,{id:crypto.randomUUID(),...form,dmsSent:safeNum(form.dmsSent,0)}]);
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
              <input value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} placeholder="MM/DD" style={{...S.input,width:72,fontSize:12, borderColor: error ? "#ff2244" : "#222"}}/>
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
            {error && <div style={{...S.mono(10, "#ff2244"), marginTop: 8}}>{error}</div>}
          </div>

          <div style={{marginTop:8,display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>exportCSV(rows,"telemetry.csv")} style={S.btn("#3a3a3a")} onMouseEnter={e=>e.currentTarget.style.color="#00ff88"} onMouseLeave={e=>e.currentTarget.style.color="#3a3a3a"}>⬇ EXPORT CSV</button>
          </div>
        </div>

        {/* Right: non-negotiables & Trends */}
        <div style={{display: "flex", flexDirection: "column", gap: 14}}>
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
          <XPTrend rows={rows} />
        </div>
      </div>
    </div>
  );
}
