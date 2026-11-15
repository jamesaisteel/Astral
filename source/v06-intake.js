/* =========================================================
   v0.6.1: Entry survey (pre-flight intake)
   Source: team document "Astronaut Training: Intake Survey (draft)".
   Filled in once before the mission; feeds the AI doctor, the workout
   planner (screening gate, loads, forecast) and the personal baselines.
   ========================================================= */
const YN = "No|Yes";
V6.INTAKE = [
  { id: "screen", title: "1. Medical screening", who: "Astronaut with the clinician", note: "Draft questions written for this project, not a validated instrument. Any Yes stops training until a clinician reviews the case.", fields: [
    ["s1", "Has a doctor ever said you have a heart condition or high blood pressure?", YN], ["s2", "Chest pain or pressure during activity or at rest?", YN],
    ["s3", "Fainted or nearly fainted, especially on standing?", YN], ["s4", "Short of breath at rest or with mild effort?", YN],
    ["s5", "Diabetes, thyroid disease or another metabolic condition?", YN], ["s6", "Fracture in the last 12 months, or told you have low bone density?", YN],
    ["s7", "Joint, back, hip, knee or ankle problem that limits movement?", YN], ["s8", "Medicines for blood pressure, the heart, blood thinning, diabetes or bone?", YN],
    ["s9", "Surgery in the last 6 months?", YN], ["s10", "Pregnant, or could you be?", YN],
    ["s11", "Fever or a significant illness in the last 7 days?", YN], ["s12", "Any other condition a physician should review before exercise?", YN],
    ["signName", "Clinician sign-off: name", "text"], ["signDate", "Sign-off date", "date"]] },
  { id: "body", title: "2. Identity and body", who: "With the scientist", fields: [
    ["age", "Age", "num", "years", "used"], ["sex", "Sex", "Male|Female", "", "used"], ["height", "Standing height", "num", "cm", "used"], ["mass", "Body mass, fasted, morning", "num", "kg", "used"],
    ["fed", "Feeding state at measurement", "Fasted|Fed", "", "stored"], ["bf", "Body fat", "num", "%", "used"], ["bfm", "Body fat method", "DXA|Bioimpedance|Skinfold|Other", "", "used"],
    ["lean", "Lean mass (DXA, optional)", "num", "kg", "used when entered"], ["femur", "Femur length (hip to knee)", "num", "cm", "used: squat, deadlift range"], ["tibia", "Tibia length", "num", "cm", "stored"],
    ["torso", "Torso length", "num", "cm", "stored"], ["uarm", "Upper arm length", "num", "cm", "used: press, row, curl range"], ["farm", "Forearm length", "num", "cm", "stored"]] },
  { id: "strength", title: "3. Strength and function tests", who: "With a qualified tester and safety stops", fields: [
    ["sq", "Squat 1RM", "num", "kg", "used"], ["dl", "Deadlift 1RM", "num", "kg", "used"], ["bp", "Bench press 1RM", "num", "kg", "used"], ["ohp", "Overhead press 1RM", "num", "kg", "used"],
    ["row", "Bent-over row 1RM", "num", "kg", "used"], ["cur", "Biceps curl 1RM", "num", "kg", "used"], ["heel", "Heel raises to failure (baseline)", "num", "reps", "used: calf trend"],
    ["knee", "Knee extension 1RM", "num", "kg", "stored"], ["grip", "Grip strength", "num", "kg", "used: baseline"], ["balO", "Single-leg balance, eyes open", "num", "s", "stored"], ["balC", "Single-leg balance, eyes closed", "num", "s", "stored"]] },
  { id: "aero", title: "4. Aerobic and cardiovascular", who: "With the scientist", fields: [
    ["vo2", "VO2max", "num", "ml/kg/min", "used"], ["vo2m", "VO2max method", "Direct maximal|Submaximal estimate", "", "stored"], ["rhr", "Resting heart rate", "num", "bpm", "used: baseline"],
    ["rsys", "Resting systolic blood pressure", "num", "mmHg", "used: baseline"], ["rdia", "Resting diastolic blood pressure", "num", "mmHg", "used: baseline"]] },
  { id: "equip", title: "5. Equipment and schedule", who: "With the scientist", fields: [
    ["machine", "Lift machine maximum", "num", "kg", "used"], ["calib", "Machine calibration factor (1.00 = exact)", "num", "×", "used"], ["harness", "Treadmill harness load", "num", "% body weight", "used"],
    ["avail", "Time available for training per day", "num", "min", "used: checked against plan"], ["allergy", "Food allergies", "text", "", "used by the AI doctor"], ["prefs", "Food preferences", "text", "", "stored"]] },
  { id: "dates", title: "6. Mission dates and records", who: "With the scientist", fields: [
    ["mlen", "Mission length", "num", "days", "used: forecast"], ["launch", "Launch date", "date", "", "used"], ["landing", "Landing date", "date", "", "used"],
    ["dxaPre", "Pre-flight DXA (about 90 days before launch)", "date", "", "used: calibration"], ["dxaPost", "Post-flight DXA (7 to 14 days after landing)", "date", "", "used: calibration"]] },
  { id: "you", title: "7. About you", who: "The astronaut answers these", fields: [
    ["mins", "Minutes you can train per day", "num", "min", "used: session limit"], ["dpw", "Days per week you can train", "6|5|4", "", "used"], ["tod", "Best time of day to train", "Morning|Afternoon|Evening", "", "stored"],
    ["cardio", "Cardio you prefer", "Treadmill and cycle|Treadmill only|Cycle only", "", "used"], ["bed", "Usual bedtime", "time", "", "stored"], ["wake", "Usual wake time", "time", "", "stored"],
    ["sleepT", "Sleep you aim for", "num", "h", "used by the AI doctor"], ["pain", "Pain or stiffness now, and where", "text", "", "flagged to the scientist and AI doctor"]] },
  { id: "targets", title: "8. Targets", who: "The scientist sets these", fields: [
    ["tFem", "Maximum femoral neck loss over the mission (NASA limit 10%)", "num", "%", "used"], ["tLum", "Maximum lumbar spine loss (NASA limit 5%)", "num", "%", "used"],
    ["tMus", "Minimum muscle change per group", "num", "%/month", "used"], ["tAer", "Minimum aerobic change", "num", "%/month", "used"]] },
  { id: "notes", title: "9. Notes", who: "Anyone", fields: [["notes", "Anything else the doctor and scientist should know (injuries, medication, preferences)", "text", "", "used by the AI doctor"], ["by", "Completed by", "text"], ["role", "Role", "text"], ["date", "Date", "date"]] }
];
V6.INTAKE_FIELDS = V6.INTAKE.flatMap(s => s.fields.map(f => ({ sec: s.id, k: f[0], label: f[1], kind: f[2], unit: f[3] || "", use: f[4] || "" })));

// Completed demo surveys (simulated), one per crew member
V6.INT = {};
(() => {
  const base = { fed: "Fasted", bfm: "DXA", vo2m: "Direct maximal", machine: 272, calib: 1.00, harness: 70, avail: 150, prefs: "No strong preferences", mlen: 180, launch: "2026-10-13", landing: "2027-04-11", dxaPre: "2026-07-15", dxaPost: "2027-04-20",
    mins: 120, dpw: "6", tod: "Morning", cardio: "Treadmill and cycle", bed: "22:30", wake: "06:30", sleepT: 7.5, pain: "None", tFem: 10, tLum: 5, tMus: -0.5, tAer: 0, signName: "Flight surgeon (demo)", signDate: "2026-09-20", role: "Scientist", date: "2026-09-20" };
  const per = {
    "CM-1": { height: 180, bf: 18, femur: 46, tibia: 41, torso: 52, uarm: 33, farm: 27, ohp: 62, row: 75, cur: 35, heel: 32, knee: 90, balO: 30, balC: 12, allergy: "None known", notes: "Wears glasses for reading.", by: "Scientist with CM-1" },
    "CM-2": { height: 168, bf: 24, femur: 42, tibia: 38, torso: 48, uarm: 30, farm: 25, ohp: 36, row: 45, cur: 20, heel: 28, knee: 55, balO: 30, balC: 15, allergy: "Shellfish (hives as a child)", tod: "Afternoon", sleepT: 8, notes: "Prone to motion sickness on previous flights.", by: "Scientist with CM-2" },
    "CM-3": { height: 177, bf: 20, femur: 45, tibia: 40, torso: 51, uarm: 32, farm: 26, ohp: 54, row: 66, cur: 30, heel: 30, knee: 80, balO: 30, balC: 10, allergy: "None known", pain: "Mild lower-back stiffness after long sitting", notes: "Old left ankle sprain (2019), fully recovered.", by: "Scientist with CM-3" },
    "CM-4": { height: 165, bf: 22, femur: 43, tibia: 39, torso: 47, uarm: 29, farm: 24, ohp: 34, row: 42, cur: 18, heel: 34, knee: 60, balO: 30, balC: 18, allergy: "None known", cardio: "Treadmill only", mins: 110, notes: "Contact lenses; spare glasses on board.", by: "Scientist with CM-4" }
  };
  CREW.forEach(c => {
    const P = V6.PROFILE[c.id], a = { ...base, ...per[c.id], age: c.age, sex: c.sex === "male" ? "Male" : "Female", mass: c.kg, sq: P.sq, dl: P.dl, bp: P.bp, vo2: P.vo2, grip: c.base.grip, rhr: c.base.hr, rsys: c.base.sys, rdia: c.base.dia };
    V6.INTAKE_FIELDS.filter(f => f.sec === "screen" && f.kind === YN).forEach(f => { a[f.k] = "No"; });
    V6.INT[c.id] = { a, savedDay: -55 };
  });
})();

V6.intakeStatus = id => {
  const a = (V6.INT[id] || {}).a || {}, need = V6.INTAKE_FIELDS.filter(f => !["lean", "notes", "by", "role", "date", "prefs"].includes(f.k));
  const answered = need.filter(f => a[f.k] !== undefined && String(a[f.k]).trim() !== "").length;
  const yes = V6.INTAKE_FIELDS.filter(f => f.sec === "screen" && f.kind === YN && a[f.k] === "Yes").map(f => f.label);
  const signed = !!(a.signName && String(a.signName).trim() && a.signDate);
  const allAnswered = V6.INTAKE_FIELDS.filter(f => f.sec === "screen" && f.kind === YN).every(f => a[f.k] === "No" || a[f.k] === "Yes");
  return { answered, total: need.length, pct: Math.round(answered / need.length * 100), yes, signed, cleared: allAnswered && !yes.length && signed };
};
V6.num = (id, k) => { const v = ((V6.INT[id] || {}).a || {})[k]; return v === undefined || v === "" || isNaN(+v) ? null : +v; };

/* ---------- What the survey feeds ---------- */
const _prof = V6.prof;
V6.prof = id => {
  const p = _prof(id), n = k => V6.num(id, k), a = (V6.INT[id] || {}).a || {};
  [["mass", "m"], ["age", "age"], ["height", "h"], ["bf", "bf"], ["vo2", "vo2"], ["sq", "sq"], ["dl", "dl"], ["bp", "bp"], ["harness", "hf"], ["lean", "lean"], ["mlen", "days"], ["tFem", "tFem"], ["tLum", "tLum"], ["avail", "avail"], ["mins", "mins"]].forEach(([k, q]) => { if (n(k) !== null) p[q] = n(k); });
  ["ohp", "row", "cur"].forEach(k => { if (n(k) !== null) p["own_" + k] = n(k); });
  if (a.sex) p.sex = a.sex === "Female" ? 0 : 1;
  if (n("machine") !== null) p.max = n("machine") * (n("calib") || 1);
  p.seg = { femur: n("femur"), arm: n("uarm") };
  p.cardioPref = a.cardio || "Treadmill and cycle";
  return p;
};
V6.applyIntake = id => {
  const c = crewObj(id), n = k => V6.num(id, k), a = V6.INT[id].a;
  if (n("age") !== null) c.age = n("age"); if (n("mass") !== null) c.kg = n("mass"); if (a.sex) c.sex = a.sex === "Female" ? "female" : "male";
  [["rhr", "hr"], ["rsys", "sys"], ["rdia", "dia"], ["grip", "grip"]].forEach(([k, b]) => { if (n(k) !== null) c.base[b] = n(k); });
};
V6.profileText = id => {
  const a = (V6.INT[id] || {}).a || {}, S_ = V6.intakeStatus(id), hist = S_.yes;
  return {
    medical_screening: S_.yes.length ? "Yes to: " + hist.join("; ") : "All No",
    clinician_sign_off: S_.signed ? `${a.signName}, ${a.signDate}` : "missing",
    cleared_for_training: S_.cleared,
    food_allergies: a.allergy || "not recorded", pain_or_stiffness_before_flight: a.pain || "not recorded", notes: a.notes || "",
    sleep_target_h: a.sleepT || null, usual_bed_wake: `${a.bed || "?"} / ${a.wake || "?"}`, training_time_per_day_min: a.mins || null, preferred_training_time: a.tod || null, cardio_preference: a.cardio || null,
    body: { height_cm: a.height, mass_kg: a.mass, body_fat_pct: a.bf, vo2max: a.vo2 }, resting_baseline: { hr: a.rhr, bp: `${a.rsys}/${a.rdia}`, grip_kg: a.grip },
    mission: { length_days: a.mlen, launch: a.launch, landing: a.landing }
  };
};

/* ---------- Hooks: AI doctor, Medical Officer summaries, rule engine, workouts ---------- */
const _snapshot2 = snapshot;
snapshot = function (id) { const o = _snapshot2(id); o.entry_survey = V6.profileText(id); return o; };
const _caseSummary = caseSummary;
caseSummary = function (id, route) {
  const o = _caseSummary(id, route), P = V6.profileText(id);
  o.history = `Entry survey: screening ${P.medical_screening.toLowerCase()}; allergies: ${P.food_allergies}; pre-flight pain: ${P.pain_or_stiffness_before_flight}${P.notes ? "; notes: " + P.notes : ""}`;
  o.who += ` · ${o.history}`;
  return o;
};
const _localSuggestion = localSuggestion;
localSuggestion = function (id, route, q) {
  const s = _localSuggestion(id, route, q), P = V6.profileText(id);
  if (route.topic && ["kitmeds", "minorill"].includes(route.topic.id)) return `${s} Entry survey: allergies ${P.food_allergies}; regular medicines ${P.medical_screening.includes("Medicines") ? "reported" : "none reported"}.`;
  if (route.topic && ["fitness", "restrict"].includes(route.topic.id) && P.pain_or_stiffness_before_flight && !/^none/i.test(P.pain_or_stiffness_before_flight)) return `${s} Note from the entry survey: ${P.pain_or_stiffness_before_flight}.`;
  return s;
};
const _localAnswer2 = localAnswer;
localAnswer = function (q) {
  const a = (V6.INT[current] || {}).a || {};
  if (/allerg/i.test(q)) return `Your entry survey lists food allergies: ${a.allergy || "none recorded"}. Check pouch labels in the Nutrition page before eating anything new.`;
  if (/sleep/i.test(q) && a.sleepT) return `${_localAnswer2(q)} Your own target from the entry survey is ${a.sleepT} h (usual bedtime ${a.bed}, wake ${a.wake}).`;
  return _localAnswer2(q);
};
const _evaluate2 = evaluate;
evaluate = function (id) {
  const r = _evaluate2(id), S_ = V6.intakeStatus(id);
  const add = (tier, title, why, action) => { const a = { tier, dom: "body", title, why, action, safety: false, src: "M", ground: null }; r.alerts.push(a); if (tier > r.dom.body.tier) { r.dom.body.tier = tier; r.dom.body.why = title; } };
  if (S_.yes.length || !S_.signed) add(2, "Entry survey needs clinician review", S_.yes.length ? `Yes to: ${S_.yes.join("; ")}.` : "Clinician sign-off missing.", "Training stays locked until the Medical Officer or flight surgeon reviews and signs the entry survey.");
  r.alerts.sort((x, y) => y.tier - x.tier); r.maxTier = r.alerts.reduce((m, a) => Math.max(m, a.tier), 0);
  return r;
};
const _renderTrain = V6.renderTrain;
V6.renderTrain = () => {
  const S_ = V6.intakeStatus(current), p = V6.prof(current);
  if (!S_.cleared) return `<section class="panel pad lockcard">${icon("shield")}<div><h3>Training is locked</h3><p class="muted">${S_.yes.length ? `The entry survey has Yes answers that a clinician must review first: ${esc(S_.yes.join("; "))}.` : "The entry survey's medical screening is not complete or not signed by a clinician."}</p><button class="btn primary" data-goform="intake">Open the entry survey</button></div></section>`;
  const td = V6.today(current), lim = p.mins || p.avail;
  const warn = lim && td.S.t > lim ? `<div class="notice phase">${icon("info")}<span>Today's session takes about ${Math.round(td.S.t)} min, more than the ${lim} min you said you can train per day in the entry survey. Ask the scientist to shorten the plan.</span></div>` : "";
  return warn + _renderTrain();
};

/* ---------- Page ---------- */
V6.FREQ.unshift(["intake", "Entry survey"]);
V6.intakeField = (f, a) => {
  const id = `iv_${f.k}`, v = a[f.k] ?? "", tag = f.use ? `<em class="use ${f.use.startsWith("stored") ? "st" : ""}">${esc(f.use)}</em>` : "";
  let ctl;
  if (["num", "text", "date", "time"].includes(f.kind)) ctl = `<input type="${f.kind === "num" ? "number" : f.kind}" ${f.kind === "num" ? 'step="any"' : ""} id="${id}" data-iv="${f.k}" value="${esc(v)}">`;
  else ctl = V6.sel(id, ["—"].concat(f.kind.split("|")).map(o => [o === "—" ? "" : o, o]), v, `data-iv="${f.k}"`);
  return `<label class="ffield ${f.kind === "text" ? "wide" : ""} ${f.kind === YN && v === "Yes" ? "yes" : ""}"><span>${esc(f.label)}${f.unit ? ` <i>(${esc(f.unit)})</i>` : ""}${tag}</span>${ctl}</label>`;
};
V6.renderIntake = () => {
  const a = V6.INT[current].a, S_ = V6.intakeStatus(current), P = V6.profileText(current);
  const head = `<section class="panel pad intakehead"><div class="ihl"><span class="eyebrow">Entry survey · ${esc(current)} · completed before the mission</span>
      <h3>${S_.cleared ? "Cleared for training" : "Not cleared yet"}</h3>
      <p class="muted">${S_.cleared ? `All screening answers No, signed by ${esc(a.signName)} on ${esc(a.signDate)}.` : S_.yes.length ? `Yes to: ${esc(S_.yes.join("; "))}. A clinician must review before training.` : "Screening incomplete or not signed by a clinician."}</p></div>
    ${V6.kpis([[S_.pct + "%", "Answered", S_.pct >= 100 ? 0 : 2], [S_.cleared ? "Yes" : "No", "Training unlocked", S_.cleared ? 0 : 3], [P.food_allergies.length > 14 ? P.food_allergies.slice(0, 12) + "…" : P.food_allergies, "Food allergies"]])}</section>
    <section class="panel pad"><span class="eyebrow">What the app does with it</span><div class="feeds">
      <div>${icon("ai")}<b>AI doctor</b><span>Knows the medical history, allergies, pre-flight pain, sleep target and notes before the first question, and passes them to the Medical Officer in every case summary.</span></div>
      <div>${icon("train")}<b>Workout planner</b><span>Screening gate, loads from the measured 1RMs, machine limit and harness load, session time limit, mission length and bone targets for the forecast.</span></div>
      <div>${icon("heart")}<b>Personal baselines</b><span>Resting heart rate, blood pressure and grip strength become the baselines the rule engine compares against.</span></div></div></section>`;
  const secs = V6.INTAKE.map(s => `<section class="panel fform" id="isec-${s.id}"><div class="panelhead">${icon(s.id === "screen" ? "shield" : "entry")}<h3>${esc(s.title)}</h3><span class="r muted" style="font-size:12px">${esc(s.who)}</span></div>
      ${s.note ? `<div class="pad muted" style="font-size:12.5px;padding-bottom:0">${esc(s.note)}</div>` : ""}
      <div class="ffields pad ${s.id === "screen" ? "screen" : ""}">${V6.INTAKE_FIELDS.filter(f => f.sec === s.id).map(f => V6.intakeField(f, a)).join("")}</div></section>`).join("");
  return head + `<div class="flist" id="form-intake">${secs}</div>
    <div class="panel savebar"><button class="btn primary" id="intakeSave">${icon("check")}Save entry survey</button><span class="muted" style="font-size:12.5px">The daily ASTRAL questions (section 10 of the survey) are in the Daily tab.</span></div>
    <div class="panel guard">${icon("shield")}<span>Draft survey written for this project. Before real use, replace the screening with the mission medical authority's approved pre-exercise form. Survey answers are medical data: private, shared only with the Medical Officer and flight surgeon.</span></div>`;
};
const _renderEntry = V6.renderEntry;
V6.renderEntry = () => {
  if (V6.ui.entrySub !== "intake") return _renderEntry();
  const S_ = V6.intakeStatus(current);
  return `<div class="seg v6tabs" role="group" aria-label="How often">${V6.FREQ.map(([k, n]) => `<button data-esub="${k}" aria-pressed="${k === "intake"}">${n}${k === "intake" && !S_.cleared ? `<span class="count">!</span>` : ""}</button>`).join("")}</div>` + V6.renderIntake();
};
const _goForm = V6.goForm;
V6.goForm = fid => { if (fid === "intake") { tab = "entry"; V6.ui.entrySub = "intake"; render(); window.scrollTo(0, 0); return; } _goForm(fid); };
V6.saveIntake = () => {
  const a = V6.INT[current].a;
  document.querySelectorAll("[data-iv]").forEach(el => { a[el.dataset.iv] = el.value; });
  V6.INT[current].savedDay = missionDay; V6.applyIntake(current);
  Object.keys(aiBrief).forEach(k => delete aiBrief[k]); render();
  const b = document.getElementById("intakeSave"); if (b) { b.insertAdjacentHTML("afterend", `<span class="toast">${icon("check")}Saved: the AI doctor and planner now use these answers</span>`); b.scrollIntoView({ block: "center" }); }
};
// Show the profile on the Health assistant page
const _renderAssistant = renderAssistant;
renderAssistant = function () {
  const h = _renderAssistant(), P = V6.profileText(current), i = h.indexOf("</section>") + 10;
  const card = `<section class="panel"><div class="panelhead">${icon("twin")}<h3>What the assistant knows about you</h3><span class="r"><button class="btn small" data-goform="intake">Entry survey</button></span></div>
    <div class="kv" style="grid-template-columns:auto 1fr"><dt>Medical screening</dt><dd style="text-align:left">${esc(P.medical_screening)}${P.cleared_for_training ? " · cleared" : " · needs review"}</dd><dt>Food allergies</dt><dd style="text-align:left">${esc(P.food_allergies)}</dd><dt>Pain before flight</dt><dd style="text-align:left">${esc(P.pain_or_stiffness_before_flight)}</dd><dt>Sleep target</dt><dd style="text-align:left">${esc(P.sleep_target_h)} h · ${esc(P.usual_bed_wake)}</dd>${P.notes ? `<dt>Notes</dt><dd style="text-align:left">${esc(P.notes)}</dd>` : ""}</div></section>`;
  return h.slice(0, i) + card + h.slice(i);
};
document.getElementById("content").addEventListener("click", e => { if (e.target.closest("#intakeSave")) V6.saveIntake(); });
document.getElementById("content").addEventListener("change", e => { const t = e.target; if (t.dataset.iv && t.tagName === "SELECT") t.closest(".ffield").classList.toggle("yes", t.value === "Yes" && V6.INTAKE_FIELDS.find(f => f.k === t.dataset.iv).kind === YN); });
