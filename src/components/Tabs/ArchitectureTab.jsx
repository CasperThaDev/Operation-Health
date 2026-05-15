import React, { useState, useRef } from "react";
import { useLocalState } from "../../hooks/useLocalState";
import { DM_SCRIPTS } from "../../constants";
import { S, CopyBtn } from "../UI";

export function ArchitectureTab({mobile}) {
  const [tasks,setTasks]  = useLocalState("v5_tasks",[
    {id:1,time:"06:00",action:"16oz water + sunlight",done:false},
    {id:2,time:"06:30",action:"30 min gym",done:false},
    {id:3,time:"08:00",action:"Send 50 DMs (Arabic first)",done:false},
    {id:4,time:"12:00",action:"Deliver all pending edits",done:false},
    {id:5,time:"18:00",action:"Log every riyal",done:false},
    {id:6,time:"21:00",action:"SUN: Weekly XP audit",done:false},
  ]);
  const [newTask,setNewTask] = useState({time:"",action:""});
  const [showAdd,setShowAdd] = useState(false);
  const [hov,setHov] = useState(null);
  const [activeScript,setActiveScript] = useState("arabic");
  const done = tasks.filter(t=>t.done).length;
  const rules=[
    {id:"01",icon:"⚡",title:"IDENTITY PROTOCOL",body:"\"I am a high-performance system. I do not 'try,' I execute.\""},
    {id:"02",icon:"📱",title:"KSA META",body:"WhatsApp > Everything. Speed is the only advantage. Reply under 1 hour."},
    {id:"03",icon:"🔒",title:"FINANCIAL CONSTRAINT",body:"Zero non-essential spending until $10,000 / 37,500 SAR milestone."},
    {id:"04",icon:"⚠️",title:"THE ANTI-VISION",body:"\"Missed DMs + junk food = choosing to stay broke and tired for 5 more years.\""},
  ];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:16}}>
        <div>
          <div style={{padding:14,background:"#090909",border:"1px solid #141414",borderRadius:8,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={S.label}>DAILY PROTOCOL</div>
              <div style={S.row}>
                <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:done===tasks.length?"#00ff88":"#ffcc00"}}>{done}/{tasks.length}</span>
                <button onClick={()=>setShowAdd(!showAdd)} style={S.btn(showAdd?"#ff2244":"#00ff88","")}>{showAdd?"✕":"+TASK"}</button>
              </div>
            </div>
            {showAdd&&<div style={{...S.row,marginBottom:10}}>
              <input placeholder="HH:MM" value={newTask.time} onChange={e=>setNewTask(n=>({...n,time:e.target.value}))} style={{...S.input,width:65}}/>
              <input placeholder="Action..." value={newTask.action} onChange={e=>setNewTask(n=>({...n,action:e.target.value}))} style={{...S.input,flex:1}}/>
              <button onClick={()=>{if(newTask.action){setTasks(ts=>[...ts,{id:crypto.randomUUID(),...newTask,done:false}]);setNewTask({time:"",action:""});setShowAdd(false);}}} style={{...S.btn("#00ff88"),background:"#00ff88",color:"#000",border:"none"}}>ADD</button>
            </div>}
            {tasks.map(t=>(
              <div key={t.id} onClick={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:!x.done}:x))} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:5,cursor:"pointer",background:t.done?"#00ff8806":"#050505",border:`1px solid ${t.done?"#00ff8818":"#0d0d0d"}`,transition:"all .18s",opacity:t.done?.5:1,marginBottom:4}}>
                <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${t.done?"#00ff88":"#2a2a2a"}`,background:t.done?"#00ff8815":"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .18s"}}>{t.done&&<span style={{color:"#00ff88",fontSize:9,fontWeight:900}}>✓</span>}</div>
                <span style={S.mono(9,"#2a2a2a")}>{t.time}</span>
                <span style={{...S.mono(10,t.done?"#2a2a2a":"#777"),flex:1,textDecoration:t.done?"line-through":"none"}}>{t.action}</span>
                <button onClick={e=>{e.stopPropagation();setTasks(ts=>ts.filter(x=>x.id!==t.id));}} onMouseEnter={e=>e.target.style.color="#ff2244"} onMouseLeave={e=>e.target.style.color="#1a1a1a"} style={{background:"none",border:"none",color:"#1a1a1a",cursor:"pointer",fontSize:11,padding:2,transition:"color .2s"}}>✕</button>
              </div>
            ))}
          </div>
          <div style={{...S.grid(2,8)}}>
            {rules.map(r=>(
              <div key={r.id} onMouseEnter={()=>setHov(r.id)} onMouseLeave={()=>setHov(null)} style={{padding:14,border:`1px solid ${hov===r.id?"#ffffff14":"#0f0f0f"}`,borderRadius:8,background:hov===r.id?"#0d0d0d":"#080808",transition:"all .2s",position:"relative",overflow:"hidden"}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:52,color:"#ffffff04",position:"absolute",top:-4,right:8,lineHeight:1,pointerEvents:"none"}}>{r.id}</div>
                <div style={{fontSize:16,marginBottom:6}}>{r.icon}</div>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:13,color:hov===r.id?"#00ff88":"#ddd",letterSpacing:2,marginBottom:5,transition:"color .2s"}}>{r.title}</div>
                <div style={S.mono(9,"#444")}>{r.body}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:16,background:"#080808",border:"1px solid #141414",borderRadius:8,display:"flex",flexDirection:"column"}}>
          <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:12}}>// SCRIPT_REPOSITORY</div>
          <div style={{...S.row,marginBottom:12,flexWrap:"wrap"}}>
            {Object.entries(DM_SCRIPTS).map(([k,v])=>(
              <button key={k} onClick={()=>setActiveScript(k)} style={S.btn(activeScript===k?"#00ff88":"#2a2a2a")}>{v.label.split(" ")[0]}</button>
            ))}
          </div>
          {Object.entries(DM_SCRIPTS).map(([k,v])=>activeScript===k&&(
            <div key={k} style={{flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center"}}>
                <span style={S.mono(10,"#444")}>{v.label}</span>
                <CopyBtn text={v.script}/>
              </div>
              <div style={{flex:1,padding:12,background:"#050505",border:"1px solid #141414",borderRadius:8,...S.mono(11,"#777"),lineHeight:1.9,whiteSpace:"pre-wrap",direction:v.rtl?"rtl":"ltr",minHeight:140,overflowY:"auto"}}>{v.script}</div>
            </div>
          ))}
          <div style={{marginTop:12,padding:12,background:"#050400",borderRadius:8,border:"1px solid #ffcc0010"}}>
            <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:8}}>10K FORMULA</div>
            <div style={{...S.mono(10,"#444"),lineHeight:2.2}}>
              <span style={{color:"#ffcc00"}}>GOAL</span> = 37,500 SAR<br/>
              <span style={{color:"#ffcc00"}}>SURPLUS</span> = Income − Burn<br/>
              <span style={{color:"#ffcc00"}}>MONTHS</span> = 37,500 ÷ Surplus
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
