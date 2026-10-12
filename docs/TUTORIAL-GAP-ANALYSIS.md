# ArgoNG tutorial comparison and implementation roadmap

Saved: 2026-10-12. Source video: `/Users/ilprinceps/Downloads/videoplayback.mp4` (28:55).

Provider status below is a snapshot from the review, before the remaining powerups are added.

**ArgoNG already contains most of the tutorial’s functionality. The biggest gaps are missing provider credentials and how Jason coordinates the existing tools—not the globe or interface.**

I transcribed the 28:55 video, inspected frames throughout it, compared the demonstrations with our code, and checked your live provider settings. “Implemented” below means present in the code; it does not mean every external feed has been tested successfully today.

## Tutorial versus our version

| Tutorial capability | ArgoNG today | What we need |
|---|---|---|
| **3D globe, location search, map switching** · 02:09–03:55 | Implemented. Google Maps is configured. Bing imagery options require Cesium ion, which is missing. | Add Cesium ion if we want the same Bing map choices; verify each map source. |
| **Commercial and military aircraft, selection, tracking and trails** · 03:55–06:21 | Implemented, including keyless sources. | Test feed freshness, coverage and tracking in representative locations. OpenSky credentials are an optional enhancement. |
| **Cockpit view, telemetry, switching between aircraft and airport approaches** · 06:21–06:59; 17:44–19:49 | Implemented. | Test terrain loading, grounded aircraft and tracking transitions. This needs validation, not a new cockpit system. |
| **Display density, scope feathering, celestial mode, clean HUD and visual effects** · 04:33–05:47 | Implemented beneath our restyled interface. | Check that every control remains accessible and behaves correctly after the restyling. |
| **Contacts and radio** · 05:51–07:39 | Implemented. | Validate available stations and regional contact results; availability depends on the source. |
| **Voice navigation, annotations, camera orbits, routes and route fly-throughs** · 07:47–10:08 | Implemented. OpenAI is configured. | Run the tutorial’s actual command sequences through Jason and fix failures in tool selection or sequencing. |
| **Live vessels and accumulated tracks** · 08:28–09:26 | Integration exists, but **AISStream is not configured**. | Add an AISStream key and verify arrivals, vessel selection and track accumulation. [Provider documentation](https://www.aisstream.io/documentation/). |
| **Traffic congestion alongside CCTV** · 12:40–15:26 | CCTV exists. **TomTom is not configured**, so the traffic layer lacks its real flow feed and uses simulation mode. | Add TomTom, clearly label real versus simulated traffic, then check against available cameras. [Traffic API](https://developer.tomtom.com/traffic-api/documentation/product-information/introduction). |
| **Scene authoring, capture/update shots and playback** · 19:50–21:02 | Implemented. | Test creating, saving and replaying a sequence. The demonstration uses playback for screen recording; it does not establish a finished video-export pipeline. |
| **Earthquakes and active fires** · 21:06–22:15 | Earthquakes are implemented. Fire integration exists, but **NASA FIRMS is not configured**. | Add a FIRMS map key and verify detection timestamps and map rendering. [NASA setup documentation](https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html). |
| **Datacenters, submarine cables and infrastructure exploration** · 22:32–24:14 | Implemented, with entity context and query capabilities. | Validate selection, filtering and grounded explanations from Jason. |
| **Nepal flood reconstruction with mapped evidence** · 24:25–25:55 | The Nepal scene/evidence infrastructure is already included. | Validate the bundled scene. Other incidents require their own researched and prepared evidence packs. |

Your settings currently show **Google Maps and OpenAI configured**. AISStream, FIRMS, TomTom, Cesium ion, OpenSky, Mapillary and Launch Library credentials are absent. They are **not all equally necessary** for matching this tutorial.

## What is genuinely missing for the experience you want

### 1. A current-event investigation workflow

This is the most important gap for your Paris question.

Our regional news code retrieves a small set of location-based headlines. Our `situation_brief` combines weather, earthquakes, fires, aircraft, vessels and cyclones. Neither is a complete system for investigating a specific protest, school incident or developing story.

We need a workflow that:

1. Understands the topic, place and requested time window.
2. Retrieves relevant reporting and official notices.
3. Separates the event date from the article’s publication date.
4. Identifies and verifies the relevant locations.
5. Maps those locations and enables useful supporting layers.
6. Gives a sourced explanation, stating what remains uncertain.

**Adding more transport or environmental API keys alone will not provide this.**

### 2. Jason needs a deliberate “investigate and show” mode

The existing instructions explicitly distinguish answering questions from moving the map. That helps explain why “what is happening in Paris?” can produce an answer without a visual investigation.

We already have the building blocks: entity context, map annotations, navigation, layer controls and camera movement. We need to coordinate them into one dependable workflow—for example:

> “Investigate the Paris school protests over the last three days and show me the relevant locations.”

The result should combine research, map actions and an explanation. Camera movement should follow verified locations, rather than guessed coordinates.

### 3. Reusable incident workspaces

The tutorial’s Nepal example was assembled with a **coding agent and prepared source material**. It was not demonstrated as an automatic capability of the in-app voice assistant.

For ArgoNG to make this repeatable, we should add an incident workspace containing:

- Sources and supporting photos/videos.
- Verified locations and event timestamps.
- Map annotations and saved scenes.
- Findings, uncertainty and a resumable investigation history.

That is an extension beyond simply reproducing the tutorial.

## What I would do next, in order

1. **Activate the three missing feeds most visible in the tutorial:** AISStream, TomTom and FIRMS.
2. **Run a tutorial-parity acceptance test:** Rotterdam vessels → annotate/orbit → route playback → aircraft/cockpit → Austin or London traffic/CCTV → earthquake/fire → scene save/replay.
3. **Fix Jason’s tool orchestration wherever those tests fail.** Check results before he claims an action succeeded.
4. **Build the Paris investigation workflow** with topic/date-based retrieval, sources and mapped evidence.
5. **Add persistent incident workspaces** so investigations can be reopened and updated.

One expectation to keep clear: the tutorial itself acknowledges vessel-coverage gaps around Hormuz, discusses historical replay as future work, and uses prepared disaster evidence. Those are not capabilities we should assume the original already provides universally.

**My recommendation is to establish reliable tutorial parity first, then make sourced, map-driven investigations ArgoNG’s next substantial feature.**

## Execution status

- [x] Save the tutorial comparison and roadmap.
- [ ] User adds remaining provider powerups, starting with Cesium ion.
- [ ] Validate configured providers and distinguish missing keys, unavailable feeds and healthy empty coverage.
- [ ] Run the tutorial-parity acceptance sequence.
- [ ] Fix demonstrated orchestration failures.
- [ ] Implement sourced, map-driven current-event investigation.
- [ ] Implement persistent incident workspaces.

### Provider validation updates

- **Cesium ion — verified 2026-10-12:** token configured; Bing Aerial and Bing Labels both switched successfully in a fresh local browser session. Ion asset endpoints for imagery (2 and 3) and World Terrain (1) returned HTTP 200; imagery and terrain resources loaded without observed HTTP errors during the check.
- **AISStream — configured 2026-10-12:** provider settings report a key present. Live feed validation is still pending.
- **Launch Library 2 — verified keyless 2026-10-12:** `LL2_API_TOKEN` is absent. `/api/launches` returned HTTP 200 with a fresh upstream response containing 24 launches. Context → Space Missions displayed all 24 records in its 30-day roster. No paid credential or new integration was required; upcoming launches and other LL2 datasets are outside this verification.
