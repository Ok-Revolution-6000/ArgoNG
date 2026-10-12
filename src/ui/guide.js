/** An in-app reference; descriptions describe implemented behavior, not planned tools. */
const ENTRIES = [
  [
    'Start here',
    'Explore the globe',
    'Drag to pan; scroll or pinch to zoom. Use the top-bar tilt control for an oblique view, N for north-up, and the globe icon to return to Earth.',
    'Use case: move from a global overview to a building.',
  ],
  [
    'Start here',
    'Panels · + / −',
    'Plus expands a panel; minus collapses it. A layer toggle controls its data separately from opening the panel.',
    'Use case: open Data Layers, then enable Flights.',
  ],
  [
    'Start here',
    'Location',
    'Search for a place or choose a city and its points of interest. Press Enter in the search field to fly to a result.',
    'Use case: find Paris before exploring nearby layers.',
  ],
  [
    'Start here',
    'Data Layers',
    'Turn datasets on and off. Coverage, availability and refresh times vary by source; some layers require a provider key.',
    'Use case: combine aircraft, ships and infrastructure in one view.',
  ],
  [
    'Start here',
    'Scenes',
    'Select a preset or capture camera shots, then play them as a sequence. Import/export presets to reuse a tour.',
    'Use case: prepare a repeatable briefing route.',
  ],
  [
    'Start here',
    'Display',
    'Control the HUD, overlays, imagery and display effects. These settings change presentation, not the underlying evidence.',
    'Use case: reduce clutter while tracking a selected object.',
  ],
  [
    'Start here',
    'CCTV',
    'Explore supported public-camera sources and available frames or streams. Coverage is not universal and a frame may not be live.',
    'Use case: inspect an available street view; check its source and freshness.',
  ],
  [
    'Start here',
    'Street Level',
    'Browse supported street-level photography and coverage. Captured imagery is not a live camera feed.',
    'Use case: understand the physical surroundings of a place.',
  ],
  [
    'Start here',
    'Context',
    'Open contextual views such as nearby contacts, weather, regional information, radio and space missions.',
    'Use case: add local context to the current map view.',
  ],
  [
    'Start here',
    'Radio',
    'Browse and play available stations. The small radio icon opens compact controls; station playback and layer visibility are separate.',
    'Use case: listen to a regional broadcast while exploring.',
  ],
  [
    'Start here',
    'Visual Presets',
    'Choose Normal, Retro, Surveillance, Thermal, Anime, Noir or Snow. Thermal and surveillance styles are rendering effects, not sensor feeds.',
    'Use case: change contrast or the look of a presentation.',
  ],
  [
    'Start here',
    'Top-bar actions',
    'Clear layers switches off selected datasets. Share copies a view link. Tilt, north-up and globe reset adjust the camera.',
    'Use case: share a viewpoint without sharing your provider keys.',
  ],
  [
    'Jason & audio',
    'Jason',
    'The AI voice assistant can call app tools to navigate, change layers and query available data. Ask for a concrete action.',
    'Try: “Jason, fly to Paris and show aircraft.”',
  ],
  [
    'Jason & audio',
    'Microphone · MIC',
    'Choose System default, MacBook microphone or another connected input. Allow microphones reveals device names. Restart voice to apply a change.',
    'Use case: switch from the laptop microphone to a headset.',
  ],
  [
    'Jason & audio',
    'Space · push to talk',
    'Hold Space to speak. A short Space press activates a focused control; form fields keep their normal typing behavior.',
    'Use case: give a short command without an open microphone.',
  ],
  [
    'Jason & audio',
    'STD / MINI',
    'Select the voice model tier for the next session. Changing this preference does not reprice the active session.',
    'Use case: choose a different model before starting voice.',
  ],
  [
    'Jason & audio',
    'Usage · session cap',
    'Open Usage for estimated API spend, response tokens, captions and budget progress. A cap ends the voice session when the estimate reaches it.',
    'ChatGPT sign-in does not expose account quota or dollar cost here.',
  ],
  [
    'Jason & audio',
    'Investigating current events',
    'Regional brief retrieves broad headlines. Situation brief combines available operational feeds; topic-specific protest investigation is not implemented.',
    'Ask to fly to a place explicitly. Do not treat a generic answer as a verified current-event report.',
  ],
  [
    'Keyboard',
    '1 – 7 · visual styles',
    '1 Normal · 2 Retro · 3 Surveillance · 4 Thermal · 5 Anime · 6 Noir · 7 Snow.',
    'Use outside text fields to change the visual preset.',
  ],
  [
    'Keyboard',
    'H · HUD',
    'Toggle the intelligence heads-up display.',
    'Use case: show or hide the on-screen telemetry.',
  ],
  [
    'Keyboard',
    'O · orbit',
    'Toggle the camera orbit control.',
    'Use case: inspect a location from changing angles.',
  ],
  [
    'Keyboard',
    'V · clean view',
    'Toggle clean view.',
    'Use case: reduce interface clutter for a presentation.',
  ],
  [
    'Keyboard',
    'F · layers panel',
    'Toggle the Data Layers panel.',
    'Use case: quickly access dataset switches.',
  ],
  [
    'Keyboard',
    'D · detection display',
    'Cycle the detection overlay mode. These are app-rendered overlays, not proof of automated real-world detection.',
    'Use case: change how available objects are marked.',
  ],
  [
    'Keyboard',
    'C · CCTV',
    'Toggle CCTV using the app’s camera control.',
    'Use case: access camera coverage while exploring.',
  ],
  [
    'Keyboard',
    'Q W E R T · points of interest',
    'When a city is expanded in Location, jump to its first five available POIs.',
    'Use case: step through a city’s preset landmarks.',
  ],
  [
    'Keyboard',
    'Escape · dismiss / stop',
    'Close the guide or an active popup. During scene playback, Escape also stops the running scene.',
    'Use case: return focus to the globe.',
  ],
  [
    'Keyboard',
    'Tab · Enter · Space',
    'Tab moves focus; Enter or a short Space press activates a focused button.',
    'Use case: navigate the interface without a mouse.',
  ],
  [
    'Keyboard',
    '` · frame-rate monitor',
    'Toggle the frame-rate monitor using the backtick key.',
    'Use case: check rendering performance.',
  ],
  [
    'Keyboard',
    '? · guide',
    'Open this reference. Escape closes it and returns focus. Shortcuts are isolated while the guide is open.',
    'Use case: find a command without changing the map.',
  ],
  [
    'Map terms',
    'HUD · heads-up display',
    'The corner labels and overlays provide viewing context and telemetry. Decorative classification, recording or orbital labels are not evidence of a classified or live satellite feed.',
    'Use case: interpret the interface without confusing styling with provenance.',
  ],
  [
    'Map terms',
    'MGRS · Military Grid Reference System',
    'A grid-based way to express a geographic location. Latitude and longitude express position in angular coordinates.',
    'Use case: communicate a map location using a shared coordinate format.',
  ],
  [
    'Map terms',
    'POI · point of interest',
    'A named landmark or saved location.',
    'Use case: jump directly to a building or district.',
  ],
  [
    'Map terms',
    'AIS · vessel reports',
    'Automatic Identification System broadcasts used by vessel feeds. Coverage and reporting gaps can occur.',
    'Use case: inspect reported ship positions.',
  ],
  [
    'Map terms',
    'ADS-B · aircraft reports',
    'Aircraft broadcasts used by flight-tracking feeds. Feed coverage, delays and missing aircraft vary.',
    'Use case: inspect a reported callsign, altitude and track.',
  ],
  [
    'Map terms',
    'FIRMS · active fires',
    'Satellite-derived thermal detections supplied through NASA FIRMS. A hotspot is not a verified fire perimeter or a live camera image.',
    'Use case: identify reported thermal activity for further checking.',
  ],
  [
    'Map terms',
    'Tracking · orbit · framing',
    'Tracking follows an entity; orbit rotates the camera around a location; framing fits a target or region in view.',
    'Use case: follow a moving plane instead of circling a static landmark.',
  ],
  [
    'Map terms',
    'Imagery · terrain · 3D tiles',
    'Imagery supplies map pictures, terrain supplies elevation, and 3D tiles provide streamed geometry. Their capture dates differ from live overlay updates.',
    'Use case: distinguish the base map from a current aircraft marker.',
  ],
  [
    'Map terms',
    'GSD · NIIRS · altitude',
    'GSD is ground sampling distance; NIIRS is an imagery interpretability scale. Treat HUD estimates as display context, not certified sensor measurements. Altitude describes a height in the relevant readout.',
    'Use case: understand a viewing scale without inferring image freshness.',
  ],
  [
    'Providers',
    'Provider Settings · API key',
    'A provider credential enables a service. A configured key does not guarantee coverage, quota or successful requests.',
    'Use case: connect a source, then verify that its layer returns data.',
  ],
  [
    'Providers',
    'Google Maps · Cesium ion',
    'Google Map Tiles enables photorealistic 3D. Cesium ion enables configured imagery and terrain assets. Google place search can require separate server configuration.',
    'Use case: improve the base globe; these are not news feeds.',
  ],
  [
    'Providers',
    'OpenAI',
    'Powers Jason’s Realtime voice and generated HUD summaries. API-key mode and ChatGPT sign-in are separate authentication options.',
    'Use case: control the map conversationally.',
  ],
  [
    'Providers',
    'AISStream · OpenSky',
    'AISStream supplies vessel reports. OpenSky supplies aircraft observations; authenticated access can increase polling allowance.',
    'Use case: supplement maritime and aviation overlays.',
  ],
  [
    'Providers',
    'NASA FIRMS · TomTom',
    'FIRMS enables thermal detections. TomTom enables real traffic data; keyless traffic may be simulated.',
    'Use case: inspect environmental activity or traffic conditions with provenance.',
  ],
  [
    'Providers',
    'Mapillary · Launch Library',
    'Mapillary supplies street-level imagery coverage. Launch Library supplies launch and mission information.',
    'Use case: inspect surroundings or explore upcoming space missions.',
  ],
];

export function bindGuide({ documentRef = document } = {}) {
  const doc = documentRef,
    rail = doc.getElementById('left-panel-stack');
  if (!rail) return { destroy() {} };
  const launcher = doc.createElement('button');
  launcher.type = 'button';
  launcher.id = 'guide-launcher';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-controls', 'argong-guide');
  launcher.innerHTML =
    '<span>GUIDE</span><span class="guide-rule" aria-hidden="true"></span><span class="guide-plus" aria-hidden="true">+</span>';
  rail.append(launcher);
  const dialog = doc.createElement('dialog');
  dialog.id = 'argong-guide';
  dialog.setAttribute('aria-labelledby', 'guide-title');
  dialog.innerHTML = `<header class="guide-header"><div><p class="guide-eyebrow">ARGO NG · FIELD GUIDE</p><h2 id="guide-title">Know your workspace.</h2><p>Controls, shortcuts and the meaning behind the map.</p></div><button type="button" class="guide-close" aria-label="Close guide">×</button></header><div class="guide-tools"><label for="guide-search">Find a control or term</label><input id="guide-search" type="search" placeholder="Search microphone, traffic, shortcuts…" /><nav class="guide-tabs" aria-label="Guide categories"></nav></div><div class="guide-results" role="status" aria-live="polite"></div><div class="guide-content"></div><footer>ESC to close <span>Source coverage and timestamps matter. Visual effects are not live sensors.</span></footer>`;
  doc.body.append(dialog);
  const search = dialog.querySelector('input'),
    content = dialog.querySelector('.guide-content'),
    tabs = dialog.querySelector('nav');
  let category = 'All',
    previous = null;
  const buttons = [];
  const render = () => {
    const query = search.value.trim().toLowerCase();
    const rows = ENTRIES.filter(
      (row) =>
        (category === 'All' || row[0] === category) &&
        row.join(' ').toLowerCase().includes(query),
    );
    content.replaceChildren();
    for (const [group, title, description, use] of rows) {
      const article = doc.createElement('article');
      const tag = doc.createElement('span');
      tag.className = 'guide-category';
      tag.textContent = group;
      const heading = doc.createElement('h3');
      heading.textContent = title;
      const body = doc.createElement('p');
      body.textContent = description;
      const example = doc.createElement('p');
      example.className = 'guide-example';
      example.textContent = use;
      article.append(tag, heading, body, example);
      content.append(article);
    }
    dialog.querySelector('.guide-results').textContent = rows.length
      ? `${rows.length} entries`
      : 'No matches. Try another term or choose All.';
    for (const button of buttons)
      button.setAttribute(
        'aria-pressed',
        String(button.textContent === category),
      );
    content.scrollTop = 0;
  };
  for (const name of ['All', ...new Set(ENTRIES.map((row) => row[0]))]) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.onclick = () => {
      category = name;
      render();
    };
    tabs.append(button);
    buttons.push(button);
  }
  const open = () => {
    if (dialog.open) return;
    previous = doc.activeElement;
    render();
    dialog.showModal();
    search.focus();
  };
  const close = () => {
    dialog.close();
  };
  launcher.addEventListener('click', open);
  search.addEventListener('input', render);
  dialog.querySelector('.guide-close').addEventListener('click', close);
  dialog.addEventListener('close', () => {
    if (previous?.isConnected) previous.focus();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        close();
    }
  });
  const keyboard = (event) => {
    if (dialog.open) {
      event.stopImmediatePropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      return;
    }
    if (
      event.key === '?' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.target?.closest?.('input,textarea,select,[contenteditable="true"]')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    }
  };
  doc.addEventListener('keydown', keyboard, true);
  return {
    destroy() {
      doc.removeEventListener('keydown', keyboard, true);
      dialog.close();
      dialog.remove();
      launcher.remove();
    },
  };
}
