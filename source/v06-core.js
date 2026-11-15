/* =========================================================
   v0.6 additions: core data and engines
   Sensors by device, medical libraries, skin check (MUNAI port),
   workout planner (Astronaut Training Plan core), fungal monitoring,
   schedule and manual data entry.
   ========================================================= */
const V6 = {};

/* ---------- Small helpers ---------- */
V6.WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
V6.wd = d => (((d - 1) % 7) + 7) % 7;               // mission day 1 = Monday
V6.rng = seed => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
V6.round = (v, n = 0) => { const p = Math.pow(10, n); return Math.round(v * p) / p; };

/* ---------- Icons and domains ---------- */
Object.assign(ICONS, {
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7.5h8M8 11h6"/>',
  skin: '<path d="M5 20c0-6 2-9 7-9s7 3 7 9"/><circle cx="12" cy="6" r="3"/><circle cx="10" cy="15.5" r="1"/><circle cx="14" cy="17" r=".8"/>',
  train: '<path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/>',
  fungi: '<path d="M4 12a8 6 0 0 1 16 0z"/><path d="M10 12v6.5a2 2 0 0 0 4 0V12"/><circle cx="9" cy="9" r=".9"/><circle cx="14.5" cy="8" r=".9"/>',
  entry: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'
});
DOMAINS.eye = "Eyes and vision";
DOM_ICON.eye = "eye";

/* =========================================================
   1. Sensors, organised by the device that produces each value
   Source: team document "Sensors" (categories 1–8).
   ========================================================= */
Object.assign(SENSORS, {
  shirt: "Astroskin smart shirt", headband: "Core-temperature headband", watch: "Actiwatch-Plus",
  dosimeter: "Crew Active Dosimeter", co2mon: "Personal CO2 Monitor", exdev: "Exercise devices (ARED, T2, CEVIS)",
  cabin: "Cabin environment sensors", suit: "Suit telemetry (EMU)", vehicle: "Vehicle accelerometer"
});
V6.DEVICES = [
  { id: "shirt", cat: "Wearable", name: "Astroskin smart shirt (CSA Bio-Monitor)", maker: "Carré Technologies, Canada", where: "Chest and torso, with a headband", tech: "Textile ECG electrodes, respiratory inductance plethysmography bands, optical pulse oximeter, pulse-transit-time blood-pressure estimate",
    nasa: "Tested in NASA's HERA habitat and commissioned for the ISS", keys: ["hr", "hrv", "sys", "dia", "spo2", "resp"] },
  { id: "headband", cat: "Wearable", name: "Dräger core-temperature sensor (KORA)", maker: "Dräger, adapted by KORA IndustrieElektronik", where: "Headband", tech: "Continuous core-temperature estimate, not a skin reading",
    nasa: "ISS Thermolab and Circadian Rhythm investigations", keys: ["temp"] },
  { id: "watch", cat: "Wearable", name: "Actiwatch-Plus", maker: "Philips Respironics", where: "Wrist", tech: "Accelerometer actigraphy; sleep-wake is inferred from movement and the sleep log",
    nasa: "Documented on the ISS", keys: ["sleepH", "sleepEff"] },
  { id: "dosimeter", cat: "Wearable", name: "Crew Active Dosimeter (CAD)", maker: "Mirion Technologies", where: "Pocket", tech: "Direct Ion Storage dose and dose rate",
    nasa: "Used on the ISS since 2020; designated for Artemis II", keys: ["dose", "mdose"] },
  { id: "co2mon", cat: "Environmental", name: "Personal CO2 Monitor", maker: "NASA hardware", where: "Clipped to clothing or cabin-mounted", tech: "NDIR CO2 sensor at the breathing zone",
    nasa: "Documented by NASA", keys: ["co2"] },
  { id: "cabin", cat: "Environmental", name: "Cabin environment sensors", maker: "Spacecraft system", where: "Cabin", tech: "Electrochemical or optical O2 sensor; pressure transducer",
    nasa: "Part of the spacecraft life-support system", keys: ["o2", "press"] },
  { id: "exdev", cat: "Exercise equipment", name: "Exercise devices: ARED, T2 treadmill, CEVIS cycle", maker: "NASA", where: "Exercise equipment", tech: "Device logs: load, time, speed and power",
    nasa: "ISS exercise countermeasure hardware", keys: ["exMin", "strength"] },
  { id: "vehicle", cat: "Vehicle", name: "Vehicle accelerometer", maker: "Spacecraft system", where: "Vehicle structure", tech: "Accelerometer (G-load during launch, docking and re-entry)",
    nasa: "Vehicle telemetry", keys: ["gload"], gap: "Not in the team's Sensors document. It comes from vehicle telemetry; keep it, or add a source for it." }
];
V6.SUITDEV = { id: "suit", cat: "Suit", name: "Spacewalk suit telemetry (EMU / AxEMU)", maker: "NASA / Axiom Space", where: "Pressure suit", tech: "Suit O2, CO2 and pressure sensors, metabolic rate estimate",
  nasa: "Sent to Mission Control during spacewalks (Research 1)", keys: ["suitO2", "evaLeft", "work", "suitCO2", "suitP"], gap: "Not in the team's Sensors document; documented in Research 1 (suit and habitat hardware)." };
// What each device actually reports for each value
V6.OUT = {
  hr: "ECG: heart rate", hrv: "ECG R-R intervals: HRV", sys: "Pulse transit time: systolic estimate", dia: "Pulse transit time: diastolic estimate",
  spo2: "Optical oximeter: SpO2", resp: "RIP bands: breathing rate", temp: "Core temperature estimate", sleepH: "Actigraphy: sleep last night",
  sleepEff: "Actigraphy + sleep log: efficiency", dose: "DIS: dose rate", mdose: "DIS: mission dose so far", co2: "NDIR: CO2 at breathing zone",
  o2: "O2 sensor: cabin oxygen", press: "Pressure transducer: cabin pressure", exMin: "Device log: exercise minutes today", strength: "ARED log: load at usual effort",
  gload: "Accelerometer: G-load", suitO2: "Suit: O2 time left", evaLeft: "Suit: planned time left", work: "Suit: metabolic workload", suitCO2: "Suit: CO2", suitP: "Suit: pressure"
};
// Manual inputs, grouped the way the data is really collected
V6.MANUAL_GROUPS = [
  ["Questionnaires (self-report)", "Tablet questionnaires in Manual data entry", ["sleepQ", "mood", "stress", "fatigue", "lonely", "pain", "borg"]],
  ["Daily logs", "Water pouches and the urine colour chart", ["water", "urine"]],
  ["Medical instruments and tests", "Weekly or scheduled: weighing system, hand dynamometer, computerised reaction test, stand-up test", ["mass", "grip", "rt", "ortho"]]
];
V6.COVERAGE = {
  gaps: [
    ["G-load", "Vehicle accelerometer", "Not in the Sensors document; comes from vehicle telemetry."],
    ["Suit O2, CO2, pressure, workload", "Suit telemetry (EMU / AxEMU)", "Not in the Sensors document; documented in Research 1."],
    ["Urine colour", "Colour chart (self-report)", "The Sensors document lists urine analysis in a lab; the chart is our on-board proxy."]
  ],
  unused: [
    ["Sleep stages", "Dreams dry-EEG headband"], ["Stress (electrodermal activity)", "Empatica E4 wristband"],
    ["Bone density, muscle mass", "Hologic DXA (pre- and post-flight only)"], ["Blood, immune and biochemical markers", "Lab analysis of samples (imported by the Medical Officer)"],
    ["Retina, optic nerve, eye pressure", "Spectralis OCT2, Vivid q ultrasound, Tono-Pen AVIA (OCULUS eye exams)"]
  ]
};

/* ---------- Station environment: fungal-risk sensors (station-wide, not per astronaut) ---------- */
V6.MODULES = ["Node 1 (Unity)", "Node 3 (hygiene area)", "Destiny lab", "Columbus", "Kibo (JEM)", "Crew quarters"];
V6.ENVF = {
  rh: { label: "Relative humidity (SHT45 / BME280)", unit: "%", min: 20, max: 95, step: 1 },
  t: { label: "Air temperature", unit: "°C", min: 16, max: 32, step: 0.5 },
  sm: { label: "Surface moisture (Hydromette-type)", unit: "%", min: 5, max: 45, step: 1 },
  af: { label: "Airflow (SDP-type sensor)", unit: "m/s", min: 0, max: 0.4, step: 0.01 },
  pc: { label: "Particles ≥ 2.5 µm (APM / AeroTrak)", unit: "/L", min: 0, max: 400, step: 5 }
};
V6.ENV = {};
V6.MODULES.forEach((m, i) => { V6.ENV[m] = { rh: 48 + i, t: 22.5, sm: 12, af: 0.14, pc: 40 + i * 5 }; });
Object.assign(V6.ENV["Node 3 (hygiene area)"], { rh: 63, sm: 19, af: 0.09, pc: 75 });
V6.envRisk = e => {
  let s = 0;
  if (e.rh >= 70) s += 2; else if (e.rh >= 60) s += 1;
  if (e.sm >= 25) s += 2; else if (e.sm >= 18) s += 1;
  if (e.af < 0.05) s += 1;
  if (e.t >= 26) s += 1;
  if (e.pc >= 200) s += 1;
  return s >= 4 ? { tier: 3, label: "High", score: s } : s >= 2 ? { tier: 2, label: "Watch", score: s } : { tier: 0, label: "Low", score: s };
};

/* =========================================================
   2. Medical libraries ("the doctor's brain")
   Sources: team documents Brain 1, Brain 2 and Eye (OCULUS).
   Prototype: curated excerpts. A flight version indexes the full documents (RAG).
   ========================================================= */
V6.LIBS = [
  { id: "ncbi", group: "General medicine", name: "NCBI Bookshelf / StatPearls", by: "National Library of Medicine (NIH)", access: "Some content; retrieval services", status: "Conditional", use: "Foundation of general and specialist medical knowledge." },
  { id: "medline", group: "General medicine", name: "MedlinePlus", by: "National Library of Medicine", access: "Developer resources available", status: "Excellent", use: "Plain-language explanations for astronauts." },
  { id: "pubmed", group: "General medicine", name: "PubMed", by: "National Library of Medicine", access: "Downloadable (XML) and API", status: "Excellent", use: "Scientific evidence for less common questions." },
  { id: "msd", group: "General medicine", name: "MSD Manual, Professional", by: "Merck & Co.", access: "Permission required for reuse; no public API", status: "Restricted", use: "Reference only; replaced in the index by StatPearls and MedlinePlus (Brain 2)." },
  { id: "spec", group: "Specialities", name: "Specialist guidelines", by: "AHA, AAN, AAAAI, Endocrine Society, IDSA, WHO, AAOS, AAO, NICE", access: "Guidelines published openly; terms vary", status: "Conditional", use: "Cardiology, neurology, immunology, endocrinology, infection, psychiatry, orthopaedics, ophthalmology." },
  { id: "osdr", group: "Space medicine", name: "NASA Open Science Data Repository (incl. GeneLab)", by: "NASA", access: "REST API, JSON, public AWS storage", status: "Excellent", use: "Real spaceflight biology: human responses, microbes, immune, bone and muscle." },
  { id: "hrp", group: "Space medicine", name: "NASA Human Research Program evidence reports", by: "NASA HRP", access: "Downloadable reports", status: "Good", use: "Astronaut health risks: bone, immune, cardiovascular, sleep, vision, behaviour." },
  { id: "ochmo", group: "Space medicine", name: "NASA OCHMO standards (NASA-STD-3001 Vol 1 and 2)", by: "NASA Office of the Chief Health and Medical Officer", access: "Downloadable PDFs", status: "Good", use: "Real astronaut medical standards and limits." },
  { id: "microbe", group: "Space medicine", name: "NASA Microbial Tracking", by: "NASA", access: "Published studies", status: "Good", use: "Bacteria and fungi on the ISS, resistance and survival." },
  { id: "oculus", group: "Eye health (special focus)", name: "OCULUS eye library", by: "Team research guide, built on NASA OCHMO-MTB-001 (2024) and the 2026 SANS consensus", access: "Curated for this project", status: "Curated", use: "SANS, eye symptoms, NASA eye exams, the 100-day monitoring schedule and red flags." },
  { id: "train", group: "Space medicine", name: "Exercise countermeasure evidence", by: "English et al. 2020 (Sprint), Trappe 2009, Fitts 2010, NASA NTRS", access: "Open access papers", status: "Good", use: "The workout planner's loads, schedule and bone and muscle forecasts." }
];
V6.LIB = Object.fromEntries(V6.LIBS.map(l => [l.id, l]));
// ev: "Clinical guideline" | "Spaceflight evidence" | "Standard" | "Experimental"
V6.CARDS = [
  { id: "sans1", lib: "oculus", ev: "Spaceflight evidence", title: "What SANS is", re: /eye|vision|blur|sans|optic|focus|see|sight|glasses/i,
    text: "Spaceflight-Associated Neuro-ocular Syndrome: optic-disc swelling, flattening of the back of the eye, retinal and choroidal folds and a shift toward farsightedness. About 70% of ISS astronauts show some swelling at the back of the eye; that is a finding, not severe vision loss.", src: "NASA HRP SANS risk; OCHMO-MTB-001 (2024)" },
  { id: "sans2", lib: "oculus", ev: "Clinical guideline", title: "Eye red flags", re: /eye|vision|flash|floater|curtain|double|shadow|blind|can'?t see/i,
    text: "Sudden vision loss, a curtain-like shadow, significant eye pain or new double vision need urgent medical assessment. New flashes or floaters can signal retinal detachment.", src: "OCULUS guide, section 2.6" },
  { id: "sans3", lib: "oculus", ev: "Standard", title: "How eyes are monitored in flight", re: /eye|vision|oct|amsler|acuity|exam|sans/i,
    text: "In flight: ocular questionnaires, visual acuity, Amsler grid, fundoscopy, ocular ultrasound and OCT, reviewed by ground specialists. OCULUS schedule: daily symptom check, weekly acuity and Amsler grid, full exams on days 30, 60, 70 and 90.", src: "OCHMO-MTB-001 (2024); OCULUS section 9" },
  { id: "sans4", lib: "oculus", ev: "Spaceflight evidence", title: "What helps the eyes", re: /eye|vision|prevent|glasses|treat|sans|heal/i,
    text: "No intervention reliably prevents SANS. Space Anticipation Glasses correct refractive shifts but do not reverse swelling. Lower-body negative pressure and B-vitamin pathways are still research. A normal eye pressure does not rule SANS out.", src: "SANS expert consensus (2026); OCULUS sections 4.5, 5, 6" },
  { id: "bone1", lib: "hrp", ev: "Spaceflight evidence", title: "Bone loss in microgravity", re: /bone|fracture|calcium|density|skelet|osteo/i,
    text: "Without countermeasures, hip and spine bone density falls about 1 to 1.5% per month. NASA-STD-3001 requires keeping 90% of pre-flight density at the femoral neck and 95% at hip and spine.", src: "NASA HRP osteoporosis evidence report; NASA SP-20250000273 (2025)" },
  { id: "ex1", lib: "train", ev: "Spaceflight evidence", title: "Exercise countermeasures", re: /exercise|workout|training|strength|muscle|squat|treadmill|ared|lift/i,
    text: "ISS crews have 2.5 h exercise blocks six days a week. The Sprint study used high-intensity resistance and intervals (4×12, 4×8, 4×6; 8×30 s, 6×2 min, 4×4 min) with continuous cardio 4 to 6 h after lifting.", src: "NASA NTRS 20110016265; English et al. 2020, npj Microgravity" },
  { id: "mus1", lib: "train", ev: "Spaceflight evidence", title: "Calf muscle loss", re: /calf|calves|soleus|muscle|leg|heel/i,
    text: "After 6 months on the ISS, calf volume fell 13% (soleus 15%) and peak power 32%, despite exercise. Soleus fibres lose the most power.", src: "Trappe et al. 2009, J Appl Physiol; Fitts et al. 2010, J Physiol" },
  { id: "fluid1", lib: "hrp", ev: "Spaceflight evidence", title: "Fluid shift", re: /fluid|puffy|face|leg|mass|weight|congest|headache/i,
    text: "About 2 litres of fluid leave the legs within hours of reaching orbit and move toward the head. Early body-mass changes are mostly fluid, not tissue.", src: "Moore 1987; Thornton et al. 1975 (NASA NTRS 19750006319)" },
  { id: "imm1", lib: "hrp", ev: "Spaceflight evidence", title: "Immune changes and viral reactivation", re: /immun|infect|virus|fever|cold|shingles|herpes|sick|cough/i,
    text: "Spaceflight alters immune function. Latent viruses reactivate more often: varicella-zoster reactivation was found in 65% of ISS astronauts.", src: "NASA HRP immune evidence report; Rooney et al. 2019, Front Microbiol" },
  { id: "sleep1", lib: "hrp", ev: "Spaceflight evidence", title: "Sleep in space", re: /sleep|tired|fatigue|insomnia|nap|circadian|rest/i,
    text: "Astronauts sleep less than on Earth, often around 6 hours, because of light, noise, schedules and CO2. Sleep loss slows reaction time before people notice it themselves.", src: "NASA HRP sleep and circadian evidence report; Barger et al. 2014, Lancet Neurol" },
  { id: "co21", lib: "ochmo", ev: "Standard", title: "CO2 and headaches", re: /co2|carbon|headache|air|stuffy|ventilat/i,
    text: "Headache reports on the ISS rise as CO2 rises. NASA sets carbon-dioxide limits for crew health in its environmental standards.", src: "Law et al. 2014, J Occup Environ Med; NASA-STD-3001 Vol 2" },
  { id: "rad1", lib: "ochmo", ev: "Standard", title: "Radiation limits", re: /radiat|dose|solar|sievert|shelter|cancer/i,
    text: "NASA's career limit is 600 mSv effective dose. During a solar particle event, crews shelter in the most shielded area until the dosimeters show the event has passed.", src: "NASA-STD-3001 Vol 1 Rev B" },
  { id: "hyd1", lib: "medline", ev: "Clinical guideline", title: "Dehydration signs", re: /drink|water|hydrat|thirst|urine|dizzy|dehydrat/i,
    text: "Dark urine, thirst, dizziness, headache and tiredness are common signs of dehydration. Small, regular drinks work better than large amounts at once.", src: "MedlinePlus: Dehydration" },
  { id: "ortho1", lib: "ncbi", ev: "Clinical guideline", title: "Dizziness on standing after landing", re: /dizz|faint|stand|landing|orthostat|lighthead/i,
    text: "A sustained heart-rate rise above 30 bpm on standing, or a large blood-pressure drop, indicates orthostatic intolerance. After spaceflight it is common and usually improves over days.", src: "StatPearls: Orthostatic Hypotension; NASA HRP cardiovascular report" },
  { id: "sas1", lib: "ncbi", ev: "Clinical guideline", title: "Space motion sickness", re: /nause|vomit|motion|sick|stomach|first week/i,
    text: "Most astronauts have some space motion sickness in the first 2 to 3 days; it usually settles as the vestibular system adapts.", src: "StatPearls: Motion Sickness; NASA HRP" },
  { id: "skin1", lib: "microbe", ev: "Spaceflight evidence", title: "Skin problems on the ISS", re: /skin|rash|itch|red|spot|dermat|blister/i,
    text: "Rashes are the most frequent skin event on the ISS, mostly irritant contact dermatitis from wipes, sensor adhesives and suit friction. Low humidity dries the skin.", src: "NASA Medical Operations CLiFF ICL78 (2023); Voorhies et al. 2019, Sci Rep" },
  { id: "mic1", lib: "microbe", ev: "Spaceflight evidence", title: "How NASA checks for fungi", re: /fung|mould|mold|microb|bacteri|spore|swab/i,
    text: "An impaction air sampler collects spores onto growth plates, incubated for about 5 days. Surfaces are swabbed and analysed by culture and molecular methods, including MinION DNA sequencing.", src: "NASA Microbial Tracking; NASA NTRS air sampling" },
  { id: "mood1", lib: "spec", ev: "Clinical guideline", title: "Isolation and mood", re: /lonely|homesick|mood|stress|depress|anxi|isolat|cope/i,
    text: "Isolation and confinement raise the risk of low mood and conflict. Regular contact with family, sleep, exercise and talking early help; persistent low mood needs a professional.", src: "NASA HRP behavioural health report; WHO mental health guidance" },
  { id: "nut1", lib: "hrp", ev: "Spaceflight evidence", title: "Nutrition in orbit", re: /eat|food|protein|salt|sodium|vitamin|calori|diet|appetite/i,
    text: "Appetite often falls in orbit, so intake should be logged. High sodium is linked to bone loss; vitamin D must come from food or supplements because there is no sunlight.", src: "NASA HRP nutrition; Fitts et al. 2010 (appetite)" }
];
V6.retrieve = (text, n = 3) => {
  const t = String(text || "");
  return V6.CARDS.map(c => ({ c, s: (t.match(new RegExp(c.re.source, "gi")) || []).length })).filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s).slice(0, n).map(x => x.c);
};
V6.citeHTML = cards => cards.length ? `<div class="cites"><span class="eyebrow">Sources used</span>${cards.map(c => `<span class="cite" title="${esc(c.text)}">${icon("book", 'style="width:12px;height:12px"')}<b>${esc(V6.LIB[c.lib].name)}</b> · ${esc(c.src)} <i>${esc(c.ev)}</i></span>`).join("")}</div>` : "";

/* =========================================================
   3. Skin check (port of the team's MUNAI Vision screener)
   Conditions, NASA incidence and citations are MUNAI's; the photo is scored
   by MUNAI's on-board colour-pattern analysis fused with live vitals.
   ========================================================= */
V6.SKIN = [
  { id: "healthy", name: "Healthy skin", icd: "—", prior: 0.45, contagious: false, urgent: false, hint: "none", inc: "Reference: normal skin barrier", cite: "Tronnier et al. 2008, Skin Pharmacol Physiol", self: "Nothing to treat. Keep using the moisturiser in your hygiene kit." },
  { id: "contact_dermatitis", name: "Contact dermatitis", icd: "EK02", prior: 2.635, contagious: false, urgent: false, hint: "low", inc: "2.6 cases per person-year on the ISS; the most common", cite: "NASA Medical Operations CLiFF ICL78 (2023)", self: "Stop using whatever touched the area (wipes, sensor adhesive, gear), rinse gently with water and keep it dry." },
  { id: "eczema", name: "Atopic or dry-skin dermatitis", icd: "EA80", prior: 1.12, contagious: false, urgent: false, hint: "low", inc: "1.1 cases per person-year on the ISS", cite: "Voorhies et al. 2019, Sci Rep (ISS skin microbiome)", self: "Use a fragrance-free emollient often and avoid hot, long cleansing." },
  { id: "herpes_zoster", name: "Herpes zoster (shingles)", icd: "1E91", prior: 0.65, contagious: true, urgent: true, hint: "medium", inc: "VZV reactivation in 65% of ISS astronauts", cite: "Rooney et al. 2019, Front Microbiol", self: "Keep the area covered, don't touch it and avoid sharing towels until the Medical Officer has seen it." },
  { id: "herpes_simplex", name: "Herpes simplex (cold sore)", icd: "1F00", prior: 0.48, contagious: true, urgent: false, hint: "low", inc: "Among the top 4 skin events on Shuttle and ISS", cite: "Crucian et al. 2016, Int J Gen Med", self: "Don't touch or pick it, wash hands after contact and don't share cups or towels." },
  { id: "folliculitis", name: "Folliculitis", icd: "1B71", prior: 0.42, contagious: false, urgent: false, hint: "low", inc: "More Staphylococcus on ISS crew skin", cite: "Voorhies et al. 2019; Singh et al. 2018", self: "Keep the area clean and dry, wear loose clothing and don't squeeze the spots." },
  { id: "impetigo", name: "Impetigo", icd: "1B41", prior: 0.38, contagious: true, urgent: false, hint: "low", inc: "Crew-to-crew bacterial transfer documented", cite: "Barratt et al. 2019, Principles of Clinical Medicine for Space Flight", self: "Cover it, use your own towel and hygiene items, and wash hands after touching it." },
  { id: "cellulitis", name: "Cellulitis", icd: "1B70", prior: 0.25, contagious: false, urgent: true, hint: "high", inc: "High-priority infection on the ISS", cite: "Crucian et al. 2016; Wilson et al. 2007, PNAS", self: "Mark the edge of the redness with a pen, rest the area and tell the Medical Officer now." },
  { id: "tinea", name: "Fungal skin infection (tinea)", icd: "1F28", prior: 0.34, contagious: true, urgent: false, hint: "none", inc: "Seen on long missions; warm, sweaty exercise favours it", cite: "Farkas & Farkas 2021, Dermatol Online J", self: "Keep the skin clean and very dry after exercise and don't share towels." },
  { id: "acne", name: "Acne-like eruption", icd: "ED80", prior: 0.36, contagious: false, urgent: false, hint: "none", inc: "Common early in flight", cite: "Farkas & Farkas 2021", self: "Use a gentle cleanser and avoid picking." },
  { id: "urticaria", name: "Hives (allergic)", icd: "EB05", prior: 0.52, contagious: false, urgent: false, hint: "medium", inc: "Among the top 4 skin events on the ISS", cite: "Crucian et al. 2016, Int J Gen Med", self: "Note anything new you ate or touched. If your lips, tongue or throat swell or breathing changes, call the Medical Officer immediately." },
  { id: "akiec", name: "Radiation or actinic keratosis", icd: "EK90", prior: 0.22, contagious: false, urgent: false, hint: "none", inc: "Raised cumulative risk on long missions", cite: "NASA HRP: Risk of Radiation Carcinogenesis", self: "Leave it alone and log it; it needs a dermatology review, not urgent care." }
];
V6.skinFeatures = data => {
  // data: RGBA of a 224×224 image (MUNAI runLocalPixelAnalysis)
  let dark = 0, red = 0, bright = 0, crust = 0, cRed = 0, ringRed = 0, wx = 0, wy = 0, wt = 0, bgR = 0, bgG = 0, bgB = 0, bgN = 0;
  for (let y = 0; y < 224; y++) for (let x = 0; x < 224; x++) if (x < 18 || x > 205 || y < 18 || y > 205) { const i = (y * 224 + x) * 4; bgR += data[i]; bgG += data[i + 1]; bgB += data[i + 2]; bgN++; }
  bgR /= bgN; bgG /= bgN; bgB /= bgN;
  // v0.6: redness is measured against the surrounding skin, so normal skin tone of any colour is not "red"
  const bgRed = bgR - (bgG + bgB) * 0.5;
  for (let y = 0; y < 224; y++) for (let x = 0; x < 224; x++) {
    const i = (y * 224 + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b, redness = Math.max(0, r - (g + b) * 0.5 - bgRed) * 1.4, diff = Math.hypot(r - bgR, g - bgG, b - bgB);
    const honey = diff > 38 && r > g + 16 && g > b + 24 && (r - b) > 58 && lum > 95 && lum < 190;
    const dc = Math.hypot(x - 112, y - 112);
    if (redness > 32) { if (dc < 24) cRed++; else if (dc >= 32 && dc <= 52) ringRed++; }
    if (lum < 85) dark++; if (redness > 36) red++; if (lum > 225) bright++; if (honey) crust++;
    const sal = Math.max(0, redness - 22) + (lum < 95 ? 95 - lum : 0) + (honey ? diff * 1.4 : 0);
    if (sal > 18) { wx += x * sal; wy += y * sal; wt += sal; }
  }
  const n = 224 * 224;
  return { dark: dark / n, red: red / n, bright: bright / n, crust: crust / n, annular: ringRed > 180 && cRed < ringRed * 0.28 ? 1 : 0, spot: wt > 0 ? { x: wx / wt, y: wy / wt } : null };
};
V6.skinScore = (f, ctx) => {
  // ctx: {temp, hr, spo2, hrv, skinT, itch, pain, duration, site}
  const vis = {};
  V6.SKIN.forEach(c => {
    let s = 0.08;
    if (c.id === "impetigo") s += f.crust * 14 + f.red * 1.2;
    if (c.id === "akiec") s += f.crust * 9 + f.bright * 3.2 + f.red * 1.6;
    if (c.id === "herpes_zoster" || c.id === "herpes_simplex") s += f.crust * 8 + (f.bright + f.red) * 3 + (f.bright > 0.015 && f.red > 0.08 ? 0.7 : 0);
    if (c.id === "tinea") s += (f.bright < 0.01 ? f.annular : 0) * 1.8 + f.red * 2.4;
    if (c.id === "urticaria") s += (f.bright < 0.01 ? f.annular : 0) * 0.6 + f.red * 2.4;
    if (["contact_dermatitis", "eczema", "cellulitis"].includes(c.id)) s += f.red * 3.6;
    if (["folliculitis", "acne"].includes(c.id)) s += f.bright * 3.4 + f.red * 2;
    if (c.id === "healthy" && f.dark < 0.03 && f.red < 0.03 && f.crust < 0.006 && f.bright < 0.008) s += 1.9;
    vis[c.id] = Math.min(0.99, s);
  });
  const febrile = ctx.temp >= 37.8 || ctx.hr > 100 || ctx.spo2 < 94, warm = ctx.skinT >= 35.2, stressed = ctx.hrv <= 32;
  const logits = V6.SKIN.map(c => {
    let l = vis[c.id] * 5.2 + Math.log(1 + c.prior) * 0.42, d = 0;
    const a = c.hint === "high" ? 0.94 : c.hint === "medium" ? 0.64 : c.hint === "low" ? 0.28 : 0.08;
    if (c.hint === "high") { d = febrile ? 2.5 + (ctx.temp - 37.5) * 0.8 : -1.2; if (c.id === "cellulitis" && (warm || ctx.pain)) l += 1.85; }
    else if (c.hint === "medium") {
      if (c.id === "urticaria") { if (ctx.itch) d += 1.9; if (ctx.duration === "acute") l += 1.5; if (ctx.spo2 < 94) l += 1.4; }
      if (c.id === "herpes_zoster") { if (ctx.pain) l += 2.1; if (ctx.site === "trunk") l += 1.1; if (stressed) l += 0.9; }
    } else if (c.hint === "low") {
      if (["eczema", "contact_dermatitis"].includes(c.id) && ctx.itch) d += 1.5;
      if (c.id === "contact_dermatitis" && ctx.site === "gear") l += 1.95;
      if (c.id === "herpes_simplex" && (ctx.site === "face" || ctx.pain || stressed)) l += 1.25;
      if (c.id === "impetigo" && ctx.itch) d -= 0.7;
      if (c.id === "folliculitis" && warm && !febrile) l += 0.7;
    } else {
      if (c.id === "tinea" && ctx.itch) l += 1.2;
      if (c.id === "akiec" && ctx.duration === "chronic") l += 2.1;
      if (c.id === "acne" && ctx.site === "face") l += 0.9;
      if (febrile) d -= 0.6;
    }
    return l + a * d;
  });
  const mx = Math.max(...logits), ex = logits.map(v => Math.exp(v - mx)), sum = ex.reduce((a, b) => a + b, 0);
  return V6.SKIN.map((c, i) => ({ ...c, p: ex[i] / sum })).sort((a, b) => b.p - a.p);
};
// Demo pictures drawn on the device, so judges can try it without a photo
V6.SKIN_DEMOS = { healthy: "Healthy skin", patch: "Red, itchy patch", ring: "Ring-shaped rash", crust: "Honey-coloured crusts", blisters: "Cluster of blisters" };
V6.drawDemo = (ctx, kind) => {
  const R = V6.rng(kind.length * 977 + 3);
  ctx.fillStyle = "rgb(224,178,152)"; ctx.fillRect(0, 0, 224, 224);
  for (let i = 0; i < 1600; i++) { const v = (R() - 0.5) * 18; ctx.fillStyle = `rgba(${200 + v},${160 + v},${135 + v},0.35)`; ctx.fillRect(R() * 224, R() * 224, 2, 2); }
  const blob = (x, y, r, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(224,178,152,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  if (kind === "patch") { ctx.fillStyle = "rgba(212,96,86,0.85)"; ctx.beginPath(); ctx.ellipse(112, 112, 62, 50, 0.4, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < 9; i++) blob(112 + (R() - 0.5) * 70, 112 + (R() - 0.5) * 70, 30 + R() * 20, "rgba(205,84,76,0.9)"); }
  if (kind === "ring") { ctx.strokeStyle = "rgba(205,80,74,0.95)"; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(112, 112, 42, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(240,225,210,0.8)"; ctx.beginPath(); ctx.arc(112, 112, 50, 0, Math.PI * 2); ctx.stroke(); }
  if (kind === "crust") { for (let i = 0; i < 6; i++) blob(112 + (R() - 0.5) * 70, 112 + (R() - 0.5) * 70, 24, "rgba(210,90,80,0.7)"); for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgb(${200 + R() * 20},${140 + R() * 20},${50 + R() * 20})`; ctx.beginPath(); ctx.ellipse(112 + (R() - 0.5) * 80, 112 + (R() - 0.5) * 80, 8 + R() * 8, 6 + R() * 6, R() * 3, 0, Math.PI * 2); ctx.fill(); } }
  if (kind === "blisters") { ctx.fillStyle = "rgba(208,92,84,0.9)"; ctx.beginPath(); ctx.ellipse(112, 112, 70, 42, -0.3, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < 22; i++) { const x = 112 + (R() - 0.5) * 70, y = 112 + (R() - 0.5) * 50; ctx.fillStyle = "rgba(252,246,236,0.95)"; ctx.beginPath(); ctx.arc(x, y, 4 + R() * 3, 0, Math.PI * 2); ctx.fill(); } }
};

/* =========================================================
   4. Workout planner: shared calculation core of the team's
   Astronaut Training Plan (astronaut-app / scientist-app).
   ========================================================= */
V6.WC = { epley: 30, eff: .22, ecc: 1.33, after: 1.06, boneExp: 4, earthRef: 16589, actF: 1.25, Kbig: 8, Kupper: 6, baseSpin: 1.2, overheadMin: 13, overheadPer: 1.5, ht: 208, hf: .7, fitsRun: 1.8, fitsWalk: 1.1, plantarK: .2, cycleK: 1.8 };
V6.EX = {
  sq: { n: "Squat", b: "sq", f: 1, d: .55, ax: 1, mu: { Quads: 1, Glutes: 1, Hamstrings: .3, Core: .4, Back: .2 }, cue: ["Knees track over the middle toes", "Chest up, no forward pitch against the harness"] },
  dl: { n: "Deadlift", b: "dl", f: 1, d: .5, ax: 1, mu: { Glutes: 1, Hamstrings: 1, Back: 1, Quads: .5, Core: .4 }, cue: ["Neutral spine throughout", "Do not lean back at the top"] },
  hr: { n: "Seated heel raise (soleus)", b: "sq", f: .9, d: .1, ax: 1, mu: { Calves: 1 }, cue: ["Full ankle range, no bouncing", "Slow: 3 s up, 1 s pause, 3 s down"] },
  bp: { n: "Bench press", b: "bp", f: 1, d: .4, ax: 0, mu: { Chest: 1, Shoulders: .5, Arms: .5 }, cue: ["Elbows 45–60° from the body", "Wrists stacked over elbows"] },
  row: { n: "Bent-over row", b: "bp", f: .75, d: .4, ax: 0, mu: { Back: 1, Arms: .5, Shoulders: .3 }, cue: ["No momentum from the hips", "Elbows close to the body"] },
  ohp: { n: "Overhead press", b: "bp", f: .62, d: .5, ax: 1, mu: { Shoulders: 1, Arms: .5, Core: .3 }, cue: ["No back arch", "Bar path straight"] },
  cur: { n: "Biceps curl", b: "bp", f: .35, d: .45, ax: 0, mu: { Arms: 1 }, cue: ["No swinging", "Full extension at the bottom"] }
};
V6.IVS = [
  { n: "4 × (4 min hard + 3 min easy)", seg: [[5, .55], ...Array.from({ length: 4 }, () => [[4, .9], [3, .6]]).flat(), [3, .5]] },
  { n: "6 × (2 min hard + 2 min easy)", seg: [[5, .55], ...Array.from({ length: 6 }, () => [[2, .92], [2, .6]]).flat(), [3, .5]] },
  { n: "8 × (30 s hard + 60 s easy)", seg: [[5, .55], ...Array.from({ length: 8 }, () => [[.5, .95], [1, .6]]).flat(), [3, .5]] }
];
V6.REPS = [[12, .65, 90], [8, .75, 150], [6, .83, 180]];
V6.BASE_MUS = { Quads: [2.2, 13], Hamstrings: [1.8, 6], Glutes: [1.8, 10], Calves: [3, 6], Back: [2.2, 20], Core: [1.5, 8], Chest: [.8, 7], Shoulders: [.8, 8], Arms: [.6, 10] };
V6.PROFILE = {
  "CM-1": { h: 180, bf: 18, vo2: 46, sq: 140, dl: 170, bp: 100 }, "CM-2": { h: 168, bf: 24, vo2: 42, sq: 95, dl: 115, bp: 55 },
  "CM-3": { h: 177, bf: 20, vo2: 44, sq: 125, dl: 150, bp: 85 }, "CM-4": { h: 165, bf: 22, vo2: 48, sq: 100, dl: 120, bp: 52 }
};
V6.prof = id => { const c = crewObj(id), P = V6.PROFILE[id]; return { m: c.kg, age: c.age, sex: c.sex === "male" ? 1 : 0, max: 272, hf: 70, adj: (V6.TR[id] || {}).adj || {}, ...P }; };
V6.lift = (p, e) => {
  const x = V6.EX[e.k], C = V6.WC, rm = p["own_" + e.k] || p[x.b] * x.f, fac = p.adj[e.k] || 1, sg = p.seg || {};
  const seg = ["sq", "dl", "hr"].includes(e.k) ? (sg.femur ? sg.femur / 45 : 1) : (sg.arm ? sg.arm / 30 : 1);
  const ld = Math.min(p.max, Math.round(e.pc * rm * fac / 2.5) * 2.5), rir = Math.max(0, Math.round(C.epley * (rm / ld - 1) - e.rp));
  const t = e.s * (e.rp * e.tp + e.rs) / 60, wk = ld * 9.81 * x.d * seg * e.rp * e.s * C.ecc, kc = (wk / C.eff / 4184 + 2 * p.m * e.s * e.rs / 3600) * C.after;
  const bone = x.ax ? e.s * e.rp * Math.pow(ld / p.m, C.boneExp) : 0, mu = {};
  for (const g in x.mu) mu[g] = x.mu[g] * e.s;
  return { type: "lift", k: e.k, name: x.n, s: e.s, rp: e.rp, pc: e.pc, rs: e.rs, tp: e.tp, rm, ld, rir, t, wk, kc, bone, mu, fac };
};
V6.cardio = (p, e) => {
  const C = V6.WC, hmax = C.ht - C.hf * p.age, hfr = p.hf / 100; let kc = 0, t = 0, bone = 0, hi = 0; const rows = [];
  for (const [m, pc] of e.seg) {
    const vo = pc * p.vo2, k = vo * p.m * m * 5 / 1000, hr = Math.round(hmax * (.64 * pc + .37)); kc += k; t += m; if (pc >= .85) hi += m;
    if (e.cardio === "tm") { const sp = (vo - 3.5) / (C.plantarK * (.4 + .6 * hfr)) * .06, fr = (pc >= .55 ? C.fitsRun : C.fitsWalk) * hfr; bone += 170 * m * Math.pow(fr, 4); rows.push({ m, pc, txt: sp.toFixed(1) + " km/h", hr }); }
    else rows.push({ m, pc, txt: Math.round((vo - 7) * p.m / C.cycleK / 6.12) + " W", hr });
  }
  return { type: "cardio", cardio: e.cardio, name: e.name, d: e.d, t, kc, bone, hi, rows, mu: {} };
};
V6.session = (p, list) => {
  const items = list.map(e => e.cardio ? V6.cardio(p, e) : V6.lift(p, e)), ov = V6.WC.overheadMin + V6.WC.overheadPer * items.length;
  return { items, ov, t: items.reduce((a, i) => a + i.t, 0) + ov, kc: items.reduce((a, i) => a + i.kc, 0), bone: items.reduce((a, i) => a + i.bone, 0), hi: items.reduce((a, i) => a + (i.hi || 0), 0), cm: items.filter(i => i.type === "cardio").reduce((a, i) => a + i.t, 0) };
};
V6.plan = (p, n, o = {}) => {
  const R = V6.REPS[n % 3], iv = V6.IVS[Math.floor(n / 2) % 3], sets = o.sets || 4, hard = o.hard !== false;
  const easy = { n: "Easy intervals (adjusted)", seg: [[5, .55], [20, .6], [3, .5]] };
  const A = [{ k: "sq", s: sets, rp: R[0], pc: R[1], rs: R[2], tp: 4 }, { k: "dl", s: sets, rp: R[0], pc: R[1], rs: R[2], tp: 4 }, { k: "hr", s: sets, rp: 15, pc: .57, rs: 60, tp: 6 },
    { cardio: "tm", name: "Treadmill intervals", d: (hard ? iv : easy).n, seg: (hard ? iv : easy).seg }];
  const B = [{ k: "bp", s: sets, rp: 8, pc: .72, rs: 90, tp: 4 }, { k: "row", s: sets, rp: 8, pc: .75, rs: 90, tp: 4 }, { k: "ohp", s: Math.max(2, sets - 1), rp: 8, pc: .72, rs: 90, tp: 4 }, { k: "cur", s: 2, rp: 12, pc: .65, rs: 60, tp: 4 },
    { cardio: "tm", name: "Treadmill steady run", d: hard ? "30 min continuous at 75% VO2max" : "25 min at 70% VO2max", seg: hard ? [[3, .5], [27, .75]] : [[3, .5], [22, .7]] }, { cardio: "cy", name: "Cycle ergometer", d: "15 min easy", seg: [[3, .5], [12, .6]] }];
  return { A: V6.session(p, A), B: V6.session(p, B), iv: iv.n, rep: R };
};
V6.forecast = (p, A, B, days = 180) => {
  const C = V6.WC, rf = 3, gl = {}; for (const g in V6.BASE_MUS) gl[g] = 0;
  for (const s of [A, B]) for (const i of s.items) { for (const g in i.mu) gl[g] += rf * i.mu[g]; if (i.type === "cardio" && i.cardio === "tm") for (const g of ["Calves", "Quads", "Glutes", "Hamstrings"]) gl[g] += rf * ({ Calves: 1, Quads: .5, Glutes: .5, Hamstrings: .5 })[g] * i.t / 10; }
  const muscles = Object.keys(V6.BASE_MUS).map(g => { const [b] = V6.BASE_MUS[g], S = gl[g], K = ["Chest", "Shoulders", "Arms"].includes(g) ? C.Kupper : C.Kbig; return { g, S, b, d: -b + (b + C.baseSpin) * S / (S + K) }; });
  const sbn = (s, f) => s.items.filter(f).reduce((a, i) => a + i.bone, 0);
  const run = rf * (sbn(A, i => i.type === "cardio") + sbn(B, i => i.type === "cardio")) / 7, lift = rf * (sbn(A, i => i.type === "lift") + sbn(B, i => i.type === "lift")) / 7, heel = rf * sbn(A, i => i.k === "hr") / 7;
  const up = rf * [A, B].reduce((t, s) => t + s.items.filter(i => ["bp", "row", "ohp", "cur"].includes(i.k)).reduce((a, i) => a + i.s * i.rp * Math.pow(i.ld / p.m, 2), 0), 0);
  const sites = [["Femoral neck / hip", 1.5, (run + lift) / C.earthRef, .4, p.tFem || 10], ["Lumbar spine", 1.0, (lift + .4 * run) / C.earthRef, .4, p.tLum || 5], ["Tibia / heel", 1.2, (run + rf * heel) / C.earthRef, .4, null], ["Radius / arm", .3, up / 250, .5, null]]
    .map(([n, b, r, k, lim]) => { const mo = b / (1 + Math.pow(r / k, 2)); return { n, b, mo, total: mo * days / 30.4, lim }; });
  const dv = -1.2 + .9 * Math.min(1, rf * A.hi / 30) + .5 * Math.min(1, rf * (A.cm + B.cm) / 150);
  return { muscles, sites, dv };
};
V6.nutrition = (p, A, B) => {
  const rmr = 10 * p.m + 6.25 * p.h - 5 * p.age + (p.sex ? 5 : -161), b0 = rmr * V6.WC.actF;
  return { rmr, rows: [["Session A day", A.kc, 1.6, 5, A.t], ["Session B day", B.kc, 1.6, 4.5, B.t], ["Rest day", 0, 1.4, 3.5, 0]].map(([n, ex, pr, cb, t]) => { const k = b0 + ex; return { n, kcal: k, protein: pr * p.m, carbs: cb * p.m, fat: (k - 4 * pr * p.m - 4 * cb * p.m) / 9, water: (35 * p.m + 650 * t / 60) / 1000 }; }) };
};
V6.FAIL = ["Load too heavy", "Not enough rest", "Poor sleep", "Under-fuelled / dehydrated", "Joint or muscle pain", "Harness or bungee slipped", "Form broke down", "Tired / low motivation"];
V6.diagnose = (reason, k, id) => {
  const fails = (V6.TR[id].logs || []).slice(-6).flatMap(l => l.items).filter(i => i.k === k && i.status === "fail").length;
  const out = [];
  if (reason === "Joint or muscle pain") out.push("Stop this exercise today. Pain is a safety signal: tell the Medical Officer and use the cycle instead.");
  if (reason === "Harness or bungee slipped") out.push("Re-check harness fit and clips before the next set; if it keeps slipping, report the device.");
  if (reason === "Poor sleep") out.push("Sleep was short: this session's sets are cut by 30% (rule R2).");
  if (reason === "Under-fuelled / dehydrated") out.push("Eat a carb snack 1–2 h before lifting and drink before the session.");
  if (reason === "Load too heavy" || fails >= 2) out.push(`Load reduced 5% for next time${fails >= 2 ? ` (failed ${fails} times recently)` : ""}.`);
  if (reason === "Form broke down") out.push("Lower the load by 5% and slow the tempo; re-read the form cues.");
  if (reason === "Not enough rest") out.push("Hold the full rest shown before the next set.");
  if (!out.length) out.push("No single cause: load reduced 2.5% and rechecked next session.");
  return out;
};
V6.TR = {};   // crew id -> {logs:[{n, day, sess, items:[{k, ld, s, rp, status, reason}], min, kcal}], adj:{k: factor}, cur:{k:{status, reason}}}
CREW.forEach((c, ci) => {
  const R = V6.rng(ci * 31 + 7), logs = [], adj = {};
  V6.TR[c.id] = { logs, adj, cur: {} };
  let n = 0;
  for (let d = 20; d < 34; d++) {
    if (V6.wd(d) === 6) continue;
    const p = V6.prof(c.id), pl = V6.plan(p, n), sess = n % 2 === 0 ? "A" : "B", S = pl[sess];
    const items = S.items.filter(i => i.type === "lift").map(i => {
      const fail = (i.k === "sq" && d === 25) || (ci === 1 && i.k === "bp" && d === 30) || R() < 0.04;
      return { k: i.k, ld: i.ld, s: i.s, rp: i.rp, status: fail ? "fail" : "done", reason: fail ? (d === 25 ? "Poor sleep" : "Load too heavy") : null };
    });
    logs.push({ n, day: d, sess, items, min: Math.round(S.t), kcal: Math.round(S.kc) });
    if (items.some(i => i.status === "fail" && i.reason === "Load too heavy")) items.filter(i => i.status === "fail").forEach(i => { adj[i.k] = (adj[i.k] || 1) * 0.95; });
    n++;
  }
});
// Rules that adapt today's session (from the team's ASTRAL rules R1–R8, fed by our own data)
V6.rules = id => {
  const s = S[id], c = crewObj(id), F = V6.formsOf(id), sl = val(s, "sleepH"), rec = F.sleeprec, exf = F.exercise;
  const out = { stop: false, f: 1, d: 0, hard: true, steps: [], flags: [] };
  const hit = (r, t) => out.steps.push([r, t]);
  if (s.symptoms.some(x => ["Chest pain", "Dizziness", "Vomiting"].includes(x)) || s.pain >= 7 || (val(s, "temp") !== null && s.temp >= 38) || (exf && exf.symptoms === "Yes")) { out.stop = true; hit("R1 safety", "Symptom, high pain or fever: no lifting today, 30 min easy cycle only."); out.flags.push("Tell the Medical Officer before the next session."); }
  if ((sl !== null && sl < 6.5) || (rec && +rec.rested <= 2)) { out.f *= 0.7; hit("R2 sleep", `Sleep ${sl ?? "?"} h${rec ? `, rested ${rec.rested}/5` : ""}: sets cut by 30%.`); }
  if (rec && rec.recovered === "No") { out.f *= 0.7; hit("R3 recovery", "Not recovered from the last session: sets cut by 30%."); } else if (rec && rec.recovered === "Partially") { out.d += 1; hit("R3 recovery", "Partly recovered: one fewer set."); }
  if (exf && exf.soreness === "Severe") { out.f *= 0.7; out.hard = false; hit("R4 soreness", "Severe soreness: sets cut by 30%, no hard intervals."); } else if (exf && exf.soreness === "Moderate") { out.d += 1; hit("R4 soreness", "Moderate soreness: one fewer set."); }
  const T = nutTotals(s), G = nutTargets(c); if (s.food.length && T.kcal < G.kcal * 0.8) { out.hard = false; hit("R5 nutrition", `Intake ${Math.round(T.kcal)} of ${G.kcal} kcal: no hard intervals.`); out.flags.push("Nutrition review: low intake."); }
  if (fluidL(s) < 1.5 || s.urine >= 6) { out.hard = false; hit("R6 hydration", `Fluid ${fluidL(s)} L, urine colour ${s.urine}/8: no hard intervals.`); }
  if (s.borg >= 18 && rec && rec.recovered !== "Yes") { out.hard = false; hit("R7 effort", "Last session was very hard and you are not recovered: no hard intervals."); }
  if (s.stress >= 8 || s.fatigue >= 8) { out.d += 1; hit("R8 readiness", "High stress or fatigue: one fewer set."); }
  out.sets = Math.max(2, Math.ceil(4 * out.f) - out.d);
  return out;
};
V6.today = id => {
  const p = V6.prof(id), T = V6.TR[id], n = T.logs.length, w = V6.wd(missionDay), q = V6.rules(id);
  const sess = w === 6 ? "rest" : (n % 2 === 0 ? "A" : "B");
  if (sess === "rest") return { sess, q, S: V6.session(p, [{ cardio: "cy", name: "Optional easy cycle", d: "20 min easy + stretching", seg: [[20, .5]] }]), p, n };
  if (q.stop) return { sess: "easy", q, S: V6.session(p, [{ cardio: "cy", name: "Easy cycle (no lifting today)", d: "30 min easy", seg: [[3, .5], [27, .55]] }]), p, n };
  const pl = V6.plan(p, n, { sets: q.sets, hard: q.hard });
  return { sess, q, S: pl[sess], pl, p, n };
};

/* =========================================================
   5. Fungal monitoring (station-wide)
   Method from the team's "Fungal monitoring" document; limits from the
   ISS Medical Operations Requirements (SSP 50260), as used in NASA's
   microbial monitoring papers: verify before the final pitch.
   ========================================================= */
V6.FLIM = { air: 100, surface: 100 };
V6.FUNIT = { air: "CFU/m³", surface: "CFU/100 cm²" };
V6.ORGS = ["Penicillium spp.", "Aspergillus spp.", "Cladosporium spp.", "Rhodotorula spp.", "Candida spp.", "None identified"];
V6.FSAMPLES = [];
(() => {
  const R = V6.rng(4242);
  for (let d = -165; d <= 15; d += 30) {
    V6.MODULES.forEach((m, i) => {
      const hyg = m.startsWith("Node 3"), trend = hyg ? (d + 200) / 200 : 1;
      const air = Math.round((hyg ? 34 : 12 + i * 3) * trend + R() * 14), surf = Math.round((hyg ? 48 : 10 + i * 4) * trend + R() * 16);
      V6.FSAMPLES.push({ day: d, module: m, type: "air", cfu: air, org: air > 30 ? V6.ORGS[(i + d) % 2 === 0 ? 0 : 1] : V6.ORGS[2 + (i % 3)], method: "Impaction sampler + growth plate", by: d < 1 ? "Previous crew" : "CM-4", note: "" });
      V6.FSAMPLES.push({ day: d, module: m, type: "surface", cfu: surf, org: surf > 40 ? "Aspergillus spp." : V6.ORGS[(i + 2) % 6], method: d >= 15 && hyg ? "Swab + MinION sequencing" : "Surface swab + culture", by: d < 1 ? "Previous crew" : "CM-4", note: hyg && d === 15 ? "Behind the hygiene-station panel" : "" });
    });
  }
})();
V6.latest = (m, type) => V6.FSAMPLES.filter(x => x.module === m && x.type === type && x.cfu !== null && x.day + 5 <= missionDay).sort((a, b) => b.day - a.day)[0];
V6.fungiStatus = () => {
  const over = [], watch = [], env = [];
  V6.MODULES.forEach(m => {
    ["air", "surface"].forEach(t => { const x = V6.latest(m, t); if (!x) return; if (x.cfu > V6.FLIM[t]) over.push({ m, t, x }); else if (x.cfu > V6.FLIM[t] * 0.7) watch.push({ m, t, x }); });
    const r = V6.envRisk(V6.ENV[m]); if (r.tier >= 2) env.push({ m, r });
  });
  const tier = over.length ? 3 : env.some(e => e.r.tier >= 3) ? 3 : (watch.length || env.length) ? 2 : 0;
  return { over, watch, env, tier };
};
V6.nextSampling = () => { let d = missionDay; while ((d - 15) % 30 !== 0) d++; return d; };

/* =========================================================
   6. Manual data entry: every questionnaire and test, by how often it is done
   ========================================================= */
V6.FREQ = [["daily", "Daily"], ["twice", "2–3× weekly"], ["weekly", "Weekly"], ["monthly", "Monthly"], ["event", "After events"]];
V6.FORMS = {
  morning: { freq: "daily", title: "Morning check-in", when: "On waking · about 1 min", metrics: ["sleepQ", "mood", "stress", "fatigue", "lonely", "pain"], symptoms: true },
  sleeprec: { freq: "daily", title: "Sleep and recovery", when: "On waking · 30 s (ASTRAL)", fields: [["rested", "How rested do you feel? (1 to 5)", "1-5"], ["awakenings", "Woke during the night", "0|1|2-3|4+"], ["alert", "Mentally alert? (1 to 5)", "1-5"], ["recovered", "Recovered from your last session?", "Yes|Partially|No"]] },
  eye: { freq: "daily", title: "Eye check (OCULUS)", when: "Morning · 30 s", fields: [["blur", "Blurred vision today?", "No|Slightly|Moderately|Severely"], ["focus", "Difficulty focusing?", "No|Occasionally|Frequently|Continuously"], ["distort", "Have straight lines looked distorted?", "No|Yes"], ["double", "Double vision?", "No|Yes"], ["flash", "New flashes or floaters?", "No|Yes"], ["irrit", "Eye discomfort or irritation?", "No|Mild|Moderate|Severe"], ["headvis", "Headaches together with visual changes?", "No|Yes"], ["changed", "Vision changed compared with your normal?", "No|Unsure|Yes"]], note: "Answers cannot rule out disease; any new or severe visual symptom goes to the Medical Officer." },
  meal: { freq: "daily", title: "After each main meal", when: "3× a day · 30 s (ASTRAL)", fields: [["eaten", "How much did you eat? (%)", "100|75|50|25|0"], ["hunger", "How hungry before eating? (1 to 5)", "1-5"], ["nausea", "Nausea or stomach discomfort", "No|Mild|Moderate|Severe"]], note: "What you ate is logged by scanning pouches on the Nutrition page." },
  hydration: { freq: "daily", title: "Hydration", when: "Morning, afternoon, evening · 15 s", metrics: ["water", "urine"], fields: [["thirst", "How thirsty do you feel? (1 to 5)", "1-5"], ["dizzy", "Headache or dizziness", "No|Mild|Moderate|Severe"]] },
  exercise: { freq: "daily", title: "After each exercise session", when: "Straight after training · 30 s", metrics: ["borg"], fields: [["completed", "Did you complete the planned exercise?", "Yes|Partially|No"], ["soreness", "Muscle soreness", "No|Mild|Moderate|Severe"], ["symptoms", "Unusual symptoms during exercise", "No|Yes"]] },
  evening: { freq: "daily", title: "Evening wellbeing and team", when: "Before bed · 30 s", fields: [["readiness", "Ready for tomorrow? (1 to 5)", "1-5"], ["coop", "How well did the crew work together today? (1 to 5)", "1-5"], ["conflict", "Any conflict today?", "None|Minor|Serious"], ["journal", "Private journal line (optional)", "text"]] },
  reaction: { freq: "twice", title: "Reaction self-test", when: "Monday, Wednesday, Friday · 5 min", metrics: ["rt"], note: "Objective test: catches fatigue you may not feel yourself." },
  body: { freq: "weekly", title: "Body measurements", when: "Saturday · 5 min", metrics: ["mass", "grip"], fields: [["bpSys", "Cuff blood pressure, systolic (mmHg)", "num"], ["bpDia", "Cuff blood pressure, diastolic (mmHg)", "num"]], note: "The cuff reading calibrates the smart shirt's estimate." },
  vision: { freq: "weekly", title: "Vision function (OCULUS)", when: "Saturday · 3 min", fields: [["accL", "Distance acuity, left eye", "20/16|20/20|20/25|20/32|20/40|20/50"], ["accR", "Distance acuity, right eye", "20/16|20/20|20/25|20/32|20/40|20/50"], ["near", "Near vision: can you read the small print card?", "Yes|With effort|No"], ["amsler", "Amsler grid: any wavy or missing areas?", "No|Yes"]] },
  moodq: { freq: "weekly", title: "Mood questionnaire and depression screen", when: "Saturday · 3 min", fields: [["interest", "Little interest or pleasure in doing things (last week)", "Not at all|Several days|More than half the days|Nearly every day"], ["down", "Feeling down or hopeless (last week)", "Not at all|Several days|More than half the days|Nearly every day"], ["sleepq", "Trouble sleeping (last week)", "Not at all|Several days|More than half the days|Nearly every day"], ["energy", "Feeling tired or low energy (last week)", "Not at all|Several days|More than half the days|Nearly every day"]], note: "Our own wording for the prototype; a flight version uses a licensed, validated screen." },
  mobility: { freq: "weekly", title: "Mobility check", when: "Saturday · 2 min", fields: [["reach", "Sit-and-reach compared with last week", "Better|Same|Worse"], ["stiff", "Stiffness on waking", "None|Mild|Moderate|Severe"]] },
  cognition: { freq: "monthly", title: "Cognition test battery", when: "Monthly · about 16 min", fields: [["score", "Battery score (% of your pre-flight baseline)", "num"], ["valid", "Test conditions OK (quiet, rested)?", "Yes|No"]] },
  sleepteam: { freq: "monthly", title: "Sleep and team questionnaire", when: "Monthly · 10 min", fields: [["sleepsat", "Overall sleep this month (1 to 5)", "1-5"], ["team", "Team cohesion this month (1 to 5)", "1-5"], ["support", "Feel supported by the crew and ground?", "Yes|Partly|No"]] },
  labs: { freq: "monthly", title: "Blood, urine and saliva samples", when: "Scheduled · 20 min", fields: [["blood", "Blood draw done", "Yes|No"], ["urine", "Urine sample done", "Yes|No"], ["saliva", "Saliva sample done (cortisol, viral reactivation)", "Yes|No"]], note: "Analysed in the lab; the Medical Officer imports the results." },
  eyeexam: { freq: "monthly", title: "Eye exam: OCT and ultrasound (OCULUS)", when: "Mission days 30, 60, 70, 90 · 30 min", fields: [["octL", "OCT retinal thickness, left eye (µm)", "num"], ["octR", "OCT retinal thickness, right eye (µm)", "num"], ["quality", "Scan quality", "Accepted|Rejected"]], note: "Pre-flight baseline 250 µm (illustrative). Interpreted by ground specialists." },
  fungi: { freq: "monthly", title: "Fungal sampling (air and surfaces)", when: "Monthly · 30 min", link: "fungi", note: "Entered on the Fungi page: samples are read after a 5-day incubation." },
  eva: { freq: "event", title: "After a spacewalk or big task", when: "Within 1 h · 1 min", fields: [["mental", "Mental demand (1 to 10)", "1-10"], ["physical", "Physical demand (1 to 10)", "1-10"], ["hot", "Too hot or cold in the suit?", "No|Hot|Cold"], ["hands", "Hand or fingertip pain?", "No|Mild|Moderate|Severe"]] },
  ill: { freq: "event", title: "When ill: twice a day", when: "Morning and evening · 1 min", symptoms: true, fields: [["worse", "Compared with this morning", "Better|Same|Worse"]] },
  landing: { freq: "event", title: "After landing: stand-up test", when: "Landing day and after · 8 min", metrics: ["ortho"], fields: [["dizzyst", "Dizzy on standing?", "No|Mild|Moderate|Severe"]] },
  firstweek: { freq: "event", title: "First week in space: daily symptoms", when: "Days 1–7 · 30 s", symptoms: true, fields: [["sms", "Space motion sickness", "None|Mild|Moderate|Severe"], ["face", "Puffy face or blocked nose", "No|Yes"]] }
};
V6.ANS = {};   // crew id -> form id -> [{day, at, a:{}}]
V6.formsOf = id => { const A = V6.ANS[id] || {}, o = {}; Object.keys(A).forEach(k => { const last = A[k][A[k].length - 1]; if (last && missionDay - last.day <= 1) o[k] = last.a; }); return o; };
V6.doneOn = (id, f, day) => ((V6.ANS[id] || {})[f] || []).some(x => x.day === day) || (f === "morning" && day === missionDay && S[id].checkin);
V6.lastDone = (id, f) => { const a = ((V6.ANS[id] || {})[f] || []); return a.length ? a[a.length - 1].day : null; };

/* =========================================================
   7. Timetable: what the astronaut does on a given mission day
   Weekly routine from the team's "Astronaut timetable"; extra
   questionnaires, tests and samples added by frequency.
   ========================================================= */
V6.tasks = (day, id) => {
  const w = V6.wd(day), s = S[id], train = w !== 6;
  let k = 0; for (let d = Math.min(day, missionDay); d < Math.max(day, missionDay); d++) if (V6.wd(d) !== 6) k++;
  const idx = V6.TR[id].logs.length + (day >= missionDay ? k : -k), sess = train ? (((idx % 2) + 2) % 2 === 0 ? "A" : "B") : null;
  const sessName = sess === "A" ? "Session A: legs and calves" : "Session B: upper body and back";
  const T = [];
  const add = (time, title, dur, kind, link, cat) => T.push({ time, title, dur, kind, link, cat: cat || "daily" });
  add("06:30", "Morning check-in: sleep, mood, stress, fatigue, symptoms", "1 min", "form", "morning");
  add("06:32", "Sleep and recovery questions", "30 s", "form", "sleeprec");
  add("06:35", "Eye check (OCULUS)", "30 s", "form", "eye");
  add("06:40", "Check shirt and wrist sensor are on; carry the dosimeter", "device", "note");
  if (train) add("06:45", "Pre-workout snack (carbs and protein)", "food", "note");
  add("07:00", "Breakfast, then meal questions", "30 s", "form", "meal");
  if (train) add("08:00", `Lifting: ${sessName}`, "about 80 min", "tab", "train", "training");
  if (train) add("09:30", "Protein within 60 min after lifting", "food", "note");
  add("10:00", "Hydration check (morning)", "15 s", "form", "hydration");
  if ([0, 2, 4].includes(w)) add("10:30", "Reaction self-test", "5 min", "form", "reaction", "twice");
  add("12:30", "Lunch, then meal questions", "30 s", "form", "meal");
  if (train) add("13:00", sess === "A" ? "Cardio: treadmill intervals" : "Cardio: steady run and cycle", "about 25 min", "tab", "train", "training");
  else add("13:00", "Rest day: optional 20 min easy cycle and stretching", "optional", "tab", "train", "training");
  if (train) add("14:00", "After-exercise questions", "30 s", "form", "exercise");
  add("15:30", "Hydration check (afternoon)", "15 s", "form", "hydration");
  if (w === 5) { add("16:00", "Weekly body measurements: mass, grip, cuff blood pressure", "5 min", "form", "body", "weekly"); add("16:10", "Weekly vision check: acuity, near vision, Amsler grid", "3 min", "form", "vision", "weekly"); add("16:15", "Weekly mood questionnaire", "3 min", "form", "moodq", "weekly"); add("16:20", "Weekly mobility check", "2 min", "form", "mobility", "weekly"); }
  const m = ((day % 30) + 30) % 30;
  if (m === 10) add("16:30", "Monthly cognition test battery", "16 min", "form", "cognition", "monthly");
  if (m === 15) add("11:00", "Monthly fungal sampling: air and surfaces in every module", "30 min", "tab", "fungi", "monthly");
  if (m === 20) { add("11:00", "Read fungal sample plates (5-day incubation)", "15 min", "tab", "fungi", "monthly"); add("16:30", "Monthly sleep and team questionnaire", "10 min", "form", "sleepteam", "monthly"); }
  if (m === 0) add("07:30", "Monthly blood, urine and saliva samples (before breakfast)", "20 min", "form", "labs", "monthly");
  if ([30, 60, 70, 90].includes(day)) add("15:00", "Eye exam: OCT, ultrasound and fundoscopy (OCULUS)", "30 min", "form", "eyeexam", "monthly");
  add("19:00", "Dinner, then meal questions", "30 s", "form", "meal");
  add("20:00", "Hydration check (evening)", "15 s", "form", "hydration");
  add("21:30", "Evening wellbeing and team questions", "30 s", "form", "evening");
  add("22:00", day % 2 === 0 ? "Dock the shirt recorder and swap batteries (every 48 h)" : "Dock the shirt recorder", "device", "note");
  add("22:30", "Tap 'going to bed': Sleep mode (7–9 h)", "2 s", "note");
  if (day === missionDay) {
    if (s.mode === "eva") add("17:00", "After the spacewalk: workload questions", "1 min", "form", "eva", "event");
    if (s.mode === "ill") { add("08:30", "Illness check (morning)", "1 min", "form", "ill", "event"); add("20:30", "Illness check (evening)", "1 min", "form", "ill", "event"); }
    if (s.mode === "postland") add("09:00", "Stand-up test", "8 min", "form", "landing", "event");
    if (s.mode === "adapt") add("07:15", "First-week symptom check", "30 s", "form", "firstweek", "event");
  }
  return T.sort((a, b) => a.time.localeCompare(b.time));
};
V6.taskDone = (t, day, id) => {
  if (t.kind === "form") return V6.doneOn(id, t.link, day);
  if (t.kind === "tab" && t.link === "train") return V6.TR[id].logs.some(l => l.day === day);
  if (t.kind === "tab" && t.link === "fungi") return V6.FSAMPLES.some(x => x.day === day && x.by === id);
  return null;
};
