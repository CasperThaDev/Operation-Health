import React, { useMemo } from "react";
import { useLocalState } from "../../hooks/useLocalState";
import { useAnimNum } from "../../hooks/useAnimNum";
import { SERVICE_TIERS } from "../../constants";
import { S, Bar } from "../UI";

export function ServiceTiersTab({clients}) {
  const [activeTier,setActiveTier] = useLocalState("v5_svc_tier","growth");
  const tierStats = useMemo(()=>
    SERVICE_TIERS.map(t=>({
      ...t,
      clientCount: clients.filter(c=>c.serviceTier===t.id).length,
      totalSAR:    clients.filter(c=>c.serviceTier===t.id).reduce((a,c)=>a+c.sar,0),
    }))
  ,[clients]);
  const totalServiceRevenue = tierStats.reduce((a,t)=>a+t.totalSAR,0);
  const animTotal = useAnimNum(totalServiceRevenue);

  return (
    <div>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:36,color:"#fff",letterSpacing:3,marginBottom:4}}>AGENCY SERVICE <span style={{color:"#00ff88"}}>TIERS</span></div>
        <div style={S.mono(11,"#3a3a3a")}>Assign every client to a tier. This is how you scale from survival to 100k SAR.</div>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:"#00ff88",marginTop:10}}>TOTAL TIER REVENUE: {animTotal.toLocaleString()} <span style={S.mono(14,"#333")}>SAR/mo</span></div>
      </div>

      {/* Live stats per tier */}
      <div style={{...S.grid(3,12),marginBottom:24}}>
        {tierStats.map(t=>(
          <div key={t.id} style={{padding:20,borderRadius:10,border:`2px solid ${t.color}30`,background:activeTier===t.id?`${t.color}08`:"#080808",position:"relative",transition:"all .2s",cursor:"pointer",transform:activeTier===t.id?"translateY(-3px)":"none",boxShadow:activeTier===t.id?`0 16px 32px ${t.color}14`:"none"}} onClick={()=>setActiveTier(t.id)}>
            <div style={{position:"absolute",top:-9,right:12,background:t.color,color:t.color==="#ffcc00"||t.color==="#00ff88"?"#000":"#000",fontFamily:"monospace",fontSize:8,fontWeight:900,padding:"2px 10px",borderRadius:10,letterSpacing:2}}>{t.badge}</div>
            <div style={S.label}>{t.name}</div>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:36,color:t.color,lineHeight:1,marginBottom:4,textShadow:`0 0 16px ${t.color}44`}}>{t.sarPrice.toLocaleString()} <span style={S.mono(12,"#333")}>SAR/mo</span></div>
            <div style={{display:"flex",gap:14,marginTop:10,marginBottom:14}}>
              <div><div style={S.label}>CLIENTS</div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:t.clientCount>0?t.color:"#2a2a2a"}}>{t.clientCount}</div></div>
              <div><div style={S.label}>REVENUE</div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:t.totalSAR>0?t.color:"#2a2a2a"}}>{t.totalSAR.toLocaleString()}</div></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {t.features.map((f,i)=>(
                <div key={i} style={S.row}>
                  <span style={{color:t.color,fontSize:10}}>✓</span>
                  <span style={S.mono(10,"#666")}>{f}</span>
                </div>
              ))}
            </div>
            {activeTier===t.id&&<div style={{marginTop:12,padding:"7px 10px",background:`${t.color}18`,borderRadius:5,border:`1px solid ${t.color}28`,textAlign:"center",...S.mono(10,t.color),fontWeight:700}}>✓ SELECTED DEFAULT</div>}
          </div>
        ))}
      </div>

      {/* Assigned clients breakdown */}
      <div style={{padding:16,background:"#090909",border:"1px solid #141414",borderRadius:8}}>
        <div style={{...S.mono(9,"#2a2a2a"),letterSpacing:3,marginBottom:12}}>// CLIENT — TIER BREAKDOWN</div>
        {tierStats.map(t=>(
          <div key={t.id} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,flexWrap:"wrap",gap:4}}>
              <span style={S.mono(10,t.color)}>{t.name}</span>
              <span style={S.mono(9,"#2a2a2a")}>{t.clientCount} clients · {t.totalSAR.toLocaleString()} SAR</span>
            </div>
            <Bar pct={totalServiceRevenue?((t.totalSAR/totalServiceRevenue)*100):0} color={t.color} h={5} animate={false}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
              {clients.filter(c=>c.serviceTier===t.id).map(c=>(
                <div key={c.id} style={{padding:"3px 10px",borderRadius:4,background:`${t.color}10`,border:`1px solid ${t.color}20`,...S.mono(10,t.color)}}>{c.name} · {c.sar.toLocaleString()} SAR</div>
              ))}
              {clients.filter(c=>c.serviceTier===t.id).length===0&&<span style={S.mono(9,"#1e1e1e")}>No clients on this tier yet</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
