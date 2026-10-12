import { VOICE_MODELS } from './voiceCost.js';

const providers = [
  [
    'google-maps',
    'Google Maps',
    'PAY AS YOU GO',
    '$6 / 1,000',
    '3D root requests · first paid volume tier',
    '1,000 free monthly. Place search uses separate SKUs. Volume discounts apply.',
    'https://developers.google.com/maps/billing-and-pricing/pricing',
  ],
  [
    'tomtom',
    'TomTom',
    'PLAN + USAGE',
    'Plan-dependent',
    'Traffic flow vector tiles',
    'Published allowance: 200,000 tiles/month. Your account plan determines the applicable rate.',
    'https://docs.tomtom.com/pricing',
  ],
  [
    'cesium-ion',
    'Cesium ion',
    'SUBSCRIPTION',
    'From $149 / month',
    'Commercial individual plan',
    'Community access is free for eligible personal / noncommercial use and evaluation. Plan and allowances are not detected from your token.',
    'https://cesium.com/platform/cesium-ion/pricing/',
  ],
];
const feeds = [
  ['aisstream', 'AISStream'],
  ['firms', 'NASA FIRMS'],
  ['opensky', 'OpenSky'],
  ['mapillary', 'Mapillary'],
  ['launch-library', 'Launch Library'],
];
const state = (id) =>
  `<span class="api-state" data-api-state="${id}">Checking…</span>`;

export function apiUsageMarkup() {
  return `
    <p class="api-intro">Your providers, their rates, and the usage recorded by ArgoNG.</p>
    <article class="api-provider api-provider-voice">
      <header><strong>OpenAI</strong>${state('openai')}</header>
      <div class="api-eyebrow">PAY AS YOU GO · VOICE</div>
      <div class="api-meter-pair"><div><span>Saved voice estimate · this key</span><strong data-api-voice-total>Loading…</strong></div><div><span>Earlier recovered sessions</span><strong data-api-voice-recovered>Not recorded</strong></div></div>
      <p class="api-footnote">Recovered sessions are separate and cannot be attributed to this key. Voice details includes the current session and cap. Other OpenAI requests and account-wide spend are not metered here.</p>
      <details class="api-rate-details"><summary>Model rates <span>USD / 1M tokens</span></summary>
        <div class="api-rate-table"><table><thead><tr><th>Model</th><th>Audio in / out</th><th>Text in / out</th></tr></thead><tbody>${Object.values(
          VOICE_MODELS,
        )
          .map(
            (m) =>
              `<tr><th>${m.id}</th><td>$${m.rates.audioInput} / $${m.rates.audioOutput}</td><td>$${m.rates.textInput} / $${m.rates.textOutput}</td></tr>`,
          )
          .join('')}</tbody></table></div>
        <p class="api-footnote">Uncached input rates. Cached input, images and captions have separate rates. Configured model overrides may differ.</p>
        <a href="https://developers.openai.com/api/docs/pricing" target="_blank" rel="noopener noreferrer">OpenAI pricing ↗</a>
      </details>
    </article>
    <div class="api-provider-grid">${providers.map(([id, name, type, price, unit, note, url]) => `<article class="api-provider"><header><strong>${name}</strong>${state(id)}</header><div class="api-eyebrow">${type}</div><div class="api-price">${price}</div><div class="api-unit">${unit}</div><p class="api-footnote">${note}</p><div class="api-meter" ${id === 'tomtom' ? 'data-api-tomtom' : ''}>${id === 'tomtom' ? 'Loading local request count…' : 'Account spend · not synced'}</div><a href="${url}" target="_blank" rel="noopener noreferrer">Pricing &amp; allowances ↗</a></article>`).join('')}</div>
    <section class="api-other"><h3>Other data providers</h3><p class="api-footnote">Access status only. Provider limits and optional plans still apply; account charges are not synced.</p>${feeds.map(([id, name]) => `<div><span>${name}</span>${state(id)}</div>`).join('')}</section>
    <p class="api-footnote api-pricing-date">Public pricing checked 12 Oct 2026 · USD, before tax. Rates are a reference, not your invoice. No combined spend total is shown while provider billing is unsynced.</p>
    <p class="api-refresh-status" data-api-refresh role="status"></p>`;
}

export function trafficUsageText(value) {
  if (
    !value ||
    !Number.isFinite(value.dailyCount) ||
    value.dailyCount < 0 ||
    !Number.isFinite(value.budget) ||
    value.budget <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date)
  )
    return 'Local request count unavailable';
  return `${value.dailyCount.toLocaleString('en-US')} / ${value.budget.toLocaleString('en-US')} local daily limit · ${Math.round((value.dailyCount / value.budget) * 100)}% · ${value.date} UTC. Request attempts on this machine; not your billing quota.`;
}

export function bindApiUsage(ui) {
  const root = ui.root;
  const panel = root?.querySelector?.('.api-usage-panel');
  if (!panel) return () => {};
  const abort = new AbortController();
  let pending = false;
  const syncVoice = () => {
    panel.querySelector('[data-api-voice-total]').textContent =
      ui.usageFields?.total?.textContent || 'Not recorded';
    panel.querySelector('[data-api-voice-recovered]').textContent =
      ui.usageFields?.recovered?.textContent || 'Not recorded';
  };
  const observer = new MutationObserver(syncVoice);
  for (const field of ['total', 'recovered']) {
    if (ui.usageFields?.[field])
      observer.observe(ui.usageFields[field], {
        childList: true,
        characterData: true,
        subtree: true,
      });
  }
  syncVoice();
  panel.querySelectorAll('[data-usage-view]').forEach((button) =>
    button.addEventListener(
      'click',
      () => {
        panel
          .querySelectorAll('[data-usage-view]')
          .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        panel.querySelectorAll('[data-usage-page]').forEach((p) => {
          p.hidden = p.dataset.usagePage !== button.dataset.usageView;
        });
      },
      { signal: abort.signal },
    ),
  );
  const refresh = async () => {
    if (!ui.usageDetails?.open || pending || abort.signal.aborted) return;
    pending = true;
    const request = async (url) => {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(8000)]),
      });
      if (!response.ok) throw new Error('Status unavailable');
      return response.json();
    };
    const [setup, traffic] = await Promise.allSettled([
      request('/api/setup/status'),
      request('/api/tomtom/status'),
    ]);
    pending = false;
    if (abort.signal.aborted) return;
    panel.querySelectorAll('[data-api-state]').forEach((node) => {
      const provider =
        setup.status === 'fulfilled' &&
        setup.value.keys?.find((k) => k.id === node.dataset.apiState);
      node.textContent = provider
        ? provider.set
          ? 'Configured'
          : provider.keylessReady
            ? 'Free access'
            : 'No key'
        : 'Status unavailable';
      node.dataset.ready = String(
        Boolean(provider && (provider.set || provider.keylessReady)),
      );
    });
    panel.querySelector('[data-api-tomtom]').textContent = trafficUsageText(
      traffic.status === 'fulfilled' ? traffic.value : null,
    );
    panel.querySelector('[data-api-refresh]').textContent =
      setup.status === 'fulfilled' && traffic.status === 'fulfilled'
        ? `Local status updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Configured does not verify a live feed.`
        : 'Some local status is unavailable. Pricing references remain available.';
  };
  ui.usageDetails.addEventListener('toggle', refresh, { signal: abort.signal });
  const timer = setInterval(refresh, 30000);
  void refresh();
  return () => {
    abort.abort();
    observer.disconnect();
    clearInterval(timer);
  };
}
