/* =========================================================
   v0.6.3: Medical kit recommendations
   Sources: NASA Crew Systems (Orion medical kit), NASA Medical Operations
   and Clinical Care, OCHMO-TB-044 Medical Operations (2025),
   NASA-STD-3001 Vol 1 and 2. NASA names medication CLASSES, not products:
   "anti-inflammatory, antibiotics, space motion sickness, sleep, and
   allergic-reaction medications". Examples below are common
   over-the-counter medicines in each class (MedlinePlus), shown as
   examples only. Exact item and dose: onboard Medical Checklist
   (JSC 48522), confirmed by the Crew Medical Officer (level 2).
   ========================================================= */
V6.LIBS.push({ id: "kit", group: "Space medicine", name: "NASA medical kit and medical operations", by: "NASA Crew Systems (Orion medical kit), OCHMO-TB-044 Medical Operations (2025), NASA-STD-3001 Vol 1 and 2", access: "Public web pages and technical briefs", status: "Good", use: "Which medicine categories are on board, who may give them and how, and the medical decision chain." });
V6.LIB.kit = V6.LIBS[V6.LIBS.length - 1];
V6.CARDS.push(
  { id: "kit1", lib: "kit", ev: "Standard", title: "What is in the medical kit", re: /medic|kit|pill|tablet|drug|painkiller|ibuprofen|paracetamol|acetaminophen|antihistamine|sleep aid|melatonin|decongest|nause|motion sick|antibiot/i,
    text: "Orion's kit covers 128 medical conditions with 139 resources, including anti-inflammatory, antibiotic, space motion sickness, sleep and allergic-reaction medications. Each crew member also has a personal kit chosen with their flight surgeon, and seat-side medications are kept within reach.", src: "NASA Crew Systems: Orion medical kit" },
  { id: "kit2", lib: "kit", ev: "Standard", title: "Who decides on medication", re: /medic|kit|pill|tablet|drug|dose|painkiller|antibiot|prescri/i,
    text: "The Crew Medical Officer is trained to perform every procedure in the onboard Medical Checklist (JSC 48522) and coordinates all medical care with the Crew Surgeon on the ground, who holds medical authority. Two Crew Medical Officers are trained for each increment.", src: "NASA OCHMO-TB-044 Medical Operations (2025)" },
  { id: "kit3", lib: "kit", ev: "Spaceflight evidence", title: "Do medicines work the same in orbit?", re: /medic|pill|tablet|drug|dose|work the same|expire|shelf/i,
    text: "In low Earth orbit, studies have not shown changes in medication stability, dosing or effectiveness. Shelf life, resupply time and storage are concerns for longer missions beyond low Earth orbit.", src: "NASA Medical Operations and Clinical Care (OCHMO)" },
  { id: "kit4", lib: "kit", ev: "Spaceflight evidence", title: "Space motion sickness", re: /nause|motion sick|vomit|space sick|adaptation/i,
    text: "Space adaptation sickness can persist for several days; motion sickness during adaptation lasts on average about 3 days.", src: "NASA OCHMO-TB-044 Medical Operations (2025)" }
);

// Kit categories the Doctor may suggest (level 2: the Medical Officer confirms)
V6.KIT = [
  { id: "pain", cls: "Anti-inflammatory / pain reliever", med: "Painkiller", re: /pain|ache|headache|sore|back|muscle|joint|ibuprofen|paracetamol|acetaminophen|aspirin|painkiller/i,
    ex: "ibuprofen or paracetamol (acetaminophen)", why: "pain or headache",
    checks: (s, c) => {
      const w = [];
      if (fluidL(s) < 1.5 || s.urine >= 6) w.push("you are short on fluid: an anti-inflammatory like ibuprofen is harder on the kidneys when dehydrated, so paracetamol may suit better; drink first");
      if (s.symptoms.some(x => ["Stomach pain", "Vomiting"].includes(x))) w.push("stomach symptoms: anti-inflammatories can irritate the stomach");
      if (s.symptoms.includes("Headache") && val(s, "co2") !== null && s.co2 >= 3) w.push(`CO2 at your breathing zone is ${s.co2} mmHg, which may be causing the headache: turn on the fan first`);
      return w;
    } },
  { id: "sleep", cls: "Sleep medication", med: "Sleep aid", re: /sleep|insomnia|can'?t sleep|melatonin|sleep aid/i,
    ex: "melatonin, or the sleep aid in your personal kit", why: "trouble sleeping",
    checks: (s) => {
      const w = [];
      if (s.mode === "eva" || ["launch", "docking", "reentry"].includes(s.mode)) w.push("critical operations or a spacewalk are scheduled: no sedating medicine without the Medical Officer");
      if (val(s, "co2") !== null && s.co2 >= 3) w.push(`CO2 near your sleep station is ${s.co2} mmHg; fix the airflow first, it often explains poor sleep`);
      w.push("take it only with at least 7–8 hours before you must be fully alert");
      return w;
    } },
  { id: "sms", cls: "Space motion sickness medication", med: "Motion sickness", re: /nause|motion sick|vomit|queasy|space sick/i,
    ex: "meclizine", why: "nausea or space motion sickness",
    checks: (s) => {
      const w = ["most anti-nausea medicines cause drowsiness: no critical tasks until you know how it affects you"];
      if (s.mode === "eva") w.push("not before a spacewalk");
      if (s.symptoms.includes("Vomiting")) w.push("if you are vomiting, a tablet may not stay down: the Medical Officer chooses another form");
      return w;
    } },
  { id: "allergy", cls: "Allergic-reaction medication (mild symptoms)", med: "Antihistamine", re: /allerg|itch|hives|rash|sneez|hay ?fever|antihistamine/i,
    ex: "a non-drowsy antihistamine such as loratadine or cetirizine", why: "mild allergy symptoms",
    checks: () => ["if your lips, tongue or throat swell or breathing changes, this is an emergency: tell the crew now"] },
  { id: "congest", cls: "Decongestant", med: "Decongestant", re: /congest|stuffy|blocked nose|runny nose|sinus|decongest|cold/i,
    ex: "a decongestant nasal spray or pseudoephedrine", why: "a blocked nose (very common from fluid shift)",
    checks: (s, c) => {
      const w = [];
      const sys = val(s, "sys"); if (sys !== null && sys >= c.base.sys + 15) w.push(`your blood pressure is raised (${sys} mmHg): decongestant tablets can raise it further`);
      w.push("nasal sprays should not be used for more than 3 days in a row");
      return w;
    } }
];
if (!MEDS.includes("Antihistamine")) MEDS.push("Antihistamine");

V6.kitFor = (q, s) => {
  const t = q + " " + s.symptoms.join(" ");
  return V6.KIT.find(k => k.re.test(q)) || V6.KIT.find(k => k.re.test(t));
};
V6.kitSuggestion = (id, q) => {
  const s = S[id], c = crewObj(id), k = V6.kitFor(q, s); if (!k) return null;
  const P = V6.profileText ? V6.profileText(id) : { food_allergies: "not recorded", medical_screening: "" };
  const checks = k.checks(s, c);
  const taken = s.meds.length ? `already taken since the last check-in: ${s.meds.join(", ")}${s.meds.includes(k.med) ? " (same type: no second dose without the Medical Officer)" : ""}` : "no other medicine logged today";
  const allergy = `allergies on file: ${P.food_allergies}`;
  return `Suggestion: for ${k.why}, a medicine from the on-board kit's ${k.cls.toLowerCase()} category, for example ${k.ex}. Exact item and dose come from the Medical Checklist.\nChecked: ${allergy}; ${taken}${checks.length ? "; " + checks.join("; ") : ""}.\nSource: NASA medical kit categories (Orion kit, OCHMO-TB-044).`;
};
const _localSuggestion2 = localSuggestion;
localSuggestion = function (id, route, q) {
  if (route.topic && ["kitmeds", "minorill"].includes(route.topic.id)) { const k = V6.kitSuggestion(id, q); if (k) return k; }
  return _localSuggestion2(id, route, q);
};
// Claude (when available) gets the kit rules too
const _snapshot3 = snapshot;
snapshot = function (id) {
  const o = _snapshot3(id);
  o.medical_kit_rules = "Only suggest medicine CATEGORIES that NASA lists for the on-board kit (anti-inflammatory/pain, space motion sickness, sleep, allergic reaction, decongestant); you may give common over-the-counter examples. Never give a dose (the Medical Checklist and the Medical Officer decide). Antibiotics and prescription medicines are never suggested: they go to the Medical Officer. Always check allergies (entry_survey), medicines already taken today and the activity mode.";
  return o;
};
// When the Medical Officer approves a kit suggestion, it is logged as taken
document.getElementById("content").addEventListener("click", e => {
  const b = e.target.closest('[data-qa="approve"],[data-qa="edit"]'); if (!b) return;
  const item = QUEUE.find(x => x.id === +b.dataset.q); if (!item || !item.suggestion) return;
  const k = V6.KIT.find(x => item.suggestion.toLowerCase().includes(x.cls.toLowerCase())); if (!k) return;
  const s = S[item.crew]; if (!s.meds.includes(k.med)) s.meds.push(k.med);
}, true);
