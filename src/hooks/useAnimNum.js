import { useState, useEffect, useRef } from "react";

export function useAnimNum(target, dur=600) {
  const [v,setV] = useState(target); const prev = useRef(target);
  useEffect(() => {
    const s=prev.current, t0=performance.now();
    const tick = now => { const t=Math.min((now-t0)/dur,1),e=t<.5?2*t*t:-1+(4-2*t)*t; setV(Math.round(s+(target-s)*e)); if(t<1) requestAnimationFrame(tick); else prev.current=target; };
    requestAnimationFrame(tick);
  },[target]);
  return v;
}
