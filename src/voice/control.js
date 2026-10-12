import { apiUsageMarkup } from './apiUsage.js';

/** Build the voice control independently of its connection backend. */
export function createVoiceControl({ reset = false } = {}) {
  let root = document.getElementById('gev-voice-control');
  if (root && reset) {
    root.remove();
    root = null;
  }
  if (!root) {
    root = document.createElement('div');
    root.id = 'gev-voice-control';
    root.dataset.status = 'idle';
    root.dataset.speaker = 'idle';
    root.innerHTML = `
      <div class="gev-voice-heading">
        <div class="gev-voice-kicker">JASON</div>
        <div id="gev-voice-status">OFF</div>
        <details class="microphone-settings" id="microphone-settings">
          <summary aria-label="Choose microphone">MIC ▾</summary>
          <section class="voice-usage-panel microphone-panel" aria-label="Microphone settings">
            <header><strong>Jason · microphone</strong></header>
            <label for="voice-first-name">Your first name</label>
            <input id="voice-first-name" data-first-name autocomplete="given-name" maxlength="60" placeholder="First name" />
            <button type="button" data-save-name>Save name</button>
            <p data-name-status role="status">One welcome, then another after more than an hour of inactivity.</p>
            <label for="voice-microphone-select">Audio input</label>
            <select id="voice-microphone-select" aria-describedby="voice-microphone-message"><option value="">System default microphone</option></select>
            <button type="button" data-microphone-refresh>Allow microphones / refresh</button>
            <p id="voice-microphone-message" data-microphone-message role="status"></p>
          </section>
        </details>
        <div class="gev-voice-cost">
          <button id="gev-voice-tier" class="gev-voice-tier-btn" type="button" aria-pressed="false" title="Voice model tier — applies next session">STD</button>
        </div>
      </div>
      <button id="gev-voice-button" type="button" aria-label="Voice control — activate to toggle voice; hold Space to speak" aria-describedby="gev-voice-help">
        <span class="gev-mic-orbit"><img src="/mic.svg" alt="" /></span>
        <span class="gev-mic-label">ON/OFF</span>
      </button>
      <div class="gev-voice-visualizer" aria-hidden="true">
        ${Array.from({ length: 15 }, (_, index) => `<span style="--bar:${index}"></span>`).join('')}
      </div>
      <div class="gev-voice-readout">
        <div id="gev-voice-detail">VOICE STANDBY</div>
      </div>
      <details class="voice-usage" id="voice-usage">
        <summary aria-label="API usage, pricing and voice costs">
          <span class="voice-usage-label">API Usage</span>
          <span id="gev-voice-cost-value" class="gev-voice-cost-value" data-level="ok" title="Estimated session cost">~$0.00</span>
          <span class="voice-usage-compact" id="voice-usage-compact">0% of cap</span>
          <span class="voice-usage-chevron" aria-hidden="true">⌃</span>
        <div class="voice-usage-progress voice-usage-progress-compact" data-usage-progress role="progressbar" aria-label="Estimated session budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
        </summary>
        <section class="voice-usage-panel api-usage-panel" aria-label="API usage and pricing">
          <header><div><span class="api-eyebrow">GROUND STATION</span><strong>Usage &amp; pricing</strong></div><button type="button" data-usage-close aria-label="Close API usage">×</button></header>
          <div class="api-usage-switch" role="group" aria-label="Usage view">
            <button type="button" data-usage-view="all" aria-pressed="true">All APIs</button>
            <button type="button" data-usage-view="voice" aria-pressed="false">Voice details</button>
          </div>
          <div data-usage-page="all">${apiUsageMarkup()}</div>
          <div data-usage-page="voice" hidden>
          <p class="voice-usage-source" data-usage-field="source">API key · session estimate</p>
          <div class="voice-usage-total"><span data-usage-field="cost">~$0.00</span><small data-usage-field="costLabel">SESSION COST</small></div>
          <div class="voice-usage-progress" data-usage-progress role="progressbar" aria-label="Estimated session budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
          <p class="voice-usage-budget" data-usage-field="budget"></p>
          <div class="voice-history-total"><span>ArgoNG voice · saved total</span><strong data-usage-field="total">Loading…</strong></div>
          <p class="voice-usage-note" data-usage-field="history"></p>
          <div class="voice-history-total" data-recovered-usage hidden><span>Earlier local sessions · recovered</span><strong data-usage-field="recovered"></strong></div>
          <p class="voice-usage-note" data-recovered-note hidden></p>
          <dl>
            <div class="voice-usage-model"><dt>Model</dt><dd data-usage-field="model"></dd></div>
            <div><dt>Input tokens</dt><dd data-usage-field="input">0</dd></div>
            <div><dt>Output tokens</dt><dd data-usage-field="output">0</dd></div>
            <div><dt>Responses</dt><dd data-usage-field="responses">0</dd></div>
            <div><dt>Captions</dt><dd data-usage-field="captions">0</dd></div>
            <div><dt>Spend warning</dt><dd data-usage-field="warning"></dd></div>
          </dl>
          <p class="voice-usage-next" data-usage-field="next" hidden></p>
          <p class="voice-usage-note" data-usage-field="note"></p>
          </div>
        </section>
      </details>
      <div id="gev-voice-help" class="gev-voice-help-tray" role="tooltip">
        <span class="gev-voice-help-kicker">VOICE CONTROL</span>
        <span class="gev-voice-help-detail">Hold Space to speak · tap Space to activate focused controls</span>
      </div>
      <section id="gev-voice-card" class="gev-voice-card" hidden aria-label="Voice assistant">
        <div class="gev-voice-card-header">
          <span class="gev-voice-card-kicker">VOICE</span>
          <span id="gev-voice-card-phase" class="gev-voice-card-phase"></span>
          <button id="gev-voice-card-dismiss" class="gev-voice-card-dismiss" type="button" aria-label="Dismiss voice card">×</button>
        </div>
        <p id="gev-voice-card-user" class="gev-voice-card-caption" data-role="user" hidden><span class="gev-voice-card-who">YOU</span><span id="gev-voice-card-user-text" class="gev-voice-card-text"></span></p>
        <p id="gev-voice-card-pointer" class="gev-voice-card-pointer" hidden><span id="gev-voice-card-pointer-kind" class="gev-voice-card-who">THIS</span><span class="gev-voice-card-sr">: </span><span id="gev-voice-card-pointer-text" class="gev-voice-card-pointer-label"></span></p>
        <p id="gev-voice-card-assistant" class="gev-voice-card-caption" data-role="assistant" hidden><span class="gev-voice-card-who">JASON</span><span id="gev-voice-card-assistant-text" class="gev-voice-card-text"></span></p>
        <ol id="gev-voice-card-plan" class="gev-voice-card-plan" aria-label="Plan" hidden></ol>
        <div id="gev-voice-card-result" class="gev-voice-card-result" hidden>
          <div id="gev-voice-card-result-title" class="gev-voice-card-result-title"></div>
          <div id="gev-voice-card-chips" class="gev-voice-card-chips" hidden></div>
          <ul id="gev-voice-card-lines" class="gev-voice-card-lines"></ul>
          <ol id="gev-voice-card-referents" class="gev-voice-card-referents" aria-label="Referenced items" hidden></ol>
          <details id="gev-voice-card-notes" class="gev-voice-card-notes" hidden>
            <summary>NOTES &amp; SOURCES</summary>
            <ul id="gev-voice-card-note-list" class="gev-voice-card-lines"></ul>
          </details>
        </div>
        <div id="gev-voice-card-live" class="gev-voice-card-sr" aria-live="polite" aria-atomic="true"></div>
      </section>
      <div class="gev-voice-error-tray" role="alert" aria-live="assertive">
        <div class="gev-voice-error-header">
          <span>VOICE SYSTEM ERROR</span>
          <button class="gev-voice-error-dismiss" type="button">DISMISS</button>
        </div>
        <div id="gev-voice-error-detail"></div>
        <div class="gev-voice-error-hint">Check microphone permission and network access, then try again.</div>
      </div>
    `;
    const commandDock = document.getElementById('command-dock');
    if (commandDock) {
      const locationBar = document.getElementById('location-bar');
      const controlPanel = document.getElementById('control-panel');
      commandDock.appendChild(root);
      if (locationBar) commandDock.insertBefore(locationBar, root);
      if (controlPanel) commandDock.appendChild(controlPanel);
    } else {
      document.body.appendChild(root);
    }
    const usage = root.querySelector('#voice-usage');
    const closeUsage = () => {
      usage.open = false;
      usage.querySelector('summary').focus();
    };
    root
      .querySelector('[data-usage-close]')
      .addEventListener('click', closeUsage);
    usage.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && usage.open) {
        event.preventDefault();
        event.stopPropagation();
        closeUsage();
      }
    });
    root
      .querySelector('.gev-voice-error-dismiss')
      ?.addEventListener('click', () => {
        root.classList.add('error-dismissed');
      });
  }
  return {
    root,
    button: root.querySelector('#gev-voice-button'),
    buttonLabel: root.querySelector('.gev-mic-label'),
    status: root.querySelector('#gev-voice-status'),
    detail: root.querySelector('#gev-voice-detail'),
    helpDetail: root.querySelector('.gev-voice-help-detail'),
    errorDetail: root.querySelector('#gev-voice-error-detail'),
    tierButton: root.querySelector('#gev-voice-tier'),
    costValue: root.querySelector('#gev-voice-cost-value'),
    usageDetails: root.querySelector('#voice-usage'),
    microphoneSettings: root.querySelector('#microphone-settings'),
    usageCompact: root.querySelector('#voice-usage-compact'),
    usageProgress: [...root.querySelectorAll('[data-usage-progress]')],
    usageFields: Object.fromEntries(
      [...root.querySelectorAll('[data-usage-field]')].map((node) => [
        node.dataset.usageField,
        node,
      ]),
    ),
    card: root.querySelector('#gev-voice-card'),
  };
}
