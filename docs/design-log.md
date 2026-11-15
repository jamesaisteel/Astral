# Crew Health Monitor: design log

The project's memory. It records everything decided and built so far, so nothing is lost when a chat gets long, and so we can write the instruction guide for the judges at the end. Keep updating it after every step.

Last updated: 15 Nov 2026 (v0.6 published: sensor-based test bench, medical libraries, skin check, workout planner, fungi, timetable, manual data entry).

## 0. Links

- Live demo: the GitHub Pages site of this repository (see README).
- Research 1, suit and habitat hardware: docs/research/Astronaut Health Monitoring Hardware What Exists Today.pdf
- Research 2, technology, inputs and constraints: docs/research/Astronaut Health Tracker Technology, Inputs and Constraints Research.pdf
- Research 3, market research and positioning: docs/research/Astronaut Health Tracker Market Research and Positioning.pdf
- Team source documents (sensors, libraries, eye, fungi, timetable, intake survey, MUNAI, training apps): docs/team-sources/

## 1. The challenge

NASA Space Apps: "Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, and a hostile closed environment, which can bring immune changes, bone loss, cardiovascular events, and behavioral health problems. On long missions, astronauts carry much of the responsibility for spotting these changes in themselves. Your challenge is to build a health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health."

Team requirements:
- A tracker using both sensor inputs and regular manual inputs (mood, how they feel, strength and so on).
- Compatible with the technology and software astronauts actually use.
- Only inputs with a reliable source.
- The team asked for a critical look at what they had missed.

## 2. Timeline of the work

1. Research 1: what is in the suits and around the crew.
2. Research 2: deep research on technology, software, inputs and constraints, plus what the team missed.
3. Sensor or manual decision for every value. Added to Research 2.
4. Market research, competitor gaps and selling point (Research 3).
5. Cross-check against the team's full NASA measurement list (about 25 values added to Research 2).
6. The team's feature brief expanded into a full feature spec, typed in chat (section 6 below).
7. Astronaut routine list and prototype v0.1, with a test bench.
8. v0.2: digital twin, and the split into two tabs (test bench and product).
9. v0.3: real AI health assistant plus a professional visual redesign.
10. v0.4: flight-phase modes, user-friendly or scientific output, realistic 3D twin with filters and clickable parts, cross-crew analysis, nutrition tracking, then two underwear fixes requested by the team.
11. Mentor feedback leads to the AI reliability protocol (section 12). Plan agreed, design log created, v0.5 built and published.
12. v0.5.1: the team asked that the chat no longer show the AI's reasoning about why it forwards a question (section 12).
13. v0.6 (15 Nov, in Claude Code): eight team requests built in one evening (section 14).

## 3. Key research findings (Research 1)

- "The suit" is three things: the spacewalk suit (ISS EMU; Axiom's AxEMU for Artemis), the launch and entry suit (Orion OCSS), and everyday wearables in the habitat. On long missions the wearables matter most.
- Pressure suits record little about the body. The EMU sends ECG and heart rate plus suit pressure, O2 and CO2 to Mission Control, where flight surgeons interpret them. The astronaut gets no health interpretation.
- Richer data comes from:
  - the CSA Bio-Monitor / Astroskin smart shirt: 3-lead ECG, heart rate, breathing rate and volume, SpO2, a blood-pressure estimate, skin temperature, activity, about 48 h per charge
  - the Actiwatch: sleep and light
  - the T-Mini headband: core temperature
  - the Personal CO2 Monitor
  - the Crew Active Dosimeter
  - the CHeCS medical kit: BP/ECG, defibrillator, ultrasound
  - the Cognition battery (about 16 min) and the 5-minute Reaction Self-Test
- Bone loss and immune changes have no direct sensor, so they are tracked indirectly and labelled as such.
- A NASA cardiology panel found that suit rhythm data can flag a problem but cannot diagnose; a 5-lead ECG in the vehicle is needed. Design rule: suit data triggers a warning and a procedure, never a diagnosis.
- Interpretation currently happens on the ground. On deep-space missions with delays, the app has to do what the flight surgeon does today.
- Demo data options: the NASA Open Science Data Repository (Inspiration4 data and others), published values, and simulated Hexoskin/Astroskin-style data.

## 4. Inputs: sensor or manual (Research 2)

- 30 core values: 12 from sensors, 9 entered by the astronaut, 9 needing both to be reliable.
- About 25 more added after cross-checking NASA's list. Most are lab, exam or vehicle data, so they are imported as dated results, not tracked live:
  - blood and immune panel, cortisol, urine, bone markers, microbiome
  - eye exams, alongside a weekly vision self-test
  - grip strength, mobility, coordination, motion sickness score
  - sleep efficiency, light exposure, circadian rhythm
  - blood glucose (optional), hydration estimate
  - cabin O2 and pressure, air contaminants, water quality, noise, airflow
- Standing balance tests need gravity, so they only count after landing.
- Hobby sensors on the team's list:
  - MAX30102 is not clinical grade, so label its readings "prototype".
  - MPU6050 cannot find orientation in microgravity; it can still count activity.
  - A Geiger counter does not measure body dose.

## 5. Market research and positioning (Research 3)

- Space tools fall into three groups:
  - research data collectors: TrialX EXPAND, ISS FIT, ESA EveryWear
  - clinician or mission-control platforms: TRISH HERMES (closest competitor), NASA MDA, Ejenta
  - a reactive AI diagnosis assistant: NASA/Google CMO-DA
- Earth analogues to borrow from:
  - WHOOP and Oura: a daily status with reasons, and behaviour tagging
  - Smartabase and Kitman: daily wellness check-in, z-scores against personal baselines, body maps, tiered sharing
  - Equivital and the US DoD: short-horizon prediction, team monitoring, readiness split into domains
- Gaps nobody fills:
  - astronaut as the primary user
  - closing the loop from data to action for the crew
  - sensors and self-report fused in one daily flow
  - crew-controlled privacy
  - mission-phase awareness
  - tools that talk to each other
- Value proposition (draft): an offline, crew-owned health companion that combines what wearables measure with what only the astronaut can report. Each day it says how they are, why, and what to do. It is private by default and mission-aware.
- Four pillars:
  1. crew-first and private by default
  2. sensors plus self-report in a 2-minute flow
  3. every insight ends in an action
  4. mission-aware, offline and interoperable (FHIR-style export)
- We deliberately won't claim:
  - to be a diagnostic device
  - fake measurements: bone and strength are shown only as indirect trends
  - a single magic score
- Pitch line: "NASA already has tools that watch astronauts. We built the one astronauts would actually want to use, because it works for them first."
- Working names to vote on: Vitals Log, Crew Compass, Baseline, Pulse Check.

## 6. Feature spec (team brief, expanded)

The team's original brief:
- An AI that analyses and interprets possible risks and consequences and gives suggestions.
- A HUD with switchable views: vitals (heart rate, blood pressure, temperature, breathing) and gases (pulse oximetry, CO2), among others.
- Two versions: a computer inside the station or ship, and a helmet HUD.
- Suit modes: sleep, spacewalk, exercise, stressful work and general.

Changes we made to the brief:
- SpO2 belongs under Vitals; Gases covers the air: CO2, O2 and pressure.
- "Suit modes" became "activity modes", because the pressure suit is only worn for spacewalks, launch and landing.
- The helmet display shows a health layer only. The suit's own caution and warning system stays in charge.
- Nothing can be worn on the head inside the suit, so the HUD is built into the helmet or visor.

Spec contents:
- Data intake:
  - sensor adapters
  - a daily check-in under 2 minutes: sleep, mood, stress and fatigue sliders, symptoms with a body map, a Borg effort tap
  - weekly items, 10–15 minutes
  - lab and exam imports
  - context tags
  - every value labelled S, M, D or T
- AI engine, four layers:
  1. safety rules (no AI)
  2. personal baselines by mission phase
  3. trends and risk forecasts
  4. advice with what changed, why it matters, confidence and one action
  The engine logs everything for audit.
- Station app views: Today, Vitals, Air, Sleep and rhythm, Body, Mind, Radiation, Symptoms and medication, Vision, Labs, Trends, Crew and Medical Officer. Large touch targets, dark mode, voice entry, readable in under 10 seconds.
- Helmet HUD:
  - always visible: heart rate, workload bar, suit CO2, O2 and time left, dose rate, one status light
  - on demand: detail pages
  - alerts: one line, colour plus tone, never in the centre of view
  - controls: voice or a glove button
  - hands a summary to the station app after the spacewalk
- Activity modes: General, Sleep, Exercise, Spacewalk, High workload, Adaptation, Illness, Off-duty, Emergency. Comms blackout is an extra layer on top of any mode.
- Alerts:
  - four tiers
  - fire only on a persistent trend or a safety rule
  - never repeat without new information
  - each names one action from a fixed library
  - the astronaut can mark an alert as wrong
- Privacy:
  - private by default, sharing per domain
  - safety thresholds always reach the Medical Officer
  - the Medical Officer sees shared data
  - the Commander sees readiness only
- Ground link: store-and-forward, a weekly report for flight surgeons, FHIR export, anonymous research export with consent.
- Competition priorities:
  - must: check-in, simulated feeds, baselines, the core views and modes, tiered alerts, privacy
  - should: HUD mock-up, AI explanations, Medical Officer view, extra modes, blackout
  - could: voice, on-device Q&A, lab import, commander view, reports

## 7. Astronaut routine (keeps the data flowing)

About 2 minutes a day plus 10–15 minutes a week.

- Every morning, about 1 min:
  - rate sleep
  - mood, stress, fatigue and loneliness sliders
  - symptoms and the pain body map
  - log medication
  - check the shirt and wrist sensor are on, carry the dosimeter
- During the day:
  - scan food and drink pouches
  - Borg tap after each workout
  - tag context (caffeine, spacewalk, stressful experiment)
  - log symptoms as they appear
- Every evening, about 30 s:
  - two team items: cooperation and conflict
  - optional journal line
  - tap "going to bed"
  - dock the shirt recorder; swap batteries every 48 h
- 2–3 times a week: the 5-minute reaction test.
- Weekly: blood pressure with the cuff (calibrates the shirt), body mass and grip strength, vision self-test, mood questionnaire and depression screen, mobility test.
- Monthly or by schedule: the full cognition battery (about 16 min), sleep and team questionnaire, and blood, urine, saliva and eye checks imported by the Medical Officer.
- When events happen:
  - workload rating after a spacewalk or big task
  - daily symptoms in the first week and after landing
  - twice a day when ill
  - follow alert instructions (ECG, shelter, private conference)

Questions use our own wording; a flight version would use licensed, validated questionnaires. The questionnaire from another AI that the team mentioned was never received; merge it if it is resent.

## 8. Prototype structure (current, v0.5)

- Two workspaces:
  - Crew app: the product.
  - Test bench: strictly for simulating what we lack. It has sliders, scenarios, sensor unplugging, mission day, comms blackout, activity or flight phase, the food log, and the AI routing test.
- Four placeholder crew members:

  | Crew | Role | Sex, mass | Age |
  |---|---|---|---|
  | CM-1 | Commander | male, 82 kg | 46 |
  | CM-2 | Flight engineer, backup Medical Officer | female, 61 kg | 39 |
  | CM-3 | Crew Medical Officer | male, 77 kg | 42 |
  | CM-4 | Mission specialist | female, 58 kg | 35 |

  Each has a personal baseline for heart rate, HRV, blood pressure, SpO2, breathing, temperature, reaction time and grip.
- Roles:
  - Astronaut
  - Medical Officer: crew overview, cross-crew analysis, medical queue, AI policy
  - Commander: readiness with a pending-decision flag, cross-crew conclusions without medical evidence, AI policy
- Navigation:
  - Overview: Digital twin, Today, Health assistant
  - Body systems: Vitals, Air and gases, Sleep, Body, Mind, Radiation, Nutrition
  - Tools: Helmet HUD, Check-in, Daily routine, Privacy
- Today page: readiness ring (100 minus tier weights 2/8/20/45: Ready ≥ 80, Caution 60–79, Limited 40–59, Not ready < 40), a summary sentence, KPIs, status tiles for 9 domains, the "What to do" alerts, an assistant teaser.
- Metric cards: value, change from baseline, a 14-day sparkline with the normal band (or the phase-expected band), source tag.
- Output toggle in the top bar:
  - Friendly: plain labels, "Normal for you".
  - Scientific: technical labels, z-scores, reference ranges, 14-day mean ± SD, rule codes and persistence in alerts.
  - The AI assistant writes for the astronaut or for a flight surgeon to match.
- Helmet HUD preview: SVG visor with arc gauges (heart rate against maximum, O2 time left), workload bar, CO2 and dose, one-line alert ticker.
- Check-in page with sliders and symptom and medication chips. Routine page. Privacy switches per domain.
- Disclaimer on screen: thresholds are illustrative, not clinical or NASA limits, and nothing is medical advice.

## 9. Rule engine (deterministic)

- Tiers: OK, Note, Watch, Act now, Emergency. Safety rules (marked) always reach the Medical Officer.
- Domains: heart and circulation, breathing and air, temperature and immune, sleep, body (muscle, bone, fluids), mind and stress, radiation, nutrition and intake, spacewalk.
- Trend rules need the pattern to persist ("pattern has lasted" days). Missing sensors show "No data"; the app never guesses.
- Mode filtering:
  - sleep: only safety alerts break through
  - emergency: only Act now and above
  - off-duty and high workload: hide notes
  - launch, docking and re-entry: hold non-urgent items
- Comms blackout: ground steps are queued for the next contact.
- 22 individual scenarios:
  - Healthy baseline, Sleep debt, High cabin CO2, Solar particle event
  - Spacewalk overexertion, Respiratory infection, Isolation and low mood, Dehydration
  - Muscle and bone loss, First week in space, Chest pain, Tired but feels fine (the reaction test catches fatigue the astronaut doesn't report)
  - Nominal launch, Launch: abnormal response, Docking operation, Ballistic re-entry, Post-landing: dizzy on standing
  - Under-eating, High-sodium diet, Missed vitamin D and calcium, Too much caffeine
- 6 whole-crew scenarios: Crew: infection spreading, food-borne illness, cabin CO2 rising, dosimeter fault, solar storm, team stress.

## 10. Feature details by version

### v0.1
Test bench and product on one page; 12 scenarios; 9 modes; crew, mode, role and blackout selectors; Today, Vitals, Air, Sleep, Body, Mind, Radiation, HUD and Routine tabs; sensor unplugging; privacy chips.

### v0.2
- Digital twin: a body that mirrors the astronaut's state live, with organs coloured by status, a beating heart, breathing lungs and live callouts.
- Product and test bench split into two distinct tabs, as the team asked: test bench strictly for simulated values, product for all views, analysis and the twin.

### v0.3
- Team asked whether the AI recommender was included. Honest answer: v0.2 only had the rule engine.
- Added the Health assistant:
  - "Generate briefing": summary, risks with likelihood, consequence and time horizon, prioritised recommendations with who acts, what to watch next, data confidence.
  - Chat with suggested questions and voice dictation.
  - Uses Claude when available (artifact `sample` capability); an offline deterministic on-board model takes over otherwise.
  - Guardrails: advisory only, never diagnoses, safety rules outrank it, respects comms blackout.
- Professional redesign: dark design system (IBM Plex fonts), sidebar navigation with status badges, readiness ring, polished cards, alerts, HUD and tables.

### v0.4 (team request of 14 Nov)
- Flight-phase modes: Launch and ascent, Docking / critical operations, Re-entry and landing, Post-landing recovery.
  - Vitals are judged against what is normal for the phase (heart rate, blood pressure, breathing, G-load, SpO2), so the app does not keep alarming about high G during a nominal launch.
  - It alerts on deviations from the expected phase response: G-load above the planned profile (e.g. a ballistic re-entry above 8 g), heart rate far above or unusually below the range, blood pressure too low under load, fast breathing.
  - Non-urgent items are held until the phase ends.
  - Post-landing adds the stand-up test: a heart-rate rise above 30 bpm means orthostatic intolerance.
  - New G-load sensor (vehicle accelerometer).
- Friendly / Scientific output toggle (section 8).
- Realistic 3D digital twin:
  - Open medical anatomy model open-anatomy-3d, adapted from BodyParts3D, HuBMAP and MakeHuman, CC BY 4.0; credit shown in the app. Male and female bodies matched to each crew member, about 150 parts.
  - Underwear: the team asked twice. Male: plain lofted boxer shorts with the genital geometry removed, so nothing shows from any angle. Female: sports top and shorts. Intimate areas stay covered even when the skin is see-through.
  - Filters: Skin, Muscular, Skeletal, Respiratory, Cardiovascular, Nervous and senses, Digestive, Urinary, Endocrine and immune, Reproductive. Presets: Body, Organs, Muscles and bones, Everything.
  - Scroll or drag to turn; Ctrl + scroll or pinch to zoom; front, side and back buttons; auto-rotate.
  - Click any part (compatible with every filter) to see its values with status words, or z-scores in scientific mode; its findings; and model estimates where no sensor exists (muscle volume and bone density change since launch, kidney-stone risk), labelled as estimates.
  - Parts needing attention glow; the heart beats and the lungs breathe with live values.
  - The side panel shows ECG and breathing traces and "Parts to look at".
- Nutrition tracking: everything ingested is logged with time and batch number, including drinks, supplements and medication.
  - About 22 ISS-style catalog items.
  - Personal targets: energy from WHO BMR × 1.7, protein, sodium 1500–2300 mg, calcium, vitamin D (no sunlight in orbit), iron, fibre, potassium, fluid at least 2.5 L, caffeine at most 400 mg.
  - Findings: energy deficit, low protein, high sodium (linked to bone loss and eye changes), missed vitamin D, low calcium, too much caffeine (linked to sleep), iron above target, low fibre, kidney-stone risk, stomach illness.
  - Nutrition page with intake bars against targets, the food log, "Scan pouch" and the medication list.
  - Test bench food panel.
- Cross-crew analysis, a new tab for the Medical Officer and Commander. It compares everyone to find shared causes:
  - a respiratory infection spreading, identifying the first case
  - food-borne illness traced to a batch eaten only by the sick crew
  - cabin-wide CO2 versus a local pocket or monitor fault
  - a real solar particle event versus a single faulty dosimeter
  - crew-wide sleep problems, team stress, under-drinking, exercise falling
  It also shows a crew comparison table. The Medical Officer sees the evidence; the Commander sees only who is affected, the conclusion and the action.

### v0.5 (AI reliability protocol, see section 12)

### v0.5.1
- The level 3 chat message no longer shows the AI's reasoning about why it is forwarding the question. It now reads: "This isn't something I can judge reliably, so the Medical Officer will decide." It then says the summary was sent and gives the safe steps while waiting. The reasons stay visible to the Medical Officer in the queue.

## 11. Technical notes

- Single-page HTML app published as a Claude artifact. Files: index.html, three-bundle.js (three.js 0.187 bundled with esbuild), and models/anatomy-male.js and anatomy-female.js. The models are GLB files encoded as base64 JS, because the artifact host does not serve .glb or .bin.
- Source parts in /home/claude/astro-health:
  - head5.html: CSS and shell
  - core4.js: configuration, state, scenarios, engine, nutrition, phases, cross-crew analysis
  - extra4.js: output style, body-part definitions, 3D twin page, nutrition page, analysis page
  - reliab5.js: reliability protocol (policy, router, queue, policy page, routing test)
  - ui5.js: UI layer
  - plus /home/claude/anat/twin3d.js and catalog.js
- Build: `cat head5.html core4.js ../anat/catalog.js ../anat/twin3d.js extra4.js reliab5.js ui5.js > v05/index.html`. Earlier versions are kept as v01.html, v02.html and the v04 folder.
- Artifact capabilities declared: `sample` (Claude calls) and `dictation`.
- Every version is tested with headless Chrome (Playwright, using SwiftShader for WebGL): every scenario, tab and role is clicked through and screenshots are checked; zero errors in v0.4 and v0.5.
- Not tested yet: live Claude answers, and 3D performance on real graphics cards.

## 12. AI reliability protocol (decided 14 Nov, built in v0.5)

Mentor feedback: the AI does everything right now. It should only act where it can make reliable judgements, because some things require a professional human doctor, and these need to be separated.

How the decision developed:
- First idea: questions the AI can't answer well get forwarded to a doctor.
- My first proposal applied the separation to every AI output, not just chat.
- Team clarification 1: the AI should make the doctor's life easier, not hand all the work back.
- I overshot by proposing that the AI does all the work, including drafting diagnoses.
- Team clarification 2: no; the AI shouldn't do all the work either. It just shouldn't hand everything back.
- Final principle: the AI fully handles what it can judge reliably, suggests in the middle ground, and for the rest passes on a tidy summary and steps back.

Four levels:
1. AI handles alone: explaining data and trends, routine and lifestyle advice (sleep, hydration, food swaps, pacing), reminders and follow-up checks, steps already written in medical checklists. The Medical Officer is not bothered; these show up only in a daily log.
2. AI suggests, Medical Officer confirms: e.g. medicine from the on-board kit within protocol, lighter or no exercise, schedule changes, spacewalk go/no-go. Approve, edit or reject with one tap.
3. Human decision: the AI does not make the call. It writes no diagnosis or treatment plan, because people tend to go along with a machine's draft even when it's wrong (automation bias). It tells the astronaut only that it can't judge this reliably (team decision 14 Nov: no reasoning shown in the chat), gathers the relevant readings, symptoms and timeline into a short summary, and says what is safe to do while waiting. The Medical Officer decides and can send the case to the ground flight surgeon.
4. Emergency: the fixed safety rules run it; the AI only reads out the checklist.

Rules:
- A fixed rulebook, which a doctor can audit, sets the level (topic to level, plus conditions that raise it). The AI's own confidence does not, because language models are poorly calibrated about when they are wrong. The AI may raise a level, never lower it.
- Raise conditions: incomplete data, sources that disagree, related Act-now or Emergency findings, unusual symptom combinations, dynamic flight phases, crew-wide patterns.
- Unknown topics default to level 2.

Team decisions:
1. Routing: the on-board Medical Officer gets everything first and decides whether to send it to the ground.
2. Whether an astronaut can decline a recommendation depends on NASA policy, not on us. So the rulebook is a configurable "medical policy profile"; we ship "ISS (current)", with the ground flight surgeon as medical authority.
3. Design for the ISS for now (short comms delay).
4. The astronaut's chat shows no reasoning about why something was forwarded; only the Medical Officer sees the reasons.

ISS facts: the Crew Medical Officer is a crew member with extra medical training, usually not a physician, who treats crew with the on-board kit following the advice of ground flight surgeons. The crew surgeon on the ground holds primary responsibility for crew health. Sources: JAXA medical operations page, the ISS Crew Code of Conduct (14 CFR 1214.403), NASA NTRS papers on Medical Officer training.

Our defaults:
- When CM-3 (Medical Officer) is the patient, CM-2 acts as backup Medical Officer; the ISS normally has two.
- Ground replies are simulated in the demo; during a blackout, cases are queued.

What v0.5 contains:
- Policy profile "ISS (current)" and a rulebook of 20 topics:
  - level 4: emergency symptoms; risk to life (mental health)
  - level 3: diagnosis; prescription medicine and dosing; vision and eye changes; new or severe symptoms; mental health concerns
  - level 2: medicine from the on-board kit; fitness for duty or spacewalk; exercise restriction or injury; schedule or workload change; minor illness
  - level 1: explaining my data; sleep habits; hydration; food and nutrition; exercise routine; stress and wellbeing; checklists and how-to; cabin environment
  - anything not in the table defaults to level 2
- Raise conditions in the router:
  - a related safety rule is active → level 4
  - a related finding is at Act now → one level up
  - less than 60% of expected data → one level up
  - sources disagree (feels rested, reaction test slow) → level 3 for fitness questions
  - three or more symptoms at once → level 3
  - launch, docking or re-entry → at least level 2
  - part of a crew-wide pattern → level 3 for illness and medicine questions
  - very low mood → level 3 for wellbeing questions
  - an optional Claude self-check can flag "needs a human" → level 3 (it can only raise)
- Chat behaviour by level:
  - level 1: normal answer, logged in the AI's daily log
  - level 2: an AI suggestion, marked as a suggestion, goes to the Medical Officer queue for confirmation
  - level 3: no AI decision; a plain "This isn't something I can judge reliably, so the Medical Officer will decide", plus a summary sent to the Medical Officer (who, relevant readings with baselines, symptoms and medication, findings, timeline, crew patterns) and safe interim steps
  - level 4: the emergency checklist, with the Medical Officer alerted
  - every answer shows its level badge and live case status (awaiting confirmation, approved, with the flight surgeon, and so on)
- Astronaut Health assistant page: a "My requests to the Medical Officer" panel, the four level cards, and a protocol note.
- Level badges on every rule-engine alert ("who decides") and on every briefing recommendation.
- Medical Officer role, new "Medical queue" tab with a count badge:
  - KPIs: handled by the AI alone, needed a one-tap confirmation, human decisions, sent to the ground
  - level 2 cards: question, editable AI suggestion, reasons; buttons Approve, Approve with my edits, Reject, Send to ground
  - level 3 and 4 cards: reasons, the summary, a note that the AI deliberately proposed no diagnosis, a decision field; buttons Handled on board, Send to flight surgeon
  - ground cases: status, queued during comms blackout, simulated flight surgeon reply after 45 s or with the "Simulate reply" button
  - the AI's daily log, and cases closed today
- "AI policy" tab (Medical Officer and Commander): the profile, authority and owner, the four levels, the topic table, the raise conditions, and the note on declining recommendations.
- Commander view: a "Pending medical decision" column, with no details.
- Test bench "AI routing test": 40 sample questions with expected levels. Result: 40/40 exact, 0 under-escalated, 0 over-escalated (policy rules alone; live raise conditions can only add caution).
- Offline fallback suggestions for level 2 are topic-specific: kit medicine with an allergy and medicine check plus context, spacewalk go/no-go from readiness, an exercise restriction plan, schedule-change evidence, illness-mode steps.
- Tested in headless Chrome: chat at all four levels, approve with edits, send to ground, simulated reply, policy page, Commander view, briefing, routing test, and the "Tired but feels fine" spacewalk question being raised to level 3. Zero errors.

Pitch angle: "the AI takes the routine load off the Medical Officer; humans keep authority for anything it can't judge reliably". Report how many items the AI closed, how many needed one tap, and how many reached the ground; the queue KPIs show exactly this.

## 13. Open items

- Real thresholds need proper sources before the final pitch (current ones are demo values).
- The questionnaire from another AI was never received.
- Pick a product name.
- Mission scope beyond the ISS (Moon or Mars) later; the protocol already supports comms delay and blackout.
- At the end, write the judges' instruction guide from this log.
- Hosting: the team will submit a hosted website. Live Claude answers only work inside the claude.ai artifact; on a normal website the assistant uses the offline on-board model. Decision 15 Nov: offline only for now; revisit after testing (option: a small server holding an API key). Offline check passed: briefing, all four levels and citations work without Claude. Fix: when a question matches a library topic but no specific offline answer, the library answer now comes first, followed by the person's top finding.
- Decide on the three sensor gaps (section 14): G-load, suit telemetry, urine colour.
- Verify the ISS fungal limits (SSP 50260) before the pitch.
- Do not claim MUNAI was trained on a large dataset: it prompts a general AI (Gemini) or uses a colour heuristic.

## 14. v0.6 (15 Nov 2026)

Team brief, with the decisions taken through button questions before building:

1. **Astronaut / Scientist.** The output toggle is renamed from Friendly/Scientific to Astronaut/Scientist. Roles (Astronaut, Medical Officer, Commander) are unchanged.
2. **Sensor-based test bench** (source: team document "Sensors"). The bench is grouped by device, and each slider is what that device reports: Astroskin smart shirt (ECG heart rate and HRV, pulse-transit-time blood pressure, oximeter SpO2, RIP-band breathing), Dräger/KORA core-temperature headband, Actiwatch-Plus, Mirion Crew Active Dosimeter, Personal CO2 Monitor, cabin O2 and pressure sensors, ARED/T2/CEVIS logs, vehicle accelerometer, EMU suit telemetry. Each device card has its maker, location, technology, NASA use and an on/off switch. Manual inputs are grouped as questionnaires, daily logs and medical instruments. A "Sensor coverage check" panel lists the gaps:
   - no sensor in the document: G-load (vehicle telemetry), suit telemetry (documented in Research 1), urine colour (the document lists lab urine analysis; the chart is our proxy)
   - in the document but not simulated: dry-EEG sleep stages, Empatica E4 stress, DXA, lab blood markers, eye instruments (OCT, ultrasound, Tono-Pen)
   A new "Station environment" panel simulates fungal-risk sensors per module (humidity, temperature, surface moisture, airflow, particles), with a "Condensation behind a panel" scenario.
3. **Doctor's brain and libraries** (sources: Brain 1, Brain 2, Eye). New "Medical libraries" page: architecture (one central assistant; general medicine, specialities, space medicine and the OCULUS eye library; astronaut profile; monitoring; human review), 11 libraries with access status from Brain 2 (MSD Manual marked restricted and replaced by StatPearls and MedlinePlus), 19 curated excerpts with sources and evidence type, a search box, and safeguards. The assistant retrieves matching excerpts (prototype RAG) and shows "Sources used" under level 1–2 answers; level 3–4 answers show no sources, keeping the rule that the chat shows no reasoning when forwarding. Excerpts are also passed to Claude in the prompt with an instruction to cite them. Eyes: library only (team choice), plus the daily OCULUS eye questionnaire and weekly vision check in Manual data entry, OCT exams on days 30/60/70/90, and new eye findings in the rule engine (new double vision = Emergency safety rule; flashes or floaters and headache with visual changes = Act now; vision change and irritation = Watch; OCT thickness rising 15 µm or more = Watch). "Eyes and vision" was added as a body-system domain so these show on Today.
4. **Skin check** (source: MUNAI). MUNAI turned out to be a working page that sends photos to Google Gemini (empty API key) or falls back to a local colour analysis; it has no trained model. We ported its 12 conditions with NASA incidence and citations, its colour-pattern analysis and its vitals fusion, fed by the astronaut's live sensors. Fix: redness is now measured against the surrounding skin (MUNAI's absolute threshold counted normal skin as red). Five demo pictures are drawn on the device. Result wording follows the team decision: if uncertain (top result under 60% or less than 20 points ahead), urgent (cellulitis, shingles) or contagious, it says so, sends a level 3 case with the screening to the Medical Officer and gives self-care steps; otherwise it gives the result and advice with an "Ask the Medical Officer to confirm" button. Prescription advice from MUNAI is not shown to the astronaut.
5. **Workout planner** (source: astronaut-app, scientist-app, Astronaut timetable). Rebuilt inside the app with the shared calculation core (loads, reps in reserve, work, energy, bone dose, heart-rate zones, treadmill speed, cycle power, bone and muscle forecast, nutrition targets). Per-crew profiles. Today's session follows the A/B split (Sunday rest). The ASTRAL rules R1–R8 adapt the session from our own data (symptoms, sleep, recovery answers, soreness, food, fluid, effort, stress) and can only make it easier. Each lift is logged as done or failed with a reason; failures give advice and reduce the next load 5% (2.5% for unclear causes). Finishing a session feeds exercise minutes and the strength trend into the rule engine and twin. Progress charts and history. The Scientist view adds the calculation table with formulas, bone forecast against NASA-STD-3001, muscle forecast, energy targets, failure analysis and constants with provenance. Demo history: about 12 sessions per crew member.
6. **Fungi** (source: Fungal monitoring). New "Station" nav group with a Fungi page, shared by the whole crew: status KPIs, continuous risk sensors per module, a chart of air or surface counts over time with the limit line, a results table (5-day incubation shown as "Incubating"), an entry form, and how NASA monitors (impaction air sampler, surface swabs, MinION). The station record of six monthly rounds from the previous crew is pre-filled (simulated). Node 3's hygiene area trends up. Limits: air 100 CFU/m³, surfaces 100 CFU/100 cm² (SSP 50260, to verify). A sample above the limit raises an Act-now finding for every crew member (air domain) and a cross-crew finding for the Medical Officer and Commander; risky conditions raise a Watch finding.
7. **Timetable** (source: Astronaut timetable). Today shows the day's timetable with status and Open buttons that jump to the right questionnaire. The Daily routine page became "Schedule": browse any mission day, see a week grid. The plan comes from the weekly routine (lifting 08:00, cardio 13:00, food timing, 22:30 sleep), plus extra items by frequency: reaction test Mon/Wed/Fri; weekly items on Saturday; monthly cognition (day 10), fungal sampling (day 15), plate reading and team questionnaire (day 20), samples (day 30); eye exams on days 30, 60, 70, 90; battery swap every 48 h; event items by activity mode. Mission day 1 = Monday.
8. **Manual data entry.** Replaces Check-in. Sub-tabs: Daily (morning check-in, sleep and recovery, OCULUS eye check, meals, hydration, after exercise, evening wellbeing and team), 2–3× weekly (reaction test), Weekly (body measurements and cuff BP, vision, mood screen, mobility), Monthly (cognition, sleep and team, lab samples, OCT eye exam, fungal sampling linked to Fungi), After events (spacewalk workload, illness twice a day, landing stand-up test, first week in space). Counts show what is due today; the sidebar shows the total due.

Also: the Health assistant's prompt now includes recent questionnaire answers, today's workout adjustments and the station fungi status; the offline model answers workout questions.

Technical: v0.6 lives in `app/src/` (v06-core.js: data and engines; v06-ui.js: pages and hooks; v06.css). `app/build.py` builds `app/index.html` from the untouched v0.5.1 file in `backups/` and renames the toggle. The new code wraps existing functions (render, evaluate, crewAnalysis, buildBench, renderToday, snapshot, sendChat, chatHTML, localAnswer) instead of editing them. Tested in the browser: every page and role renders with zero errors; skin demos, logging a workout, saving forms, eye alerts, a fungal sample above the limit and chat citations all checked. Not tested: live Claude answers, 3D on a real graphics card, a real phone camera photo.

Published as a new artifact because the publishing tool requires reading the whole old version before overwriting it; the old link stays on v0.5.1.

### v0.6.1: Entry survey (15 Nov 2026)

Source: team document "Astronaut Training: Intake Survey (draft)". A new first sub-tab "Entry survey" in Manual data entry, filled in once before the mission, so the app and the AI doctor know the astronaut from the start. Sections 1–9 of the document: medical screening (12 Yes/No questions plus clinician sign-off), identity and body, strength tests, aerobic and cardiovascular, equipment and schedule, mission dates, about you, targets, notes. Every field shows whether it is used or only stored. Section 10 (ASTRAL daily questions) was already in the Daily tab. Each crew member has a completed demo survey; CM-2 lists a shellfish allergy (links to the food-borne illness scenario), CM-3 pre-flight back stiffness.

What it feeds:
- **AI doctor:** the survey profile goes into every Claude prompt and into the Medical Officer's case summaries; offline suggestions about kit medicine mention allergies and regular medicines, and fitness and restriction suggestions mention pre-flight pain; the assistant answers allergy and sleep-target questions from it (note: "Do I have…" questions route to level 3 by the protocol's diagnosis rule). The Health assistant page shows "What the assistant knows about you".
- **Workout planner:** screening gate (training locked until every answer is No and a clinician has signed); loads from the measured 1RMs (own overhead press, row, curl), machine maximum × calibration, harness load, femur and upper-arm lengths for range of motion; a warning when the session is longer than the time available; mission length and bone targets in the Scientist forecast.
- **Baselines:** saving updates age, mass, sex and the resting heart rate, blood pressure and grip baselines the rule engine compares against.
- **Rule engine:** a Watch finding "Entry survey needs clinician review" while any screening answer is Yes or the sign-off is missing.

Tested in the browser, zero errors: saving a Yes locks training and raises the finding; a new resting heart rate becomes the baseline; allergies reach the assistant and the case summary.

### Rename: Health assistant → Doctor (15 Nov 2026)

Team request. Everything the user sees now says "Doctor": the nav item, the page title, chat labels, "Ask the Doctor", the Today teaser and the libraries page. The Claude prompt calls it "the onboard AI doctor". Internal code names are unchanged, and the rename is a step in `app/build.py`. The reliability protocol is unchanged: the Doctor still never diagnoses or prescribes, and anything it can't judge reliably goes to the Medical Officer.

### v0.6.2: Stroke and TIA warning signs (15 Nov 2026)

Prompted by the Crew-11 medical evacuation (January 2026). A crew member was suddenly unable to speak for about 20 minutes, with no pain and no loss of consciousness; an onboard echocardiogram was done with the station's ultrasound; a heart attack and stroke were ruled out on Earth; the cause stayed unknown. Running the case through v0.6.1 showed a gap: "I suddenly can't speak", "slurred speech" and "I had trouble speaking but feel fine, am I OK for the spacewalk?" were routed to level 2, and no symptom existed for the rule engine to raise an alert.

Fix (`app/src/v06-neuro.js`):
- New level 4 topic "Stroke or TIA warning signs" (speech loss, slurred speech, word-finding trouble, face droop, one-sided weakness or numbness, sudden confusion or vision loss), checked first, which counts even if symptoms have passed. A dedicated checklist: stay with the person and note the time, FAST check every 5 minutes, Medical Officer does vitals, 5-lead ECG, glucose and ultrasound/echo, no spacewalk or critical tasks, flight surgeon immediately with the shirt's ECG and vitals from the event attached.
- Four new symptoms (Speech difficulty, Weakness or numbness on one side, Sudden confusion, Sudden loss of vision) trigger an Emergency safety rule that always reaches the Medical Officer, records the vitals at the time and blocks the spacewalk.
- Readiness is always "Not ready" while an emergency safety rule is active.
- Two library excerpts: AHA/StatPearls stroke and TIA signs; medical evacuations in spaceflight history (Salyut 7 1985, Mir 1987, Crew-11 2026).
- Test bench scenario "Sudden speech loss (Crew-11 type)".
- Routing test: "My left arm feels numb and tingly" now expects level 4 (was 3). Result 40/40.

Pitch angle: in the real event, heart rate, rhythm, blood pressure and SpO2 at the time were never released and may not have been continuously recorded. With the smart shirt worn, our app would have captured them automatically at the moment of the event, given the crew a clear emergency checklist within seconds, and handed the Medical Officer and flight surgeon a timeline. It still would not diagnose: telling a TIA from a heart rhythm problem or another cause needs imaging and specialists, which is why the case goes to humans.

### v0.6.3: Medical kit recommendations (15 Nov 2026)

Team request: should the Doctor recommend specific medicine, based on nine NASA links (Crew Systems, Medical Operations and Clinical Care, NASA-STD-3001 Vol 1 and 2, OCHMO-TB-044 Medical Operations, pre/post-flight and in-flight medical care, standards pages). Finding after reading all of them: NASA names no specific products, only categories. The Orion medical kit lists "anti-inflammatory, antibiotics, space motion sickness, sleep, and allergic-reaction medications". It addresses 128 conditions with 139 resources, and each crew member has a personal kit chosen with the flight surgeon. The Crew Medical Officer works from the Medical Checklist (JSC 48522), and medical authority stays with the Crew Surgeon. Low Earth orbit shows no change in medication stability, dosing or effect. Space motion sickness lasts about 3 days on average.

Built (`v06-meds.js`):
- For kit-medicine questions (level 2), the Doctor names the NASA kit category plus common over-the-counter examples: ibuprofen or paracetamol; melatonin; meclizine; loratadine or cetirizine; a decongestant spray or pseudoephedrine. Examples are labelled as examples and the dose is never given; the exact item and dose come from the Medical Checklist, and the Medical Officer confirms.
- Safety checks from the astronaut's own data: allergies from the entry survey; medicines already taken (warns against a second dose of the same type); dehydration (prefer paracetamol over an anti-inflammatory); stomach symptoms; CO2 as the possible cause of a headache or poor sleep; spacewalk or critical operations (no sedating medicine); raised blood pressure (decongestant tablets); drowsiness from anti-nausea medicine; allergic-reaction red flags.
- Antibiotics and prescription medicines are never suggested; they go to the Medical Officer (level 3).
- When the Medical Officer approves a kit suggestion, the medicine is logged as taken.
- A new library, "NASA medical kit and medical operations", with 4 excerpts. The Claude prompt gets the same kit rules.
- Tested: routing 40/40, zero errors.
