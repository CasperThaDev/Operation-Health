import React, { useState, useMemo } from "react";
import { useLocalState } from "../../hooks/useLocalState";
import { useAnimNum } from "../../hooks/useAnimNum";
import { safeNum } from "../../utils";
import { DEFAULT_BUDGET, DEFAULT_INCOME, DEFAULT_GOAL } from "../../constants";
import { S, Bar, NumInput } from "../UI";

export function BudgetTab({mobile}) {
  const [income,setIncome] = useLocalState("v5_income", DEFAULT_INCOME);
  const [goal, setGoal] = useLocalState("v5_goal", DEFAULT_GOAL);
  const [items,setItems]   = useLocalState("v5_budget",DEFAULT_BUDGET);
  const [newItem,setNewItem] = useState({cat:"Personal",name:"",budget:"",actual:""});
  const [showAdd,setShowAdd] = useState(false);

  const totalBudget = useMemo(()=>items.reduce((a,i)=>a+i.budget,0),[items]);
  const totalActual = useMemo(()=>items.reduce((a,i)=>a+i.actual,0),[items]);
  const surplus     = income - totalActual;
  const dailyBurn   = +(totalActual/30).toFixed(0);
  const dailyIncome = +(income/30).toFixed(0);
  const dailyNet    = dailyIncome - dailyBurn;
  const daysToGoal  = surplus>0 ? Math.ceil(goal/surplus*30) : null;
  const animS       = useAnimNum(surplus);
  const animBurn    = useAnimNum(dailyBurn);

  const upd=(id,f,v)=>setItems(is=>is.map(i=>i.id===id?{...i,[f]:["budget","actual"].includes(f)?safeNum(v):v}:i));
  const addItem=()=>{
    if(!newItem.name.trim())return;
    setItems(is=>[...is,{id:crypto.randomUUID(),...newItem,budget:safeNum(newItem.budget),actual:safeNum(newItem.actual)}]);
    setNewItem({cat:"Personal",name:"",budget:"",actual:""}); setShowAdd(false);
  };

  return (
    <div>
      {/* Top KPIs */}
      <div style={{...S.grid(mobile?2:4), marginBottom:12}}>
        <div style={S.card("#00ccff")}>
          <div style={S.label}>INCOME</div>
          <NumInput value={income} onChange={setIncome} min={0} style={{background:"none",border:"none",fontFamily:"'Bebas Neue',cursive",fontSize:34,color:"#00ccff",width:"100%",padding:0}}/>
          <div style={{...S.mono(9,"#2a2a2a"),marginTop:4}}>SAR / month</div>
        </div>
        <div style={S.card("#ffcc00")}>
          <div style={S.label}>SAVINGS GOAL</div>
          <NumInput value={goal} onChange={setGoal} min={0} style={{background:"none",border:"none",fontFamily:"'Bebas Neue',cursive",fontSize:34,color:"#ffcc00",width:"100%",padding:0}}/>
          <div style={{...S.mono(9,"#2a2a2a"),marginTop:4}}>SAR target</div>
        </div>
        {[
          {l:"TOTAL BURN",   v:totalActual.toLocaleString(), c:"#ff2244",   s:"SAR spent"},
          {l:"NET SURPLUS",  v:`${animS>=0?"+":""}${animS.toLocaleString()}`, c:surplus>=0?"#00ff88":"#ff2244", s:"SAR/mo"},
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
            {l:"DAYS TO GOAL",  v:daysToGoal?`${daysToGoal}d`:"∞",    c:"#ffcc00", s:"at current rate"},
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
          <span style={S.mono(10,"#555")}>Every day you miss your 50 DMs costs you <strong style={{color:"#ff8833"}}>{dailyBurn.toLocaleString()} SAR</strong> in opportunity drift. At current surplus, your goal moves <strong style={{color:"#ff8833"}}>{surplus>0?Math.round(goal/surplus/30):"∞"} day(s) further away</strong> for every missed outreach day.</span>
        </div>
      </div>

      {/* Goal bar */}
      <div style={{padding:"12px 14px",background:"#090909",border:"1px solid #141414",borderRadius:8,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4}}>
          <span style={S.mono(9,"#2a2a2a")}>SAVINGS GOAL: {goal.toLocaleString()} SAR</span>
          <span style={S.mono(9,surplus>0?"#00ff88":"#ff2244")}>{surplus>0?`+${surplus.toLocaleString()}`:surplus.toLocaleString()} SAR/mo → {surplus>0?(goal/surplus).toFixed(1):"∞"} months</span>
        </div>
        <Bar pct={Math.min(Math.max((surplus/goal)*100*7,0),100)} color="linear-gradient(90deg,#00ff88,#00ccff)" h={5}/>
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
