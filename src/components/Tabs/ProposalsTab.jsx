import React, { useState, useEffect, useMemo } from "react";
import { useLocalState } from "../../hooks/useLocalState";
import { safeNum, exportCSV } from "../../utils";
import { DEFAULT_PROPOSALS } from "../../constants";
import { S, NumInput } from "../UI";

const PROP_S = ["Draft","Sent","Viewed","Accepted","Rejected"];
const PROP_C = {Draft:"#555",Sent:"#ffcc00",Viewed:"#ff8833",Accepted:"#00ff88",Rejected:"#ff2244"};

export function ProposalsTab({mobile}) {
  const [proposals,setProposals] = useLocalState("v5_proposals",DEFAULT_PROPOSALS);
  const [showAdd,setShowAdd]     = useState(false);
  const [newP,setNewP]           = useState({client:"",value:"",status:"Draft",date:"",notes:""});
  const [search, setSearch]      = useState("");

  useEffect(()=>{ const h=()=>exportCSV(proposals,"proposals.csv"); document.addEventListener("csv_prop",h); return()=>document.removeEventListener("csv_prop",h); },[proposals]);

  const totalWon = proposals.filter(p=>p.status==="Accepted").reduce((a,p)=>a+p.value,0);
  const winRate  = proposals.length?Math.round((proposals.filter(p=>p.status==="Accepted").length/proposals.length)*100):0;

  const addP=()=>{ if(!newP.client.trim())return; setProposals(ps=>[...ps,{id:crypto.randomUUID(),...newP,value:safeNum(newP.value)}]); setNewP({client:"",value:"",status:"Draft",date:"",notes:""}); setShowAdd(false); };
  const upd=(id,f,v)=>setProposals(ps=>ps.map(p=>p.id===id?{...p,[f]:f==="value"?safeNum(v):v}:p));

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => p.client.toLowerCase().includes(search.toLowerCase()) || (p.notes && p.notes.toLowerCase().includes(search.toLowerCase())));
  }, [proposals, search]);

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
        <div style={{display: "flex", alignItems: "center", gap: 15}}>
          <div style={S.label}>// PROPOSALS ({filteredProposals.length})</div>
          <input
            placeholder="Search proposals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{...S.input, padding: "4px 8px", fontSize: 10, width: 150}}
          />
        </div>
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
            {filteredProposals.map(p=>(
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
