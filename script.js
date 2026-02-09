function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function getState(){
  const p = new URLSearchParams(location.search);
  const t = Number(p.get("t") || 0);   // "time advantage" points (higher is faster)
  const r = Number(p.get("r") || 0);   // risk points (higher = more chaos)
  const leg = Number(p.get("leg") || 0);
  return { t, r, leg };
}

function setHud(){
  const { t, r } = getState();
  const tEl = document.getElementById("timePts");
  const rEl = document.getElementById("riskPts");
  if(tEl) tEl.textContent = String(t);
  if(rEl) rEl.textContent = String(r);
}

function go(nextPage, dt, dr){
  const s = getState();
  const t = clamp(s.t + dt, -10, 25);
  const r = clamp(s.r + dr, 0, 30);
  const leg = s.leg + 1;
  const url = `${nextPage}?t=${encodeURIComponent(t)}&r=${encodeURIComponent(r)}&leg=${encodeURIComponent(leg)}`;
  location.href = url;
}

// Pure chance "event wheel" used at the final page.
// This can override the "best choices" with a small probability.
function rollOutcome(){
  const { t, r } = getState();

  // Convert points into a rough "hours" estimate (fictional).
  // Base: 34h. Better choices reduce time. Risk can help a little… or ruin everything via chance.
  const estimatedHours = 34 - (t * 0.45) - (Math.min(r, 12) * 0.08);
  const recordHours = 26.5; // fictional record

  // Chance of disaster scales with risk (but never hits 0; chaos finds everyone).
  const dnfChance = clamp(0.06 + (r * 0.012), 0.06, 0.28); // 6% to 28%

  // Small chance of "time-killer" even if you don't DNF (police stop / tire blowout / surprise hail).
  const penaltyChance = clamp(0.10 + (r * 0.010), 0.10, 0.30); // 10% to 30%

  const roll = Math.random();

  // DNF
  if(roll < dnfChance){
    const reasons = [
      "A deer chooses violence. Your front bumper disagrees.",
      "The transmission starts speaking in ancient grinding dialects.",
      "A state trooper appears out of pure narrative necessity."
    ];
    return { type:"dnf", estimatedHours, recordHours, reason: reasons[Math.floor(Math.random()*reasons.length)] };
  }

  let finalHours = estimatedHours;
  let penalty = null;

  // Non-DNF penalty
  if(Math.random() < penaltyChance){
    const penalties = [
      { msg:"You lose 57 minutes arguing with a gas pump that only accepts loyalty cards from 2009.", add:0.95 },
      { msg:"A tire goes flat in the exact shape of your ego. Repairs take time.", add:1.35 },
      { msg:"A ‘routine’ traffic stop becomes a 45-minute TED Talk about speed limits.", add:0.75 }
    ];
    penalty = penalties[Math.floor(Math.random()*penalties.length)];
    finalHours += penalty.add;
  }

  // Record / finish
  if(finalHours <= recordHours){
    return { type:"record", estimatedHours: finalHours, recordHours, reason: penalty ? penalty.msg : null };
  }
  return { type:"finish", estimatedHours: finalHours, recordHours, reason: penalty ? penalty.msg : null };
}

function renderFinish(){
  setHud();
  const out = rollOutcome();

  // Hide all
  for(const id of ["endRecord","endFinish","endDNF"]){
    const el = document.getElementById(id);
    if(el) el.style.display = "none";
  }

  const hrs = document.getElementById("hrs");
  const rec = document.getElementById("rec");
  if(hrs) hrs.textContent = out.estimatedHours.toFixed(1);
  if(rec) rec.textContent = out.recordHours.toFixed(1);

  const why = document.getElementById("why");
  if(why){
    why.textContent = out.reason ? out.reason : "No extra chaos… which is suspicious in itself.";
  }

  const show = (id) => { const el = document.getElementById(id); if(el) el.style.display = "block"; };
  if(out.type === "dnf") show("endDNF");
  else if(out.type === "record") show("endRecord");
  else show("endFinish");
}

document.addEventListener("DOMContentLoaded", () => {
  setHud();
  if(document.body.dataset.page === "finish"){
    const btn = document.getElementById("rollBtn");
    if(btn) btn.addEventListener("click", renderFinish);
  }
});
