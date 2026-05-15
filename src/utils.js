import { DM_TARGET } from './constants';

// Stable ISO date: always "YYYY-MM-DD", unaffected by locale or device region
export function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

// Outreach XP: full credit at 50 DMs, partial below (honest logging)
export function dmXP(sent) { return Math.min(Math.round((sent/DM_TARGET)*100),100); }

export function rowXP(r) {
  const parts = [r.health*100, dmXP(r.dmsSent??0), r.delivery*100, r.finLogged*100, r.finDisc*100];
  return Math.round(parts.reduce((a,b)=>a+b,0)/parts.length);
}

export function xpColor(v) { return v===100?"#00ff88":v>=60?"#ffcc00":"#ff2244"; }

// Strict number parser — returns 0 for any non-numeric input
export function safeNum(v, fallback=0) { const n=Number(String(v).replace(/[^0-9.-]/g,"")); return isFinite(n)?n:fallback; }

export function exportCSV(data, filename) {
  if (!data.length) return;
  const keys=Object.keys(data[0]);
  const csv=[keys.join(","),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(","))].join("\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=filename; a.click();
}
