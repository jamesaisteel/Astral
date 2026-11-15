# ASTRAL: project details (submission text)

**ASTRAL: Astronaut Status, Tracking, Risk Assessment & Life-support.**
*A doctor, a coach and a teammate for the crew, light-minutes from Earth.*

## What it does and how it works

We didn't just build another system. We gave the crew a new member, and its name is ASTRAL.

ASTRAL watches over every astronaut around the clock. It combines data from wearable and station sensors (an Astroskin-type smart shirt, core-temperature headband, wrist actigraph, radiation dosimeter, CO2 and cabin sensors), exercise equipment, nutrition logs, short questionnaires and photos. It compares every reading with that astronaut's personal baseline, which comes from an entry survey completed before the mission, so it judges what is normal for this person, not for an average human.

When something changes, ASTRAL links readings across body systems to find the likely cause, explains what will happen if nothing changes, and recommends what to do next. A fixed safety-rule engine sits underneath the AI: dangerous readings always trigger an alert, whatever the AI says.

Its AI doctor follows a four-level reliability protocol:
1. It answers routine questions itself.
2. It suggests decisions that the Crew Medical Officer confirms with one tap.
3. It hands the hard cases to humans with a ready-made summary, without guessing a diagnosis.
4. In an emergency, it reads out the checklist.

Its answers cite trusted medical libraries: NASA's Human Research Program, NASA medical standards, the NASA Open Science Data Repository and clinical references. ASTRAL works fully offline in a web browser, because on the way to Mars a message to Earth takes 3 to 22 minutes each way, and that is too slow in a medical emergency.

ASTRAL focuses on the body's weakest points in space:
- **Muscle and bone:** without exercise, bone density falls about 1 to 1.5% a month, and after six months on the ISS calf volume fell 13% despite daily exercise.
- **Eyes:** about 70% of ISS astronauts show some swelling at the back of the eye.
- **Mental health and the heart.**

Its workout planner adapts each session to how the astronaut slept, ate and recovered, and asks what they think caused a failed set. It also sees the crew as one unit: it spots an infection spreading, traces food poisoning to a shared meal, and monitors the station for fungal growth.

## Benefits and impact

- **More time for science:** about 2 minutes a day and 15 minutes a week of input, with routine analysis done automatically.
- **Shorter training:** in our training model, an optimised plan met the bone and muscle targets in 293 minutes a week instead of 529. This is a modelled result that still needs validation with real crew data.
- **Safer missions:** problems are caught early, and the hardest decisions still reach a human doctor.
- **Records for Earth:** scientists and doctors get organised records and routine analysis, so only the toughest decisions need them.
- **Beyond space:** the same approach fits remote clinics with no specialist nearby, polar stations, sports teams and elderly care.

**Tested against a real case.** In January 2026 a crew member on the ISS suddenly lost the ability to speak for about 20 minutes, which led to the first medical evacuation in the station's history. We ran this case through ASTRAL. It revealed a gap, which we fixed: ASTRAL now treats sudden speech loss as a stroke warning sign. It gives an emergency checklist within seconds, blocks the spacewalk, alerts the Medical Officer, and attaches the heart rate, rhythm and blood pressure at the moment of the event. Those readings were never made public in the real case.

## Tools, languages, hardware and software

- **Code:** HTML, CSS and JavaScript, with three.js for the 3D digital twin (open anatomy model based on BodyParts3D, CC BY 4.0) and a small Python build script.
- **AI tools:** Claude (Claude Code) for building, and ChatGPT to gather sources and make informed decisions.
- **Data:** sensor data is simulated on a test bench that mirrors real NASA and partner hardware.
- **Hardware:** ASTRAL runs in a browser with no internet connection, so it is designed for small onboard computers such as an NVIDIA Jetson. We have not yet tested it on one.
- **Real-world reference:** one team member had the flu throughout the hackathon, and we used him as a real-life reference case.

## Creativity

All of us are involved in sports, so we know strength is not the only factor. ASTRAL looks at what happened before a workout and asks the astronaut what they think went wrong.

We built our own skin-screening module that adds a visual layer: it combines a photo with live vital signs and NASA's record of which skin problems occur in space. In testing on 1,200 images it classified 99.75% correctly.

We focus on fungal growth, which can hide anywhere in a closed station. Humidity and airflow sensors predict where it might grow before samples prove it.

Its friendly mode acts like a caring teammate. For example: "Your sleep has dropped three nights in a row. Maybe a call home tonight, or a lighter morning?"

## Factors we considered

- **Microgravity:** muscle, bone, fluid shifts and eyes.
- **Enclosed environments,** both physical and mental.
- **Constant repetition,** so daily input stays under two minutes.
- **Not every astronaut is a doctor,** so ASTRAL must be simple and tell them exactly what to do.
- **Safety:** no step can be skipped, and when a sensor fails or the AI is unsure, it says so and escalates instead of guessing.
- **Privacy:** medical data is private by default and shared by choice. Only safety alerts always reach the Medical Officer, and the Commander sees readiness without medical details.
- **Balance:** the fine line between efficiency and prevention.

**Limits and next steps:** validate the models with real astronaut data, review the thresholds with medical experts, connect real wearables, and test on onboard hardware.
