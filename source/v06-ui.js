/* =========================================================
   v0.6 UI: new pages, sensor test bench, hooks into the existing app
   ========================================================= */
V6.ui = { entrySub: "daily", schedDay: null, fType: "surface", skin: { has: false, res: null, src: null, label: "" }, envMod: V6.MODULES[1], libQ: "" };
V6.src = document.createElement("canvas"); V6.src.width = V6.src.height = 224;
V6.sctx = V6.src.getContext("2d", { willReadFrequently: true });

/* ---------- Navigation ---------- */
NAV.length = 0;
NAV.push(
  { group: "Overview", items: [["twin", "Digital twin", "twin"], ["today", "Today", "today"], ["assistant", "Health assistant", "ai"], ["libraries", "Medical libraries", "book"]] },
  { group: "Body systems", items: [["vitals", "Vitals", "heart"], ["air", "Air and gases", "air"], ["sleep", "Sleep", "sleep"], ["body", "Body", "body"], ["mind", "Mind", "mind"], ["rad", "Radiation", "rad"], ["nutrition", "Nutrition", "nutr"]] },
  { group: "Station", items: [["fungi", "Fungi", "fungi"]] },
  { group: "Tools", items: [["entry", "Manual data entry", "entry"], ["routine", "Schedule", "cal"], ["train", "Workout planner", "train"], ["skin", "Skin check", "skin"], ["hud", "Helmet HUD", "hud"], ["privacy", "Privacy", "privacy"]] }
);
Object.assign(PAGE, {
  today: ["Today", "Readiness, today's timetable, status by body system and what to do next."],
  libraries: ["Medical libraries", "The trusted sources the health assistant draws on, and how every answer cites them."],
  fungi: ["Fungi", "Station-wide fungal monitoring: continuous risk sensors plus monthly air and surface samples."],
  entry: ["Manual data entry", "Everything the sensors can't measure, grouped by how often it is done."],
  routine: ["Schedule", "The full timetable for any mission day: training, questionnaires, tests and samples."],
  train: ["Workout planner", "Today's session, logging and how the plan adapts. Based on the team's Astronaut Training Plan."],
  skin: ["Skin check", "Photograph a skin change and get an on-board screening. Uncertain results go to the Medical Officer."]
});

/* ---------- Small UI helpers ---------- */
V6.chart = (series, o = {}) => {
  const W = o.w || 640, H = o.h || 220, P = { l: 44, r: 12, t: 12, b: 28 };
  const pts = series.flatMap(s => s.pts); if (!pts.length) return `<div class="empty">No data yet.</div>`;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]).concat(o.limit != null ? [o.limit] : []);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1, y0 = o.y0 != null ? o.y0 : Math.min(0, ...ys), y1 = Math.max(...ys) * 1.12 || 1;
  const X = x => P.l + (x - x0) / ((x1 - x0) || 1) * (W - P.l - P.r), Y = y => H - P.b - (y - y0) / ((y1 - y0) || 1) * (H - P.t - P.b);
  const ticks = [0, .25, .5, .75, 1].map(f => y0 + f * (y1 - y0));
  const grid = ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${P.l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${Math.round(v)}</text>`).join("");
  const xt = [...new Set(xs)].filter((v, i, a) => a.length < 9 || i % Math.ceil(a.length / 8) === 0).map(v => `<text x="${X(v)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--muted)">${o.xfmt ? o.xfmt(v) : v}</text>`).join("");
  const lim = o.limit != null ? `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(o.limit)}" y2="${Y(o.limit)}" stroke="var(--emerg)" stroke-dasharray="5 4"/><text x="${W - P.r}" y="${Y(o.limit) - 5}" text-anchor="end" font-size="10" fill="var(--emerg)">${esc(o.limitLabel || "limit")}</text>` : "";
  const lines = series.map(s => `<polyline fill="none" stroke="${s.color}" stroke-width="2" points="${s.pts.map(p => X(p[0]) + "," + Y(p[1])).join(" ")}"/>${s.pts.map(p => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="2.6" fill="${s.color}"><title>${esc(s.name)}: ${p[1]}</title></circle>`).join("")}`).join("");
  const leg = series.length > 1 ? `<div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div>` : "";
  return `<svg class="v6chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "Chart")}">${grid}${xt}${lim}${lines}</svg>${leg}`;
};
V6.COLORS = ["#5fb3ff", "#3ccf91", "#f2b544", "#ff7a4d", "#c08cff", "#ff4565"];
V6.kpis = list => `<div class="v6kpis">${list.map(([v, l, t]) => `<div class="panel v6kpi ${t != null ? "t" + t : ""}"><b>${v}</b><span>${esc(l)}</span></div>`).join("")}</div>`;
V6.sel = (id, opts, cur, attrs = "") => `<select id="${id}" ${attrs}>${opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`; }).join("")}</select>`;
V6.goForm = fid => { const f = V6.FORMS[fid]; if (f.link) { tab = f.link; render(); window.scrollTo(0, 0); return; } tab = "entry"; V6.ui.entrySub = f.freq; render(); setTimeout(() => { const el = document.getElementById("form-" + fid); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600); } }, 30); };

/* =========================================================
   Sensor-based test bench
   ========================================================= */
V6.bField = (k, label) => {
  const m = M[k], s = st();
  return `<div class="bfield"><label for="f_${k}">${esc(label || m.label)}</label><span class="v" id="f_${k}_v">${fmt(k, s[k])} ${esc(m.unit)}</span><input type="range" id="f_${k}" min="${m.min}" max="${m.max}" step="${m.step}" value="${s[k]}" style="--p:${pct(k, s[k])}"></div>`;
};
V6.devCard = d => {
  const s = st(), on = s.sensors[d.id];
  return `<div class="devcard ${on ? "" : "off"}"><div class="devhead"><div><b>${esc(d.name)}</b><span>${esc(d.cat)} · ${esc(d.where)} · ${esc(d.maker)}</span></div>
    <label class="sw" title="Connected"><input type="checkbox" data-sen="${d.id}" ${on ? "checked" : ""} ${d.id === "suit" ? "disabled" : ""}><i></i></label></div>
    <div class="devmeta">${esc(d.tech)}. ${esc(d.nasa)}.</div>
    ${d.gap ? `<div class="devgap">${icon("info", 'style="width:13px;height:13px"')}${esc(d.gap)}</div>` : ""}
    ${on ? d.keys.map(k => V6.bField(k, V6.OUT[k])).join("") : `<div class="devoff">Disconnected: the app shows "No data" instead of guessing.</div>`}</div>`;
};
V6.envPanel = () => {
  const e = V6.ENV[V6.ui.envMod], r = V6.envRisk(e);
  return `<section class="bpanel" id="v6env"><header><h3>Station environment (fungal risk)</h3><span class="r hint">Shared by the whole crew</span></header><div class="body">
    <div class="field-inline" style="justify-content:space-between"><label for="envMod" class="eyebrow">Module</label>${V6.sel("envMod", V6.MODULES, V6.ui.envMod)}</div>
    ${Object.entries(V6.ENVF).map(([k, f]) => `<div class="bfield"><label for="e_${k}">${esc(f.label)}</label><span class="v" id="e_${k}_v">${e[k]} ${esc(f.unit)}</span><input type="range" id="e_${k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${e[k]}" style="--p:${((e[k] - f.min) / (f.max - f.min) * 100).toFixed(1)}%"></div>`).join("")}
    <div class="field-inline" style="justify-content:space-between"><span class="eyebrow">Fungal growth risk here</span><span id="envRisk">${pill(r.tier, r.label)}</span></div>
    <div class="scen"><button data-envscen="cond">Condensation behind a panel</button><button data-envscen="reset">Reset all modules</button></div>
    <span class="hint">Sensors predict conditions that favour growth; only samples on the Fungi page prove growth is there.</span></div></section>`;
};
V6.coveragePanel = () => `<section class="bpanel"><header><h3>Sensor coverage check</h3><span class="r hint">Against the team's Sensors document</span></header><div class="body">
  <span class="eyebrow">Values without a sensor in the document</span>${V6.COVERAGE.gaps.map(([v, d, w]) => `<div class="covrow gap"><b>${esc(v)}</b><span>${esc(d)}: ${esc(w)}</span></div>`).join("")}
  <span class="eyebrow" style="margin-top:6px">Sensors in the document not simulated here</span>${V6.COVERAGE.unused.map(([v, d]) => `<div class="covrow"><b>${esc(v)}</b><span>${esc(d)}</span></div>`).join("")}</div></section>`;
const _buildBench = buildBench;
buildBench = function () {
  _buildBench();
  const s = st();
  const sf = document.getElementById("sensorFields"); sf.innerHTML = V6.DEVICES.filter(d => d.cat === "Wearable").map(V6.devCard).join("");
  const head = sf.closest(".bpanel").querySelector("header h3"); if (head) head.textContent = "Wearable sensors";
  const col2 = sf.closest(".benchcol");
  let envDev = document.getElementById("v6envdev");
  if (!envDev) { envDev = document.createElement("section"); envDev.className = "bpanel"; envDev.id = "v6envdev"; col2.appendChild(envDev); }
  envDev.innerHTML = `<header><h3>Cabin, exercise and vehicle sensors</h3><span class="r src S">S</span></header><div class="body">${V6.DEVICES.filter(d => d.cat !== "Wearable").map(V6.devCard).join("")}</div>`;
  document.getElementById("evaFields").innerHTML = V6.devCard(V6.SUITDEV) + `<span class="hint">Connects automatically in Spacewalk mode.</span>`;
  const mf = document.getElementById("manualFields");
  mf.innerHTML = `<div class="switchrow" style="padding:0;border:0"><div class="txt"><b style="font-weight:500">Today's check-in completed</b><span>Turn off to test missing self-reports</span></div><label class="sw"><input type="checkbox" id="f_checkin" ${s.checkin ? "checked" : ""}><i></i></label></div>` +
    V6.MANUAL_GROUPS.map(([g, h, ks]) => `<div class="mgroup"><span class="eyebrow">${esc(g)}</span><span class="hint">${esc(h)}</span>${ks.map(k => V6.bField(k)).join("")}</div>`).join("") +
    `<div><span class="eyebrow">Symptoms</span><div class="chipset" style="margin-top:8px">${SYMPTOMS.map((x, i) => tog("sym_" + i, `data-sym="${esc(x)}"`, x, s.symptoms.includes(x))).join("")}</div></div>
     <div><span class="eyebrow">Medication</span><div class="chipset" style="margin-top:8px">${MEDS.map((x, i) => tog("med_" + i, `data-med="${esc(x)}"`, x, s.meds.includes(x))).join("")}</div></div>`;
  const chips = document.getElementById("sensorChips"); if (chips) chips.closest(".bpanel").hidden = true;
  const col1 = document.getElementById("scenarios").closest(".benchcol");
  let env = document.getElementById("v6env"); if (env) env.remove();
  col1.insertAdjacentHTML("beforeend", V6.envPanel());
  if (!document.getElementById("v6cov")) { const c = document.createElement("div"); c.id = "v6cov"; c.innerHTML = V6.coveragePanel(); col1.appendChild(c); }
  const ph = document.querySelector(".benchhead p"); if (ph) ph.textContent = "Simulates what each real device would report, grouped by device as the data is collected on the station. Changes apply to the crew member selected at the top; the station environment is shared by everyone.";
};

/* =========================================================
   Manual data entry
   ========================================================= */
V6.fieldHTML = (fid, [k, label, kind]) => {
  const id = `ff_${fid}_${k}`;
  if (kind === "num") return `<label class="ffield"><span>${esc(label)}</span><input type="number" step="any" id="${id}" data-ff="${fid}" data-fk="${k}"></label>`;
  if (kind === "text") return `<label class="ffield wide"><span>${esc(label)}</span><input type="text" id="${id}" data-ff="${fid}" data-fk="${k}" placeholder="Stays private"></label>`;
  const opts = kind === "1-5" ? ["1", "2", "3", "4", "5"] : kind === "1-10" ? Array.from({ length: 10 }, (_, i) => String(i + 1)) : kind.split("|");
  const def = kind === "1-5" ? "4" : kind === "1-10" ? "5" : opts[0];
  return `<label class="ffield"><span>${esc(label)}</span>${V6.sel(id, opts, def, `data-ff="${fid}" data-fk="${k}"`)}</label>`;
};
V6.formHTML = fid => {
  const f = V6.FORMS[fid], s = st(), done = V6.doneOn(current, fid, missionDay), last = V6.lastDone(current, fid);
  const status = done ? `<span class="chip ok">${icon("check", 'style="width:13px;height:13px"')}Done today</span>` : last !== null ? `<span class="chip">Last: day ${last}</span>` : `<span class="chip">Not done yet</span>`;
  if (f.link) return `<section class="panel fform" id="form-${fid}"><div class="panelhead">${icon("fungi")}<h3>${esc(f.title)}</h3><span class="r muted" style="font-size:12px">${esc(f.when)}</span></div><div class="pad"><p class="muted" style="font-size:13px">${esc(f.note)}</p><button class="btn" data-tab-go="${f.link}">Open the Fungi page</button></div></section>`;
  return `<section class="panel fform" id="form-${fid}"><div class="panelhead">${icon("entry")}<h3>${esc(f.title)}</h3><span class="r">${status}<span class="muted" style="font-size:12px">${esc(f.when)}</span></span></div>
    ${f.metrics ? `<div class="formgrid pad">${f.metrics.map(qField).join("")}</div>` : ""}
    ${f.symptoms ? `<div class="pad"><div class="qt" style="margin-bottom:8px">Symptoms (tap all that apply)</div><div class="chipset">${SYMPTOMS.map((x, i) => tog(`${fid}_sym_${i}`, `data-csym="${esc(x)}"`, x, s.symptoms.includes(x))).join("")}</div>
      <div class="qt" style="margin:12px 0 8px">Medication since the last check-in</div><div class="chipset">${MEDS.map((x, i) => tog(`${fid}_med_${i}`, `data-cmed="${esc(x)}"`, x, s.meds.includes(x))).join("")}</div></div>` : ""}
    ${f.fields ? `<div class="ffields pad">${f.fields.map(x => V6.fieldHTML(fid, x)).join("")}</div>` : ""}
    <div class="ffoot">${f.note ? `<span class="muted">${esc(f.note)}</span>` : "<span></span>"}<button class="btn primary" data-fsave="${fid}">${icon("check")}Save</button></div></section>`;
};
V6.renderEntry = () => {
  const sub = V6.ui.entrySub, list = Object.keys(V6.FORMS).filter(k => V6.FORMS[k].freq === sub);
  const due = V6.tasks(missionDay, current).filter(t => t.kind === "form" && !V6.taskDone(t, missionDay, current)).map(t => t.link);
  return `<div class="seg v6tabs" role="group" aria-label="How often">${V6.FREQ.map(([k, n]) => { const c = Object.keys(V6.FORMS).filter(f => V6.FORMS[f].freq === k && due.includes(f)).length; return `<button data-esub="${k}" aria-pressed="${k === sub}">${n}${c ? `<span class="count">${c}</span>` : ""}</button>`; }).join("")}</div>
    <p class="muted" style="font-size:12.5px">${{ daily: "Every day. The timetable on Today shows when each one is due.", twice: "Two to three times a week.", weekly: "Once a week, on Saturday.", monthly: "Once a month or on scheduled mission days.", event: "Only when something happens: a spacewalk, illness, landing or the first week in space." }[sub]} The numbers show what is due today.</p>
    <div class="flist">${list.map(V6.formHTML).join("")}</div>`;
};
V6.saveForm = fid => {
  const f = V6.FORMS[fid], a = {};
  document.querySelectorAll(`[data-ff="${fid}"]`).forEach(el => { a[el.dataset.fk] = el.value; });
  const A = V6.ANS[current] = V6.ANS[current] || {};
  (A[fid] = A[fid] || []).push({ day: missionDay, at: new Date().toTimeString().slice(0, 5), a });
  if (fid === "morning") st().checkin = true;
  if (fid === "eyeexam") { const v = Math.max(+a.octL || 0, +a.octR || 0); if (v) V6.OCT[current].push([missionDay, v]); }
  delete aiBrief[current];
  render();
  const el = document.getElementById("form-" + fid); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1400); }
};
V6.OCT = {}; CREW.forEach((c, i) => { V6.OCT[c.id] = [[0, 250 + i * 4], [30, 252 + i * 5]]; });

/* =========================================================
   Timetable: Today panel and Schedule page
   ========================================================= */
V6.taskRow = (t, day, interactive) => {
  const done = V6.taskDone(t, day, current);
  const cat = { daily: "", twice: "2–3×/wk", weekly: "Weekly", monthly: "Monthly", event: "Event", training: "Training" }[t.cat];
  const btn = !interactive ? "" : t.kind === "form" ? `<button class="btn small" data-goform="${t.link}">${done ? "View" : "Open"}</button>` : t.kind === "tab" ? `<button class="btn small" data-tab-go="${t.link}">Open</button>` : "";
  return `<div class="ttrow ${done ? "done" : ""}"><span class="tt">${t.time}</span><span class="tk">${done === null ? `<i class="dot"></i>` : done ? icon("check", 'class="i ok"') : `<i class="ring"></i>`}</span><span class="tn">${esc(t.title)}${cat ? `<em>${cat}</em>` : ""}</span><span class="td">${esc(t.dur)}</span>${btn}</div>`;
};
V6.todayPanel = () => {
  const T = V6.tasks(missionDay, current), forms = T.filter(t => t.kind === "form" || t.kind === "tab"), done = forms.filter(t => V6.taskDone(t, missionDay, current)).length;
  return `<section class="panel v6tt"><div class="panelhead">${icon("cal")}<h3>Today's timetable</h3><span class="r"><span class="muted" style="font-size:12.5px">Mission day ${missionDay} · ${V6.WEEKDAYS[V6.wd(missionDay)]} · ${done} of ${forms.length} done</span><button class="btn small" data-tab-go="routine">Full schedule</button></span></div>
    <div class="ttlist">${T.map(t => V6.taskRow(t, missionDay, true)).join("")}</div></section>`;
};
const _renderToday = renderToday;
renderToday = function (res) {
  const h = _renderToday(res), i = h.indexOf("</section>") + 10;
  return h.slice(0, i) + V6.todayPanel() + h.slice(i);
};
V6.renderSchedule = () => {
  const d = V6.ui.schedDay ?? missionDay, T = V6.tasks(d, current), w0 = d - V6.wd(d);
  const week = Array.from({ length: 7 }, (_, i) => w0 + i).map(x => { const tt = V6.tasks(x, current), ex = tt.filter(t => t.cat !== "daily" && t.cat !== "training"), tr = tt.find(t => t.link === "train" && t.cat === "training");
    return `<button class="wday ${x === d ? "sel" : ""} ${x === missionDay ? "today" : ""}" data-sday="${x}"><b>${V6.WEEKDAYS[V6.wd(x)].slice(0, 3)} · day ${x}</b><span>${V6.wd(x) === 6 ? "Rest day" : tr ? esc(tr.title.replace("Lifting: ", "")) : ""}</span>${ex.map(t => `<em>${esc(t.title.split(":")[0])}</em>`).join("")}</button>`; }).join("");
  return `<div class="panel pad schedctl"><button class="btn" data-sday="${d - 1}">‹ Previous day</button><div style="text-align:center"><b style="font-size:16px">Mission day ${d}</b><div class="muted" style="font-size:12.5px">${V6.WEEKDAYS[V6.wd(d)]}${d === missionDay ? " · today" : d < missionDay ? " · past" : " · planned"}</div></div><button class="btn" data-sday="${d + 1}">Next day ›</button></div>
    <div class="weekgrid">${week}</div>
    <section class="panel"><div class="panelhead">${icon("cal")}<h3>Timetable for day ${d}</h3><span class="r muted" style="font-size:12px">Clock times are suggestions; on station they follow the crew schedule</span></div><div class="ttlist">${T.map(t => V6.taskRow(t, d, d === missionDay)).join("")}</div></section>
    <div class="grid2"><section class="panel pad"><h3 style="font-size:15px;margin-bottom:8px">How the plan is built</h3><p class="muted" style="font-size:13px">Six training days and one rest day. Session A (legs and calves) and B (upper body and back) alternate; lifting is in the morning and cardio about 5 hours later, the spacing NASA's Sprint study used. Questionnaires and tests come from the routine and the OCULUS eye schedule; monthly items appear on fixed mission days (cognition day 10, fungal sampling day 15, plates and team questionnaire day 20, samples day 30), eye exams on days 30, 60, 70 and 90.</p></section>
    <section class="panel pad"><h3 style="font-size:15px;margin-bottom:8px">Sources</h3><p class="muted" style="font-size:13px">Team document "Astronaut timetable" (weekly routine, Sprint spacing, ASTRAL questions); NASA NTRS 20110016265 (2.5 h exercise blocks, 6 days a week); English et al. 2020; OCULUS 100-day eye schedule; NASA microbial sampling (5-day incubation).</p></section></div>`;
};

/* =========================================================
   Medical libraries page
   ========================================================= */
V6.renderLibraries = () => {
  const groups = [...new Set(V6.LIBS.map(l => l.group))];
  const stTier = { Excellent: 0, Good: 0, Curated: 1, Conditional: 2, Restricted: 3 };
  const q = V6.ui.libQ, hits = q ? V6.retrieve(q, 4) : [];
  return `<section class="panel pad libarch"><span class="eyebrow">How the doctor's brain works</span>
    <div class="arch"><div class="ab main">${icon("ai")}<b>Health assistant</b><span>One central reasoning system</span></div>
      <div class="arow">${["General medicine", "Specialities", "Space medicine", "Eye health (special focus)"].map(g => `<div class="ab">${icon("book")}<b>${esc(g)}</b><span>${V6.LIBS.filter(l => l.group === g).map(l => esc(l.name.split(" (")[0].split(",")[0])).join(" · ")}</span></div>`).join("")}</div>
      <div class="arow two"><div class="ab">${icon("twin")}<b>Astronaut profile</b><span>Baselines, history, medication, mission phase</span></div><div class="ab">${icon("today")}<b>Monitoring</b><span>Sensors, questionnaires, rule engine findings</span></div></div>
      <div class="ab main out">${icon("crew")}<b>Astronaut and Medical Officer</b><span>Explanations and advice with sources; anything uncertain goes to a human</span></div></div>
    <p class="muted" style="font-size:12.5px;margin-top:10px">Retrieval-augmented generation: the assistant first finds the relevant passages in the libraries, then answers with them and cites them. Libraries can be updated without retraining the AI.</p></section>
    <section class="panel"><div class="panelhead">${icon("ai")}<h3>Try it: what would the assistant look up?</h3></div><div class="pad"><form id="libForm" class="composer" style="padding:0;border:0"><input id="libIn" value="${esc(q)}" placeholder="e.g. my vision is blurry, or how much bone do astronauts lose?" aria-label="Search the libraries"><button class="btn primary" type="submit">Search</button></form>
      ${q ? (hits.length ? `<div class="cards2">${hits.map(V6.cardHTML).join("")}</div>` : `<div class="empty" style="margin-top:10px">Nothing in the libraries matches; the assistant would say so and route the question to a human if needed.</div>`) : ""}</div></section>
    ${groups.map(g => `<div class="sectiontitle"><h3>${esc(g)}</h3></div><div class="libgrid">${V6.LIBS.filter(l => l.group === g).map(l => `<div class="panel lib"><div class="lt"><b>${esc(l.name)}</b>${pill(stTier[l.status], l.status)}</div><span class="muted">${esc(l.by)}</span><p>${esc(l.use)}</p><span class="chip">${esc(l.access)}</span><span class="muted" style="font-size:11.5px">${V6.CARDS.filter(c => c.lib === l.id).length} excerpt(s) in the prototype index</span></div>`).join("")}</div>`).join("")}
    <div class="sectiontitle"><h3>Indexed excerpts</h3><span>${V6.CARDS.length} curated passages; the flight version indexes the full documents</span></div>
    <div class="cards2">${V6.CARDS.map(V6.cardHTML).join("")}</div>
    <section class="panel pad"><h3 style="font-size:15px;margin-bottom:8px">Safeguards</h3><ul class="v6list"><li>Every medical answer cites its source and evidence type.</li><li>Established clinical guidance is kept apart from spaceflight evidence and experimental space biology.</li><li>Clinical guidelines and NASA standards outrank single studies.</li><li>The reliability protocol still decides who answers: libraries make answers better sourced, not more autonomous.</li><li>Licences are checked before content is indexed (the MSD Manual needs permission, so StatPearls and MedlinePlus replace it).</li></ul></section>`;
};
V6.cardHTML = c => `<div class="panel kcard"><div class="lt"><b>${esc(c.title)}</b><span class="chip">${esc(c.ev)}</span></div><p>${esc(c.text)}</p><span class="muted" style="font-size:11.5px">${esc(V6.LIB[c.lib].name)} · ${esc(c.src)}</span></div>`;

/* =========================================================
   Skin check page (MUNAI)
   ========================================================= */
V6.skinCtx = () => {
  const s = st(), g = id => document.getElementById(id);
  const temp = val(s, "temp"), hr = val(s, "hr"), spo2 = val(s, "spo2"), hrv = val(s, "hrv");
  return { temp: temp ?? 36.6, hr: hr ?? 70, spo2: spo2 ?? 98, hrv: hrv ?? 55, skinT: temp !== null ? +(temp - 3.1).toFixed(1) : 33.5,
    site: g("skSite") ? g("skSite").value : "arm", duration: g("skDur") ? g("skDur").value : "subacute", itch: g("skItch") ? g("skItch").checked : false, pain: g("skPain") ? g("skPain").checked : false };
};
V6.analyseSkin = () => {
  const U = V6.ui.skin; if (!U.has) return;
  const ctx = V6.skinCtx(), f = V6.skinFeatures(V6.sctx.getImageData(0, 0, 224, 224).data), ranked = V6.skinScore(f, ctx), top = ranked[0], second = ranked[1];
  const uncertain = top.p < 0.6 || top.p - second.p < 0.2, flagged = top.urgent || (top.contagious && top.id !== "healthy");
  const res = { ranked: ranked.slice(0, 3), top, ctx, f, uncertain, flagged, at: new Date().toTimeString().slice(0, 5), day: missionDay, label: U.label, caseId: null };
  if (uncertain || flagged) res.caseId = V6.skinCase(res, uncertain ? "The screening is not certain enough to rely on." : top.urgent ? `${top.name} needs prompt medical review.` : `${top.name} may be contagious in a closed cabin.`).id;
  U.res = res; (V6.SKINLOG[current] = V6.SKINLOG[current] || []).unshift(res);
  render();
};
V6.SKINLOG = {};
V6.skinCase = (res, why) => {
  const route = { level: 3, topic: { name: "Skin check (photo screening)" }, topics: [], reasons: [why, `Screening: ${res.ranked.map(r => `${r.name} ${Math.round(r.p * 100)}%`).join(", ")}.`, `Site ${res.ctx.site}, ${res.ctx.duration}; itching ${res.ctx.itch ? "yes" : "no"}, pain ${res.ctx.pain ? "yes" : "no"}.`] };
  const item = addCase(current, route, `Skin check photo: possible ${res.top.name.toLowerCase()}`, null);
  item.summary.findings = [`Photo screening (on-board colour-pattern analysis, not a diagnosis): ${res.ranked.map(r => `${r.name} ${Math.round(r.p * 100)}%`).join("; ")}`, `NASA context: ${res.top.inc} (${res.top.cite})`].concat(item.summary.findings);
  item.status = "With Medical Officer: please confirm";
  return item;
};
V6.renderSkin = () => {
  const U = V6.ui.skin, r = U.res, c = V6.skinCtx(), log = V6.SKINLOG[current] || [];
  const vit = [["Core temp", c.temp + " °C"], ["Skin temp (shirt)", c.skinT + " °C"], ["Heart rate", c.hr + " bpm"], ["SpO2", c.spo2 + "%"], ["HRV", c.hrv + " ms"]];
  let out;
  if (!r) out = `<div class="empty">Take or upload a photo, or pick a demo picture, then press Analyse.</div>`;
  else {
    const t = r.top, item = r.caseId ? QUEUE.find(x => x.id === r.caseId) : null;
    const head = t.id === "healthy" && !r.uncertain ? `<h3>No skin concern found</h3><p>The picture looks like normal skin.</p>`
      : r.uncertain ? `<h3>Not certain: the Medical Officer will check it</h3><p>The screening can't tell this reliably, so the photo and a summary were sent to the Medical Officer.</p>`
      : `<h3>Possible ${esc(t.name.toLowerCase())}</h3><p>${r.flagged ? "Because this needs prompt review or may spread in the cabin, it was sent to the Medical Officer." : "This is a screening result, not a diagnosis. Ask the Medical Officer to confirm it."}</p>`;
    out = `<div class="skres ${r.uncertain || r.flagged ? "flag" : "ok"}">${head}
      <div class="skbars">${r.ranked.map(x => `<div class="skbar"><span>${esc(x.name)}</span><div><i style="width:${Math.round(x.p * 100)}%"></i></div><b>${Math.round(x.p * 100)}%</b></div>`).join("")}</div>
      <div class="do"><b>What to do now</b><span>${esc(r.uncertain ? "Keep the area clean and dry, don't scratch or pick it, and avoid sharing towels until the Medical Officer replies." : t.self)}</span></div>
      ${t.id !== "healthy" ? `<p class="muted" style="font-size:12px">NASA context: ${esc(t.inc)} · ${esc(t.cite)}</p>` : ""}
      ${item ? `<div class="casestat"><span class="chip">${icon("routine", 'style="width:13px;height:13px"')}${esc(item.status)}</span>${item.decision ? `<span class="decision">${esc(item.decision)}</span>` : ""}</div>` : `<button class="btn" id="skConfirm">${icon("checkin")}Ask the Medical Officer to confirm</button>`}</div>`;
  }
  return `<div class="grid2 skin"><section class="panel"><div class="panelhead">${icon("skin")}<h3>Photo</h3><span class="r muted" style="font-size:12px">${esc(U.label || "No photo yet")}</span></div>
      <div class="pad skcap"><div class="skcanvas"><canvas id="skCanvas" width="224" height="224"></canvas>${U.has ? "" : `<span>No photo</span>`}</div>
        <div class="skbtns"><label class="btn primary">${icon("skin")}Take or upload photo<input type="file" id="skFile" accept="image/*" capture="environment" hidden></label>
          <span class="eyebrow">Or try a demo picture</span><div class="chipset">${Object.entries(V6.SKIN_DEMOS).map(([k, n]) => `<button class="chip btnchip" data-skdemo="${k}">${esc(n)}</button>`).join("")}</div></div></div>
      <div class="pad ffields" style="border-top:1px solid var(--line)"><label class="ffield"><span>Where on the body</span>${V6.sel("skSite", [["face", "Face"], ["trunk", "Chest, back or belly"], ["arm", "Arms or hands"], ["leg", "Legs or feet"], ["gear", "Where gear, sensors or tape touch"]], c.site)}</label>
        <label class="ffield"><span>How long</span>${V6.sel("skDur", [["acute", "Under 2 days"], ["subacute", "2 to 14 days"], ["chronic", "Over 2 weeks"]], c.duration)}</label>
        <label class="tog"><input type="checkbox" id="skItch" ${c.itch ? "checked" : ""}><span class="tick"></span>Itchy</label><label class="tog"><input type="checkbox" id="skPain" ${c.pain ? "checked" : ""}><span class="tick"></span>Painful or burning</label></div>
      <div class="pad" style="border-top:1px solid var(--line)"><span class="eyebrow">Live vitals used in the analysis (from your sensors)</span><div class="chipset" style="margin-top:8px">${vit.map(([k, v]) => `<span class="chip">${esc(k)} <b>${esc(v)}</b></span>`).join("")}</div></div>
      <div class="pad" style="border-top:1px solid var(--line)"><button class="btn primary" id="skRun" ${U.has ? "" : "disabled"}>${icon("ai")}Analyse</button></div></section>
    <div style="display:flex;flex-direction:column;gap:12px"><section class="panel"><div class="panelhead">${icon("ai")}<h3>Result</h3></div><div class="pad">${out}</div></section>
      <section class="panel"><div class="panelhead">${icon("checkin")}<h3>Earlier checks</h3></div>${log.length ? log.map(x => `<div class="req"><span class="chip">Day ${x.day} · ${x.at}</span><div class="rq"><b>${esc(x.uncertain ? "Uncertain" : x.top.name)}</b><span>${esc(x.label)}${x.caseId ? " · sent to the Medical Officer" : ""}</span></div></div>`).join("") : `<div class="empty" style="margin:12px">None yet.</div>`}</section>
      <div class="panel guard">${icon("shield")}<span>How it works: MUNAI Vision's on-board analysis scores redness, crusts, rings and bright spots in the photo, then combines them with your live vitals and NASA's record of which skin problems happen in space. It is a screening aid, not a trained diagnostic model, so anything uncertain, urgent or contagious goes to the Medical Officer. A flight version would add a validated image model.</span></div></div></div>`;
};
V6.paintSkin = () => {
  const cv = document.getElementById("skCanvas"); if (!cv || !V6.ui.skin.has) return;
  const x = cv.getContext("2d"); x.drawImage(V6.src, 0, 0);
  const r = V6.ui.skin.res; if (r && r.f.spot && r.top.id !== "healthy") { x.strokeStyle = "rgba(255,90,90,.9)"; x.lineWidth = 2; x.setLineDash([5, 4]); x.beginPath(); x.arc(r.f.spot.x, r.f.spot.y, 46, 0, Math.PI * 2); x.stroke(); }
};
V6.loadSkinFile = file => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => { const s = Math.min(img.width, img.height); V6.sctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 224, 224); URL.revokeObjectURL(url); Object.assign(V6.ui.skin, { has: true, res: null, label: file.name || "Photo" }); render(); };
  img.src = url;
};

/* =========================================================
   Workout planner page
   ========================================================= */
V6.renderTrain = () => {
  const id = current, T = V6.TR[id], td = V6.today(id), sci_ = sci(), logs = T.logs, doneToday = logs.find(l => l.day === missionDay);
  const title = td.sess === "rest" ? "Rest day" : td.sess === "easy" ? "Easy day: no lifting" : td.sess === "A" ? "Session A: legs and calves" : "Session B: upper body and back";
  const rules = td.q.steps.length ? `<section class="panel"><div class="panelhead">${icon("info")}<h3>Why today's workout changed</h3><span class="r muted" style="font-size:12px">Rules can only make it easier, never heavier</span></div>${td.q.steps.map(([r, t]) => `<div class="rtask"><span><b>${esc(r)}</b> · ${esc(t)}</span></div>`).join("")}${td.q.flags.map(f => `<div class="rtask"><span style="color:var(--watch)">${esc(f)}</span></div>`).join("")}</section>` : "";
  const cur = T.cur;
  const lifts = td.S.items.filter(i => i.type === "lift"), cards = td.S.items.filter(i => i.type === "cardio");
  const liftRows = lifts.map(i => { const c = cur[i.k] || {}, x = V6.EX[i.k];
    return `<div class="exrow ${c.status || ""}"><div class="exn"><b>${esc(i.name)}</b><span>${i.s} × ${i.rp} · <b class="mono">${i.ld} kg</b> · rest ${i.rs} s · ${i.tp} s per rep · ${i.rir} reps in reserve${i.fac < 1 ? ` · <em>load −${Math.round((1 - i.fac) * 100)}% after failures</em>` : ""}</span><span class="muted">${esc(x.cue.join(" · "))}</span></div>
      ${doneToday ? "" : `<div class="exbtns"><button class="btn small ${c.status === "done" ? "on" : ""}" data-exk="${i.k}" data-exs="done">${icon("check")}Done</button><button class="btn small ${c.status === "fail" ? "on bad" : ""}" data-exk="${i.k}" data-exs="fail">Couldn't finish</button></div>`}
      ${c.status === "fail" ? `<div class="exfail"><label class="ffield"><span>What happened?</span>${V6.sel("exr_" + i.k, [""].concat(V6.FAIL).map(v => [v, v || "Choose a reason"]), c.reason || "", `data-exreason="${i.k}"`)}</label>${c.reason ? `<div class="do"><b>Advice</b><span>${esc(V6.diagnose(c.reason, i.k, id).join(" "))}</span></div>` : ""}</div>` : ""}</div>`; }).join("");
  const cardioRows = cards.map(i => `<div class="exrow"><div class="exn"><b>${esc(i.name)}</b><span>${esc(i.d)} · ${Math.round(i.t)} min · about ${Math.round(i.kc)} kcal</span>${sci_ ? `<span class="muted mono">${i.rows.map(r => `${r.m} min @ ${Math.round(r.pc * 100)}% → ${r.txt}, HR ${r.hr}`).join(" | ")}</span>` : `<span class="muted">Target heart rate up to ${Math.max(...i.rows.map(r => r.hr))} bpm. Harness snug; upright; relaxed arms.</span>`}</div></div>`).join("");
  const today = `<section class="panel"><div class="panelhead">${icon("train")}<h3>${esc(title)}</h3><span class="r muted" style="font-size:12.5px">${V6.WEEKDAYS[V6.wd(missionDay)]} · about ${Math.round(td.S.t)} min incl. set-up · ${Math.round(td.S.kc)} kcal</span></div>
    ${doneToday ? `<div class="notice" style="margin:12px 16px">${icon("check")}Logged today: ${doneToday.items.filter(i => i.status === "done").length} of ${doneToday.items.length} lifts completed, ${doneToday.min} min.</div>` : ""}
    ${lifts.length ? `<div class="exlist">${liftRows}</div>` : ""}<div class="exlist">${cardioRows}</div>
    ${doneToday || td.sess === "rest" ? "" : `<div class="ffoot"><span class="muted">Log every lift, then finish. The plan adjusts loads from what you log.</span><button class="btn primary" id="exFinish">${icon("check")}Finish session</button></div>`}</section>`;
  // progress
  const vol = logs.map(l => [l.day, Math.round(l.items.filter(i => i.status === "done").reduce((a, i) => a + i.ld * i.s * i.rp, 0) / 100) / 10]);
  const sq = logs.filter(l => l.sess === "A").map(l => [l.day, (l.items.find(i => i.k === "sq") || {}).ld || 0]), bp = logs.filter(l => l.sess === "B").map(l => [l.day, (l.items.find(i => i.k === "bp") || {}).ld || 0]);
  const fails = logs.flatMap(l => l.items.filter(i => i.status === "fail").map(i => ({ ...i, day: l.day })));
  const progress = `<div class="grid2"><section class="panel"><div class="panelhead">${icon("today")}<h3>Your progress</h3><span class="r muted" style="font-size:12px">Volume lifted per session (tonnes)</span></div><div class="pad">${V6.chart([{ name: "Volume (t)", color: V6.COLORS[0], pts: vol }], { xfmt: v => "d" + v, label: "Volume per session" })}</div></section>
    <section class="panel"><div class="panelhead">${icon("body")}<h3>Working loads</h3><span class="r muted" style="font-size:12px">kg by mission day</span></div><div class="pad">${V6.chart([{ name: "Squat", color: V6.COLORS[1], pts: sq }, { name: "Bench press", color: V6.COLORS[2], pts: bp }], { xfmt: v => "d" + v, label: "Working loads" })}</div></section></div>
    <section class="panel"><div class="panelhead">${icon("checkin")}<h3>Recent sessions</h3></div><div class="tablewrap"><table><thead><tr><th>Day</th><th>Session</th><th>Lifts done</th><th>Minutes</th><th>kcal</th><th>Notes</th></tr></thead><tbody>${logs.slice(-6).reverse().map(l => `<tr><td class="num">${l.day}</td><td>${l.sess}</td><td class="num">${l.items.filter(i => i.status === "done").length}/${l.items.length}</td><td class="num">${l.min}</td><td class="num">${l.kcal}</td><td>${esc(l.items.filter(i => i.status === "fail").map(i => `${V6.EX[i.k].n}: ${i.reason}`).join("; ") || "All clean")}</td></tr>`).join("")}</tbody></table></div></section>`;
  if (!sci_) return rules + today + progress + `<div class="panel guard">${icon("shield")}<span>Planning aid, not a prescription: a real programme is set by NASA's strength and conditioning specialists and a flight surgeon. Switch the view to Scientist to see every formula and forecast.</span></div>`;
  // Scientist view
  const p = td.p, pl = td.pl || V6.plan(p, td.n), F = V6.forecast(p, pl.A, pl.B, p.days || 180), N = V6.nutrition(p, pl.A, pl.B);
  const calc = [...pl.A.items, ...pl.B.items].filter(i => i.type === "lift").map(i => `<tr><td>${esc(i.name)}</td><td class="num">${Math.round(i.rm)}</td><td class="num">${Math.round(i.pc * 100)}%${i.fac < 1 ? ` ×${i.fac.toFixed(3)}` : ""}</td><td class="num">${i.ld}</td><td class="num">${i.s}×${i.rp}</td><td class="num">${i.rir}</td><td class="num">${i.t.toFixed(1)}</td><td class="num">${Math.round(i.wk)}</td><td class="num">${i.kc.toFixed(1)}</td><td class="num">${Math.round(i.bone)}</td></tr>`).join("");
  const reasons = {}; fails.forEach(f => { reasons[f.reason] = (reasons[f.reason] || 0) + 1; });
  return rules + today + `
    <section class="panel"><div class="panelhead">${icon("ai")}<h3>Calculations: sessions A and B (rotation ${td.n % 3 + 1} of 3: ${pl.rep[0]} reps at ${Math.round(pl.rep[1] * 100)}%)</h3></div><div class="tablewrap"><table><thead><tr><th>Exercise</th><th>Working 1RM</th><th>Intensity</th><th>Load kg</th><th>Sets×reps</th><th>RIR</th><th>Min</th><th>Work J</th><th>kcal</th><th>Bone dose</th></tr></thead><tbody>${calc}</tbody></table></div>
      <div class="pad mono formulas">Load = min(machine max, round(pct × 1RM × adjustment / 2.5) × 2.5) · RIR = 30 × (1RM / load − 1) − reps [Epley] · Work = load × 9.81 × range × reps × sets × 1.33 · kcal = (work / 0.22 / 4184 + 2 × mass × sets × rest / 3600) × 1.06 · Bone dose = sets × reps × (load / mass)^4 · Max HR = 208 − 0.7 × age</div></section>
    <div class="grid2"><section class="panel"><div class="panelhead">${icon("body")}<h3>Bone forecast (${p.days || 180}-day mission)</h3></div><div class="tablewrap"><table><thead><tr><th>Site</th><th>No exercise %/mo</th><th>Plan %/mo</th><th>Loss by end of mission</th><th>Target (entry survey)</th></tr></thead><tbody>${F.sites.map(x => `<tr><td>${esc(x.n)}</td><td class="num">−${x.b}</td><td class="num">−${x.mo.toFixed(2)}</td><td class="num">−${x.total.toFixed(2)}%</td><td class="num">${x.lim ? x.lim + "%" : "—"}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><div class="panelhead">${icon("body")}<h3>Muscle forecast (%/month)</h3></div><div class="tablewrap"><table><thead><tr><th>Group</th><th>Weekly sets</th><th>Plan</th><th>No exercise</th></tr></thead><tbody>${F.muscles.map(m => `<tr><td>${m.g}</td><td class="num">${m.S.toFixed(1)}</td><td class="num">${m.d >= 0 ? "+" : ""}${m.d.toFixed(2)}</td><td class="num">−${m.b}</td></tr>`).join("")}</tbody></table></div><div class="pad muted" style="font-size:12px">Aerobic: predicted VO2max change ${F.dv >= 0 ? "+" : ""}${F.dv.toFixed(2)}% per month.</div></section></div>
    <div class="grid2"><section class="panel"><div class="panelhead">${icon("nutr")}<h3>Energy, protein and water targets</h3></div><div class="tablewrap"><table><thead><tr><th>Day</th><th>kcal</th><th>Protein g</th><th>Carbs g</th><th>Fat g</th><th>Water L</th></tr></thead><tbody>${N.rows.map(r => `<tr><td>${r.n}</td><td class="num">${Math.round(r.kcal)}</td><td class="num">${Math.round(r.protein)}</td><td class="num">${Math.round(r.carbs)}</td><td class="num">${Math.round(r.fat)}</td><td class="num">${r.water.toFixed(1)}</td></tr>`).join("")}</tbody></table></div><div class="pad muted" style="font-size:12px">Resting metabolic rate (Mifflin-St Jeor) ${Math.round(N.rmr)} kcal; daily energy = RMR × 1.25 + session energy.</div></section>
      <section class="panel"><div class="panelhead">${icon("alert")}<h3>Failure analysis</h3></div><div class="pad">${fails.length ? `<div class="chipset">${Object.entries(reasons).map(([r, n]) => `<span class="chip">${esc(r)} <b>×${n}</b></span>`).join("")}</div><p class="muted" style="font-size:12.5px;margin-top:10px">Load adjustments in force: ${Object.entries(T.adj).filter(([, f]) => f < 1).map(([k, f]) => `${V6.EX[k].n} ×${f.toFixed(3)}`).join(", ") || "none"}.</p>` : `<div class="empty">No failed sets logged.</div>`}</div></section></div>
    <section class="panel pad"><h3 style="font-size:15px;margin-bottom:8px">Model constants and provenance</h3><div class="chipset">${Object.entries(V6.WC).map(([k, v]) => `<span class="chip mono">${k} = ${v}</span>`).join("")}</div><p class="muted" style="font-size:12.5px;margin-top:10px">Checked against sources: Sprint protocol and hardware limits (English et al. 2020), calf losses (Trappe 2009, Fitts 2010), NASA-STD-3001 bone targets. Standard formulas: Epley, Mifflin-St Jeor, Tanaka max HR, ACSM equations. Assumptions (not validated): muscle efficiency, bone exponent 4, saturation constants, adaptation rules. The model is not calibrated to crew data.</p></section>`;
};
V6.finishSession = () => {
  const id = current, T = V6.TR[id], td = V6.today(id), s = st();
  const items = td.S.items.filter(i => i.type === "lift").map(i => { const c = T.cur[i.k] || {}; return { k: i.k, ld: i.ld, s: i.s, rp: i.rp, status: c.status === "fail" ? "fail" : "done", reason: c.reason || (c.status === "fail" ? "Other" : null) }; });
  items.filter(i => i.status === "fail").forEach(i => { const recent = T.logs.slice(-6).flatMap(l => l.items).filter(x => x.k === i.k && x.status === "fail").length; if (["Load too heavy", "Form broke down"].includes(i.reason) || recent >= 1) T.adj[i.k] = (T.adj[i.k] || 1) * 0.95; else if (i.reason !== "Poor sleep" && i.reason !== "Joint or muscle pain") T.adj[i.k] = (T.adj[i.k] || 1) * 0.975; });
  T.logs.push({ n: T.logs.length, day: missionDay, sess: td.sess === "A" || td.sess === "B" ? td.sess : "E", items, min: Math.round(td.S.t), kcal: Math.round(td.S.kc) });
  T.cur = {};
  s.exMin = Math.min(180, Math.round(td.S.t - td.S.ov)); const fl = items.filter(i => i.status === "fail").length;
  s.strength = Math.max(50, Math.min(120, s.strength + (fl ? -1 : 0.5)));
  delete aiBrief[id]; render();
};

/* =========================================================
   Fungi page
   ========================================================= */
V6.renderFungi = () => {
  const F = V6.fungiStatus(), type = V6.ui.fType, lim = V6.FLIM[type];
  const incub = V6.FSAMPLES.filter(x => x.day + 5 > missionDay && x.day <= missionDay);
  const series = V6.MODULES.map((m, i) => ({ name: m, color: V6.COLORS[i], pts: V6.FSAMPLES.filter(x => x.module === m && x.type === type && x.cfu !== null && x.day + 5 <= missionDay).sort((a, b) => a.day - b.day).map(x => [x.day, x.cfu]) }));
  const envRows = V6.MODULES.map(m => { const e = V6.ENV[m], r = V6.envRisk(e); return `<tr><td>${esc(m)}</td><td class="num">${e.rh}%</td><td class="num">${e.t} °C</td><td class="num">${e.sm}%</td><td class="num">${e.af} m/s</td><td class="num">${e.pc}</td><td>${pill(r.tier, r.label)}</td></tr>`; }).join("");
  const rows = V6.FSAMPLES.slice().sort((a, b) => b.day - a.day || a.module.localeCompare(b.module)).slice(0, 24).map(x => { const inc = x.day + 5 > missionDay; const over = !inc && x.cfu > V6.FLIM[x.type];
    return `<tr><td class="num">${x.day < 1 ? x.day + " (prev. crew)" : x.day}</td><td>${esc(x.module)}</td><td>${x.type === "air" ? "Air" : "Surface"}</td><td class="num">${inc ? `<span class="chip">Incubating until day ${x.day + 5}</span>` : `${x.cfu} ${V6.FUNIT[x.type]}`}</td><td>${inc ? "—" : pill(over ? 3 : x.cfu > V6.FLIM[x.type] * .7 ? 2 : 0, over ? "Above limit" : x.cfu > V6.FLIM[x.type] * .7 ? "Near limit" : "OK")}</td><td>${esc(x.org)}</td><td class="muted">${esc(x.method)}${x.note ? " · " + esc(x.note) : ""}</td></tr>`; }).join("");
  const conc = F.over.length ? `${F.over.map(o => `${o.m} (${o.t})`).join(", ")} above the limit.` : F.env.length ? `Conditions favour growth in ${F.env.map(e => e.m).join(", ")}.` : "All samples within limits and conditions are dry.";
  return V6.kpis([[F.tier >= 3 ? "Act" : F.tier === 2 ? "Watch" : "OK", "Station fungal status", F.tier], [F.over.length, "Samples above limit", F.over.length ? 3 : 0], [F.env.length, "Modules with risky conditions", F.env.length ? 2 : 0], [incub.length, "Plates incubating"], ["Day " + V6.nextSampling(), "Next sampling round"]]) +
    `<div class="notice ${F.tier >= 2 ? "phase" : ""}">${icon(F.tier >= 2 ? "alert" : "info")}<span><b>${esc(conc)}</b> ${F.tier >= 2 ? "The Medical Officer and Commander see this in cross-crew analysis." : ""}</span></div>
    <section class="panel"><div class="panelhead">${icon("air")}<h3>Continuous risk sensors</h3><span class="r muted" style="font-size:12px">Humidity, moisture and stagnant air predict where fungi can grow</span></div><div class="tablewrap"><table><thead><tr><th>Module</th><th>Humidity</th><th>Temp</th><th>Surface moisture</th><th>Airflow</th><th>Particles /L</th><th>Growth risk</th></tr></thead><tbody>${envRows}</tbody></table></div></section>
    <section class="panel"><div class="panelhead">${icon("fungi")}<h3>Sample results over time</h3><span class="r"><div class="seg small" role="group">${["surface", "air"].map(t => `<button data-ftype="${t}" aria-pressed="${t === type}">${t === "air" ? "Air" : "Surfaces"}</button>`).join("")}</div></span></div>
      <div class="pad">${V6.chart(series, { limit: lim, limitLabel: `ISS limit ${lim} ${V6.FUNIT[type]}`, xfmt: v => "d" + v, label: "Fungal counts by module", y0: 0 })}<p class="muted" style="font-size:12px">Mission days below 1 are the station record from the previous crew. Counts in ${V6.FUNIT[type]}.</p></div></section>
    <div class="grid2"><section class="panel"><div class="panelhead">${icon("checkin")}<h3>Results</h3><span class="r muted" style="font-size:12px">Latest first</span></div><div class="tablewrap"><table><thead><tr><th>Day</th><th>Module</th><th>Type</th><th>Count</th><th>Status</th><th>Organism</th><th>Method</th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section class="panel"><div class="panelhead">${icon("entry")}<h3>Enter a sample</h3></div><form id="fForm" class="pad ffields">
        <label class="ffield"><span>Mission day sampled</span><input type="number" id="fDay" value="${missionDay}"></label>
        <label class="ffield"><span>Module</span>${V6.sel("fMod", V6.MODULES, V6.MODULES[1])}</label>
        <label class="ffield"><span>Sample type</span>${V6.sel("fType", [["surface", "Surface swab"], ["air", "Air (impaction sampler)"]], "surface")}</label>
        <label class="ffield"><span>Count after incubation (blank if still incubating)</span><input type="number" id="fCfu" placeholder="CFU"></label>
        <label class="ffield"><span>Organism identified</span>${V6.sel("fOrg", V6.ORGS.concat(["Pending (MinION sequencing)"]), "None identified")}</label>
        <label class="ffield"><span>Method</span>${V6.sel("fMeth", ["Surface swab + culture", "Impaction sampler + growth plate", "Swab + MinION sequencing"], "Surface swab + culture")}</label>
        <label class="ffield wide"><span>Location note</span><input type="text" id="fNote" placeholder="e.g. behind the hygiene-station panel"></label>
        <div class="ffoot wide" style="padding:0;border:0"><span class="muted">Limits: air ${V6.FLIM.air} ${V6.FUNIT.air}, surfaces ${V6.FLIM.surface} ${V6.FUNIT.surface}.</span><button class="btn primary" type="submit">${icon("check")}Save sample</button></div></form></section></div>
    <section class="panel pad"><h3 style="font-size:15px;margin-bottom:8px">How fungi are monitored</h3><ul class="v6list"><li><b>Air:</b> an impaction sampler draws air onto growth plates, which are incubated for about 5 days before counting.</li><li><b>Surfaces:</b> crew swab equipment and habitat surfaces; samples are analysed by culture and molecular methods, including MinION DNA sequencing on board.</li><li><b>Prediction (our addition):</b> humidity, surface moisture, airflow and particle sensors flag conditions that favour growth before it can be detected, so the crew knows where to look and sample.</li><li><b>Limits:</b> ISS microbial limits (SSP 50260) as used in NASA microbial monitoring papers; verify before the pitch.</li></ul><p class="muted" style="font-size:12px">Sources: team document "Fungal monitoring"; NASA Microbial Tracking; NASA NTRS ISS air sampling.</p></section>`;
};
V6.saveSample = () => {
  const g = id => document.getElementById(id), cfu = g("fCfu").value;
  V6.FSAMPLES.push({ day: +g("fDay").value || missionDay, module: g("fMod").value, type: g("fType").value, cfu: cfu === "" ? null : +cfu, org: g("fOrg").value, method: g("fMeth").value, by: current, note: g("fNote").value });
  if (cfu !== "") { const x = V6.FSAMPLES[V6.FSAMPLES.length - 1]; if (x.day + 5 > missionDay) x.day = missionDay - 5; }
  Object.keys(aiBrief).forEach(k => delete aiBrief[k]); render();
};

/* =========================================================
   Hooks into the rule engine, cross-crew analysis, AI and chat
   ========================================================= */
const _evaluate = evaluate;
evaluate = function (id) {
  const r = _evaluate(id), s = S[id], A = [];
  const add = (tier, dom, title, why, action, o = {}) => A.push({ tier, dom, title, why, action, safety: !!o.safety, src: o.src || "M", ground: o.ground || null });
  const E = V6.formsOf(id).eye;
  if (E) {
    if (E.double === "Yes") add(4, "eye", "New double vision", "Reported in today's eye check.", "Stop critical tasks and contact the Medical Officer now: new double vision needs urgent assessment.", { safety: true, ground: "Flight surgeon and ophthalmology review" });
    if (E.flash === "Yes") add(3, "eye", "New flashes or floaters", "Reported in today's eye check; can signal retinal detachment.", "Tell the Medical Officer today; avoid strenuous exercise until checked.");
    if (E.headvis === "Yes") add(3, "eye", "Headache with visual changes", "Reported in today's eye check.", "Medical Officer to review today; log blood pressure and CO2.");
    if (["Moderately", "Severely"].includes(E.blur) || E.distort === "Yes" || E.changed === "Yes") add(2, "eye", "Vision change reported", `Blur: ${E.blur}, distorted lines: ${E.distort}, changed vs normal: ${E.changed}.`, "Repeat the acuity and Amsler grid check; the Medical Officer reviews it against your baseline.");
    if (["Moderate", "Severe"].includes(E.irrit)) add(2, "eye", "Eye irritation", `${E.irrit} discomfort reported.`, "Use lubricating drops from the kit, check the airflow near your face, and tell the Medical Officer if it lasts.");
  }
  const oct = V6.OCT[id]; if (oct.length >= 2) { const b = oct[0][1], l = oct[oct.length - 1]; if (l[1] - b >= 15) add(2, "eye", "Retinal thickness rising since pre-flight", `OCT ${l[1]} µm on day ${l[0]} vs ${b} µm before flight.`, "Ground eye specialists review the scans; repeat OCT at the next scheduled exam.", { src: "T" }); }
  const F = V6.fungiStatus();
  if (F.over.length) add(3, "air", "Fungal growth above limit on the station", `${F.over.map(o => `${o.m}: ${o.x.cfu} ${V6.FUNIT[o.t]} (${o.t})`).join("; ")}.`, "Clean the area with disinfectant wipes, dry it, and resample in 5 days. Wear a mask while cleaning.", { src: "T" });
  else if (F.env.some(e => e.r.tier >= 3)) add(2, "air", "Conditions favour fungal growth", `${F.env.filter(e => e.r.tier >= 3).map(e => e.m).join(", ")}: high humidity or moisture.`, "Inspect for condensation, improve airflow and take a surface sample there.", { src: "S" });
  const mode = s.mode, hold = a => (mode === "sleep" && a.tier < 4 && !a.safety) || (mode === "emerg" && a.tier < 3) || (["launch", "reentry", "docking"].includes(mode) && !a.safety && a.tier < 4 && a.dom !== "air");
  A.forEach(a => { (hold(a) ? r.held : r.alerts).push(a); if (a.tier > r.dom[a.dom].tier) { r.dom[a.dom].tier = a.tier; r.dom[a.dom].why = a.title; r.dom[a.dom].nodata = false; } });
  r.alerts.sort((x, y) => y.tier - x.tier); r.maxTier = r.alerts.reduce((m, a) => Math.max(m, a.tier), 0);
  return r;
};
const _crewAnalysis = crewAnalysis;
crewAnalysis = function () {
  const out = _crewAnalysis(), F = V6.fungiStatus(), all = CREW.map(c => c.id);
  if (F.over.length) out.push({ tier: 3, kind: "fungi", title: "Fungal growth above the ISS limit", who: all, why: F.over.map(o => `${o.m}: ${o.x.cfu} ${V6.FUNIT[o.t]} ${o.t} sample on day ${o.x.day} (${o.x.org})`).join("; ") + ".", conclusion: `Fungal contamination in ${F.over.map(o => o.m).join(", ")} affects everyone who uses the module, not one person.`, action: "Disinfect and dry the area, find the moisture source, resample in 5 days; crew with respiratory or skin symptoms report them." });
  else if (F.env.length) out.push({ tier: F.env.some(e => e.r.tier >= 3) ? 3 : 2, kind: "fungi", title: "Station conditions favour fungal growth", who: all, why: F.env.map(e => `${e.m}: humidity ${V6.ENV[e.m].rh}%, surface moisture ${V6.ENV[e.m].sm}%, airflow ${V6.ENV[e.m].af} m/s`).join("; ") + ".", conclusion: "No growth confirmed yet, but these modules are damp or poorly ventilated.", action: `Inspect for condensation, improve airflow and take extra surface samples there before the next round (day ${V6.nextSampling()}).` });
  return out.sort((a, b) => b.tier - a.tier);
};
const _snapshot = snapshot;
snapshot = function (id) {
  const o = _snapshot(id), cards = V6.retrieve((V6.lastQ || "") + " " + o.rule_engine_findings.map(f => f.finding).join(" "), 4);
  o.medical_library_excerpts = cards.map(c => ({ id: c.id, library: V6.LIB[c.lib].name, evidence: c.ev, text: c.text, source: c.src }));
  o.recent_questionnaires = V6.formsOf(id); o.workout_today = (() => { const t = V6.today(id); return { session: t.sess, adjustments: t.q.steps.map(x => x.join(": ")) }; })();
  o.station_fungi = (() => { const F = V6.fungiStatus(); return { status: ["OK", "", "Watch", "Act"][F.tier] || "OK", over_limit: F.over.map(x => x.m), risky_conditions: F.env.map(x => x.m) }; })();
  o.citation_rule = "When you rely on a library excerpt, name its source in brackets, e.g. [NASA HRP].";
  return o;
};
const _sendChat = sendChat;
sendChat = async function (q) {
  q = String(q || "").trim(); if (!q) return;
  V6.lastQ = q;
  const id = current, n = (aiChat[id] || []).length, top = evaluate(id).alerts.slice(0, 2).map(a => a.title).join(" ");
  const p = _sendChat(q), msg = (aiChat[id] || [])[n + 1];
  if (msg) msg.cites = V6.retrieve(q + " " + (V6.retrieve(q).length ? "" : top), 3);
  await p; renderChat();
};
chatHTML = function () {
  const log = aiChat[current] || [];
  if (!log.length) return `<div class="msg ai"><span class="by">Assistant</span>Ask me about your data. I answer what I can judge reliably myself, with sources from the medical libraries; anything that needs a human goes to the Medical Officer with a summary.</div>`;
  return log.map(m => {
    if (m.role === "user") return `<div class="msg user"><span class="by">You</span>${esc(m.content)}</div>`;
    const item = m.caseId ? QUEUE.find(x => x.id === m.caseId) : null;
    return `<div class="msg ai l${m.level || 1}"><span class="by">Assistant${m.source === "local" ? " · on-board model" : ""}${m.level ? " · " + lvlBadge(m.level, true) : ""}</span>${m.pending && !m.content ? '<div class="skeleton" style="width:180px"></div>' : esc(m.content).replace(/\n/g, "<br>")}${!m.pending && m.cites && (m.level || 1) <= 2 ? V6.citeHTML(m.cites) : ""}${item ? `<div class="casestat"><span class="chip">${icon("routine", 'style="width:13px;height:13px"')}${esc(item.status)}</span>${item.decision ? `<span class="decision">${esc(item.decision)}</span>` : ""}</div>` : ""}</div>`;
  }).join("");
};
const _localAnswer = localAnswer;
localAnswer = function (q) {
  const base = _localAnswer(q), c = V6.retrieve(q, 1)[0];
  if (/workout|training|exercise|session|squat|lift/i.test(q)) { const t = V6.today(current); return `Today: ${t.sess === "rest" ? "rest day" : t.sess === "easy" ? "easy cycle only" : "session " + t.sess}, about ${Math.round(t.S.t)} min.${t.q.steps.length ? " Adjusted because: " + t.q.steps.map(x => x[1]).join(" ") : " No adjustments needed."}${c ? " " + c.text : ""}`; }
  if (!c || !/^The main thing|^Everything is within/.test(base)) return base;
  return `${c.text} For you right now: ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
};

/* ---------- Render hook ---------- */
const _render = render;
render = function () {
  if (tab === "checkin") { tab = "entry"; V6.ui.entrySub = "daily"; }
  if (workspace === "bench" || role !== "astro" || !["libraries", "fungi", "entry", "routine", "train", "skin"].includes(tab)) { _render(); return; }
  const was = tab; tab = "privacy"; _render(); tab = was;   // draw the frame, then replace the body
  const res = evaluate(current), el = document.getElementById("content");
  renderSide(res);
  const body = { libraries: V6.renderLibraries, fungi: V6.renderFungi, entry: V6.renderEntry, routine: V6.renderSchedule, train: V6.renderTrain, skin: V6.renderSkin }[tab]();
  el.innerHTML = emergencyHTML() + pageHead(tab, res) + body;
  if (tab === "skin") V6.paintSkin();
};
const _renderSide = renderSide;
renderSide = function (res) {
  _renderSide(res);
  const F = V6.fungiStatus(), b = document.querySelector('#side [data-tab="fungi"]'); if (b && F.tier >= 2 && !b.querySelector(".badge")) b.insertAdjacentHTML("beforeend", `<span class="badge t${F.tier}"></span>`);
  const due = V6.tasks(missionDay, current).filter(t => t.kind === "form" && !V6.taskDone(t, missionDay, current)).length, e = document.querySelector('#side [data-tab="entry"]');
  if (e && due) e.insertAdjacentHTML("beforeend", `<span class="count">${due}</span>`);
};

/* ---------- Events ---------- */
(() => {
  const content = document.getElementById("content");
  content.addEventListener("click", e => {
    const t = e.target, g = sel => t.closest(sel);
    let b;
    if ((b = g("[data-esub]"))) { V6.ui.entrySub = b.dataset.esub; render(); return; }
    if ((b = g("[data-goform]"))) { V6.goForm(b.dataset.goform); return; }
    if ((b = g("[data-fsave]"))) { V6.saveForm(b.dataset.fsave); return; }
    if ((b = g("[data-sday]"))) { V6.ui.schedDay = Math.max(1, +b.dataset.sday); render(); return; }
    if ((b = g("[data-ftype]"))) { V6.ui.fType = b.dataset.ftype; render(); return; }
    if ((b = g("[data-skdemo]"))) { V6.drawDemo(V6.sctx, b.dataset.skdemo); Object.assign(V6.ui.skin, { has: true, res: null, label: "Demo: " + V6.SKIN_DEMOS[b.dataset.skdemo] }); render(); return; }
    if (g("#skRun")) { V6.analyseSkin(); return; }
    if (g("#skConfirm")) { const r = V6.ui.skin.res; if (r) { r.caseId = V6.skinCase(r, "The astronaut asked the Medical Officer to confirm the screening result.").id; render(); } return; }
    if ((b = g("[data-exk]"))) { const T = V6.TR[current]; const k = b.dataset.exk, s_ = b.dataset.exs; T.cur[k] = T.cur[k] && T.cur[k].status === s_ ? {} : { status: s_ }; render(); return; }
    if (g("#exFinish")) { V6.finishSession(); return; }
  });
  content.addEventListener("change", e => {
    const t = e.target;
    if (t.id === "skFile" && t.files && t.files[0]) { V6.loadSkinFile(t.files[0]); return; }
    if (t.dataset.exreason) { V6.TR[current].cur[t.dataset.exreason].reason = t.value; render(); return; }
  });
  content.addEventListener("submit", e => {
    if (e.target.id === "libForm") { e.preventDefault(); V6.ui.libQ = document.getElementById("libIn").value.trim(); render(); }
    if (e.target.id === "fForm") { e.preventDefault(); V6.saveSample(); }
  });
  const bench = document.getElementById("benchView");
  bench.addEventListener("input", e => {
    const t = e.target; if (!t.id.startsWith("e_")) return;
    const k = t.id.slice(2), f = V6.ENVF[k], env = V6.ENV[V6.ui.envMod]; env[k] = Number(t.value);
    t.style.setProperty("--p", ((env[k] - f.min) / (f.max - f.min) * 100).toFixed(1) + "%");
    document.getElementById(t.id + "_v").textContent = env[k] + " " + f.unit;
    const r = V6.envRisk(env); document.getElementById("envRisk").innerHTML = pill(r.tier, r.label);
    Object.keys(aiBrief).forEach(x => delete aiBrief[x]); benchResult();
  });
  bench.addEventListener("change", e => {
    const t = e.target;
    if (t.id === "envMod") { V6.ui.envMod = t.value; buildBench(); return; }
    if (t.dataset.sen) setTimeout(buildBench, 0);
  });
  bench.addEventListener("click", e => {
    const b = e.target.closest("[data-envscen]"); if (!b) return;
    if (b.dataset.envscen === "cond") { V6.ui.envMod = "Node 3 (hygiene area)"; Object.assign(V6.ENV[V6.ui.envMod], { rh: 78, sm: 31, af: 0.03, t: 25 }); }
    else V6.MODULES.forEach((m, i) => { V6.ENV[m] = { rh: 48 + i, t: 22.5, sm: 12, af: 0.14, pc: 40 + i * 5 }; });
    Object.keys(aiBrief).forEach(x => delete aiBrief[x]); buildBench();
  });
})();
