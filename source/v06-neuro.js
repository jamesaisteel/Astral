/* =========================================================
   v0.6.2: Sudden neurological symptoms (stroke / TIA warning signs)
   Prompted by the Crew-11 medical evacuation (Jan 2026): a crew member
   was suddenly unable to speak for about 20 minutes, without pain or
   loss of consciousness. Before this fix the Doctor routed such
   questions to level 2 and the rule engine had no matching symptom.
   ========================================================= */
V6.NEURO_SYMPTOMS = ["Speech difficulty", "Weakness or numbness on one side", "Sudden confusion", "Sudden loss of vision"];
SYMPTOMS.push(...V6.NEURO_SYMPTOMS);
// Level 4 topic, checked first: warning signs count even if they have already passed
TOPICS.unshift({
  id: "neuro", name: "Stroke or TIA warning signs", level: 4,
  re: /can'?t (speak|talk|get (my |the )?words)|cannot (speak|talk)|unable to (speak|talk)|trouble (speaking|talking|finding words)|words (came out|come out) wrong|slurr|lost (my )?speech|speech (problem|difficult|loss)|face (droop|drooping)|one side|(arm|leg|hand) (is |feels )?(weak|numb)|sudden(ly)? (confus|weak|numb|vision loss|blind)|lost (my )?vision|tia\b|mini[- ]?stroke/i,
  examples: "I suddenly couldn't speak for a few minutes.",
  checklist: [
    "Stay with the person; note the exact time the symptoms started.",
    "FAST check now: Face droop, Arm weakness, Speech, Time. Repeat every 5 minutes.",
    "Medical Officer: vital signs, 5-lead ECG from the medical kit, blood glucose; ultrasound and echocardiogram if trained.",
    "No spacewalk, exercise or critical tasks. Even if symptoms have passed, treat it as an emergency.",
    "Flight surgeon on the next possible link; the Smart shirt's ECG and vitals from the event are attached automatically."
  ],
  safe: []
});
TOPIC_DOMS.neuro = ["heart", "mind"];
V6.CARDS.push({ id: "neuro1", lib: "spec", ev: "Clinical guideline", title: "Stroke and TIA warning signs", re: /speak|speech|talk|words|slurr|numb|weak|one side|confus|stroke|tia|droop/i,
  text: "Sudden trouble speaking, face droop, weakness or numbness on one side, confusion or vision loss are stroke warning signs. Symptoms that pass within minutes may be a transient ischaemic attack (TIA), which needs the same urgent assessment because the risk of stroke is high in the following days.",
  src: "American Heart Association / American Stroke Association; StatPearls: Transient Ischemic Attack" });
V6.CARDS.push({ id: "neuro2", lib: "hrp", ev: "Spaceflight evidence", title: "Medical events on long missions", re: /speak|speech|stroke|tia|arrhythm|evacuat|heart rhythm|palpitat/i,
  text: "Missions have ended early for medical reasons three times: a urological illness (Salyut 7, 1985), a heart arrhythmia (Mir, 1987) and a sudden temporary loss of speech (ISS Crew-11, 2026), where a heart attack and stroke were ruled out on Earth and the cause stayed unknown. On board, the crew used the station's ultrasound to perform an echocardiogram.",
  src: "NASA and news reports on the Crew-11 evacuation (2026); NASA HRP cardiovascular evidence report" });

// Scenario for the test bench
SCENARIOS["Sudden speech loss (Crew-11 type)"] = c => ({ symptoms: ["Speech difficulty"], mode: "general", hr: c.base.hr + 6, sys: c.base.sys + 8, pain: 0, stress: 7, days: 1 });

// Rule engine: any sudden neurological symptom is a safety-rule emergency
const _evaluate3 = evaluate;
evaluate = function (id) {
  const r = _evaluate3(id), s = S[id], hits = s.symptoms.filter(x => V6.NEURO_SYMPTOMS.includes(x));
  if (hits.length) {
    const hr = val(s, "hr"), sys = val(s, "sys"), spo2 = val(s, "spo2");
    const a = { tier: 4, dom: "mind", title: "Possible stroke or TIA warning sign", safety: true, src: "M",
      why: `${hits.join(", ")} reported. Even if it has passed, this needs urgent assessment. At the time: HR ${hr ?? "no data"} bpm, BP ${sys ?? "?"}/${val(s, "dia") ?? "?"} mmHg, SpO2 ${spo2 ?? "no data"}%. The shirt ECG from the event is kept for review.`,
      action: "Stop all work, stay with the crew member, FAST check every 5 minutes, Medical Officer runs ECG, glucose and ultrasound; flight surgeon now. No spacewalk.",
      ground: "Flight surgeon now: decision on further tests and possible early return" };
    r.alerts.unshift(a); r.dom.mind.tier = 4; r.dom.mind.why = a.title; r.dom.mind.nodata = false; r.maxTier = 4;
  }
  return r;
};

// Routing test: sudden one-sided numbness is now a stroke warning sign (level 4, was 3)
ROUTE_TESTS.forEach(t => { if (Array.isArray(t) && /arm feels numb/i.test(t[0])) t[1] = 4; });
// Readiness: an active emergency safety rule always means "Not ready"
const _readiness = readiness;
readiness = function (res) {
  const R = _readiness(res);
  return res.alerts.some(a => a.tier >= 4 && a.safety) ? { score: Math.min(R.score, 30), label: "Not ready", tier: 4 } : R;
};
