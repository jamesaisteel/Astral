# ASTRAL: Astronaut Status, Tracking, Risk Assessment & Life-support

*A doctor, a coach and a teammate for the crew, light-minutes from Earth.*
NASA Space Apps Challenge 2026 entry. In the prototype's interface ASTRAL appears under its working name, "Crew Health Monitor".

**Live demo:** https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/ (no install, no login, works offline once loaded)

> Prototype with simulated data. Thresholds are illustrative, not clinical or NASA limits, and nothing here is medical advice.

## What it is

ASTRAL is a health monitoring app for long-duration missions. It combines wearable and station sensors, medical instruments, nutrition, training equipment, questionnaires and photos, and compares everything with each astronaut's personal baseline. A fixed safety-rule engine raises alerts; an AI doctor explains, advises and follows a four-level reliability protocol, so anything it cannot judge reliably goes to the Crew Medical Officer with a ready-made summary. Everything runs in the browser with no connection to Earth.

## A 5-minute tour for judges

The app has two workspaces at the top right: **Crew app** (the product) and **Test bench** (simulates the sensors and inputs we don't have). The crew member selector picks one of four astronauts; the **View** switch changes between Astronaut (plain language) and Scientist (precise data, formulas, z-scores).

1. **Digital twin.** A 3D body of the selected astronaut. Turn it, filter body systems, click any organ to see its data. Parts that need attention glow.
2. **Today.** Readiness score, today's timetable (training, questionnaires, tests, samples) and status of every body system.
3. **A sick teammate (our real reference case: a team member had the flu all hackathon).** Test bench → Scenarios → *Respiratory infection*. Back in the Crew app: Today shows the fever finding; **Workout planner** cancels lifting (rule R1) and offers an easy cycle; ask the **Doctor** "Do I have an infection?" and watch it hand the case to the Medical Officer instead of guessing.
4. **The crew as one unit.** Test bench → *Crew: infection spreading* or *Crew: food-borne illness*. In the Crew app, set "Viewing as" to **Medical officer** → **Cross-crew analysis** finds the first case or the shared meal; **Medical queue** shows the cases the Doctor escalated.
5. **A real event, January 2026.** Test bench → *Sudden speech loss (Crew-11 type)*. ASTRAL treats it as a stroke warning sign: emergency checklist, Medical Officer alerted, spacewalk blocked, vitals at the time attached.
6. **Doctor.** Ask anything ("How can I sleep better?", "Am I fit for the spacewalk?", "Can I take a painkiller?"). Each answer shows its reliability level and the medical library sources it used. **Medical libraries** shows where its knowledge comes from.
7. **Skin check.** Pick a demo picture (or upload a photo) and press Analyse. Uncertain, urgent or contagious results go to the Medical Officer.
8. **Fungi.** Station-wide monitoring with sample history and risk sensors. Test bench → Station environment → *Condensation behind a panel* raises the risk.
9. **Manual data entry.** Everything sensors can't measure, by frequency, plus the pre-flight **Entry survey** that gives the Doctor the astronaut's history, unlocks training and sets personal baselines.
10. **Sensors.** The Test bench is organised by real device (Astroskin smart shirt, core-temperature headband, Actiwatch, Crew Active Dosimeter, CO2 monitor, cabin and exercise sensors). Switch a device off and the app shows "No data" instead of guessing.

## How it works

- **Personal baselines:** every reading is judged against the astronaut's own normal range, adjusted for the activity or flight phase (launch, docking, re-entry, landing).
- **Safety-rule engine:** deterministic rules rate each finding OK, Note, Watch, Act now or Emergency; trends must persist before they fire; missing sensors are shown, never guessed.
- **AI doctor with a reliability protocol:** level 1 the AI answers; level 2 it suggests and the Medical Officer confirms; level 3 a human decides; level 4 emergency checklist. The level comes from an auditable rulebook, not from the AI's confidence, and the AI can only make a question more cautious. A built-in test checks 40 sample questions (40/40 routed correctly).
- **Medical libraries:** answers cite curated excerpts from NASA's Human Research Program, NASA-STD-3001, NASA OSDR, StatPearls, MedlinePlus and specialist guidelines (prototype retrieval-augmented generation).
- **Offline by design:** the Doctor runs as an on-board model without internet; inside Claude it can use a live language model, and a local model (for example on an onboard computer) can be connected the same way.
- **Privacy:** medical data is private by default and shared per body system; only safety alerts always reach the Medical Officer; the Commander sees readiness without medical details.

## Run it locally (offline)

Download the repository (Code → Download ZIP), unzip, and either open `index.html` in Chrome or Edge, or serve the folder:

```
python3 -m http.server 8765
```

then open http://localhost:8765. Keep `index.html`, `three-bundle.js` and the `models` folder together.

## Repository contents

| Path | What it is |
|---|---|
| `index.html` | The whole app (built file) |
| `three-bundle.js`, `models/` | 3D library (three.js) and anatomy models |
| `source/` | Source of version 0.6 (`v06-*.js`, `v06.css`), the v0.5.1 base and `build.py`, which rebuilds `index.html` (`python3 source/build.py`) |
| `docs/design-log.md` | Full development record: research, every decision and version |
| `docs/project-details.md` | Our project description |
| `docs/research/` | Our three research reports (hardware, technology and constraints, market) |
| `docs/team-sources/` | Team documents the features are built from: sensors, medical libraries (Brain 1 and 2), eye health (OCULUS), fungal monitoring, timetable, intake survey, MUNAI skin screener and the training apps |

## Limits and next steps

- All sensor data is simulated; thresholds are demo values and need review by medical experts.
- The workout, bone and muscle models are not yet calibrated to real astronaut data.
- The skin check in the app uses MUNAI's on-board image analysis combined with vital signs; it is a screening aid, not a diagnosis.
- Not yet tested on onboard hardware such as an NVIDIA Jetson, or with real wearables.

## Credits

- 3D anatomy: open-anatomy-3d, adapted from BodyParts3D, HuBMAP and MakeHuman, CC BY 4.0.
- three.js (MIT licence). IBM Plex fonts (Google Fonts).
- Built in HTML, CSS and JavaScript with Claude (Claude Code); ChatGPT was used to gather sources.
