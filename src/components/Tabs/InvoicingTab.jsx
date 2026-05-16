import React, { useState, useEffect, useMemo } from "react";
import { useLocalState } from "../../hooks/useLocalState";
import { useAnimNum } from "../../hooks/useAnimNum";
import { safeNum, exportCSV } from "../../utils";
import { DEFAULT_INVOICES } from "../../constants";
import { S, NumInput } from "../UI";

const INV_S = ["Pending","Sent","Paid","Overdue"];
const INV_C = {Pending:"#ffcc00",Sent:"#00ccff",Paid:"#00ff88",Overdue:"#ff2244"};

export function InvoicingTab({mobile}) {
  const [invoices,setInvoices] = useLocalState("v5_invoices",DEFAULT_INVOICES);
  const [showAdd,setShowAdd]   = useState(false);
  const [newI,setNewI]         = useState({client:"",amount:"",status:"Pending",issued:"",due:"",notes:""});
  const [search, setSearch]    = useState("");

  useEffect(()=>{ const h=()=>exportCSV(invoices,"invoices.csv"); document.addEventListener("csv_inv",h); return()=>document.removeEventListener("csv_inv",h); },[invoices]);

  const paid    = useMemo(()=>invoices.filter(i=>i.status==="Paid").reduce((a,i)=>a+i.amount,0),[invoices]);
  const animP   = useAnimNum(paid);
  const outstanding = useMemo(()=>invoices.filter(i=>i.status!=="Paid").reduce((a,i)=>a+i.amount,0),[invoices]);
  const overdue = invoices.filter(i=>i.status==="Overdue").length;

  const addI=()=>{ if(!newI.client.trim())return; setInvoices(is=>[...is,{id:crypto.randomUUID(),...newI,amount:safeNum(newI.amount)}]); setNewI({client:"",amount:"",status:"Pending",issued:"",due:"",notes:""}); setShowAdd(false); };
  const upd=(id,f,v)=>setInvoices(is=>is.map(i=>i.id===id?{...i,[f]:f==="amount"?safeNum(v):f==="tier"?safeNum(v):v}:i));

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => i.client.toLowerCase().includes(search.toLowerCase()) || (i.notes && i.notes.toLowerCase().includes(search.toLowerCase())));
  }, [invoices, search]);

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
        <div style={{display: "flex", alignItems: "center", gap: 15}}>
          <div style={S.label}>// INVOICE LEDGER ({filteredInvoices.length})</div>
          <input
            placeholder="Search invoices..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{...S.input, padding: "4px 8px", fontSize: 10, width: 150}}
          />
        </div>
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
            {filteredInvoices.map(inv=>(
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
