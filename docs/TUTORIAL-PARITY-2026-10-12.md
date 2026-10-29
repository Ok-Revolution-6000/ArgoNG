# Local tutorial-parity baseline — 12 October 2026

Tested against localhost:4173 in isolated Chromium profiles. The checks called
Jason's real action runner with explicit arguments. No microphone session or
speech-model turn was started. These results validate underlying tools, not
natural-language tool selection. Counts are observations from this run only.

| Capability | Observed result |
| --- | --- |
| Provider setup | Eight configured providers; Launch Library available keyless. Configuration alone is not feed verification. |
| AISStream | HTTP 200, live status and current positions. Browser accepted 12,000 vessel records. Rotterdam's initial context scan returned zero visible contacts; worldwide connectivity does not prove local coverage. |
| OpenSky | HTTP 200, 12,478 flight records in initial snapshot. Correctly specified nearest-aircraft lookup selected CES551 near London in a later snapshot. |
| NASA FIRMS | HTTP 200, 130,483 detections, stale=false. Fire layer enabled with nominal state. Individual detection age is distinct from fetch age. |
| TomTom | Austin reached live mode, eight flow tiles fetched. 1,100 displayed markers: 65% measured-flow coverage and 381 simulated markers. Live mode does not mean every marker is measured. |
| CCTV | Catalog had 3,903 entries; nearest-camera selection returned GUADALUPE ST / 29TH ST. Camera image freshness/playback was not verified. |
| Launch Library | HTTP 200, 24 launch records, no paid token. |
| Annotation / camera | Flew to Rotterdam, resolved and pinned Erasmus Bridge, started orbit and stopped it. |
| Route failure handling | Rotterdam Centraal waypoint lookup failed; no route drawn. Attempted flight correctly returned no-route error. This unresolved place lookup remains a limitation. |
| Route success | Big Ben → Westminster Abbey: walking route, 326 m, 263 s estimated walk, no straight-line fallback. Route flight returned ok=true, 40 waypoints, 4 s flight duration. |
| Aircraft / cockpit | Entered cockpit on WMT3EU, read active state, exited and stopped tracking. |
| Earthquakes | Enabled successfully with nominal USGS feed state. |
| Scenes | Listed six bundled scenes. Created a test scene in an isolated profile, captured/updated one shot, verified localStorage persistence, and awaited single-scene playback. Cross-reload restoration was not checked here. |

## Fix made from this baseline

Traffic coverage and simulated-marker count were absent from the compact
layer snapshot consumed by voice/HUD tools. They now travel in
`trafficCoverage`, including the enable result and view-state feed provenance.
Unknown metrics remain null rather than becoming zero. Mixed nominal traffic
gets an explicit narration warning against treating simulated markers as real
vehicle positions or observed congestion.

Jason's instructions now require dependent actions in order, acquisition-state
checks after enabling a feed, honest mixed traffic coverage, and no route flight
after failed waypoint resolution or a straight-line fallback. These instruction
changes still require a real voice/model acceptance run.

Validation: 112 existing orchestration/narration tests passed before changes;
117 targeted snapshot/action/integration tests passed after changes. Production
build passed. The reusable `scripts/qa-tutorial-parity.mjs` writes its observations
to ignored `qa-artifacts/` and uses an isolated browser profile. It is an
observational live-feed harness, not a substitute for inspecting failures.

## Still pending

- Speech-model sequencing with real spoken tutorial commands.
- Rotterdam waypoint lookup reliability and region-specific vessel coverage.
- Vessel track accumulation, camera image freshness, terrain/grounded-aircraft
  transitions, every display control, and scene restoration after reload.
- Mapillary live imagery validation; Cesium was verified in the earlier pass.
- Topic/date-based current-event retrieval, source verification, mapped evidence,
  and persistent incident workspaces. No Paris investigation was performed or
  implemented in this baseline.

## Recording test 1 fixes

The user's 4:27 recording confirmed London aircraft selection, cockpit entry,
Austin traffic/CCTV, and the 77% measured / 541 simulated traffic answer. It also
showed route playback after a failed routing lookup and a false cockpit-exit
failure. Implemented fixes:

- `flyRoute` rejects the selected route when `fallback=true`, before camera
  handoff. It cannot silently substitute an older valid route.
- Cockpit exit checks the resulting active state. Already-inactive is an
  idempotent success; a controller that remains active is still a failure.
- Failed tool results no longer receive the generic instruction to confirm a
  completed action. Annotation fallbacks get explicit no-flight guidance.
- A still-working update blocked by speech at its deadline retries while the
  tool is active, with one update per turn and cancellation/completion cleanup.

All 168 targeted tests and the production build passed. These fixes prevent
misleading fallback playback; they do not guarantee external routing-provider
availability. Speech timing improvements still need a spoken retest.
