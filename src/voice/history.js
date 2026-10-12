import { formatCostUsd } from './voiceCost.js';
import { voiceUsageView, renderVoiceUsage } from './usageView.js';

/** Server-backed, key-scoped history. Never sends or stores a credential in the browser. */
export class VoiceHistory {
  constructor(cost) {
    this.cost = cost;
    this.data = null;
    this.error = '';
    this.sessionId = null;
    this.pending = new Map();
    this.sending = false;
    this.disposed = false;
    this.ready = this.load();
    this.retry = setInterval(() => {
      if (this.data) void this.flush();
      else void this.load();
    }, 10000);
  }
  async request(body) {
    const response = await fetch('/api/realtime/history', {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      keepalive: Boolean(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'History unavailable');
    return data;
  }
  async load() {
    try {
      this.data = await this.request();
      this.error = '';
      this.restorePending();
    } catch {
      this.error = 'History unavailable — session estimate only';
    }
    this.cost.syncCostUi();
  }
  start() {
    this.sessionId = crypto.randomUUID();
  }
  cache() {
    try {
      if (this.data)
        for (const [id, row] of this.pending)
          localStorage.setItem(
            `argong.usage.pending.${this.data.scope}.${id}`,
            JSON.stringify(row),
          );
    } catch {
      /* server remains primary */
    }
  }
  restorePending() {
    try {
      const prefix = `argong.usage.pending.${this.data.scope}.`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(prefix)) continue;
        try {
          const row = JSON.parse(localStorage.getItem(key));
          if (row?.id && !this.pending.has(row.id))
            this.pending.set(row.id, row);
        } catch {
          /* one damaged snapshot must not block other sessions */
        }
      }
    } catch {
      /* server remains primary */
    }
    void this.flush();
  }
  save(state, usage) {
    if (
      (this.cost.sessionCloudVoiceAuth || this.cost.cloudVoiceAuth) === 'oauth'
    )
      return;
    if (!this.sessionId) this.start();
    this.pending.set(this.sessionId, {
      id: this.sessionId,
      state: { ...state },
      usage: { ...usage },
    });
    this.cache();
    void this.flush();
  }
  async flush() {
    if (this.sending || !this.data || !this.pending.size) return;
    this.sending = true;
    try {
      for (const [id, row] of this.pending) {
        this.data = await this.request({
          action: 'usage',
          scope: this.data.scope,
          session: row,
        });
        if (this.pending.get(id) === row) {
          this.pending.delete(id);
          try {
            const key = `argong.usage.pending.${this.data.scope}.${id}`;
            // Another tab may already have a newer snapshot for this session.
            if (localStorage.getItem(key) === JSON.stringify(row))
              localStorage.removeItem(key);
          } catch {
            /* cache is optional */
          }
        }
        this.cache();
      }
      this.error = '';
    } catch {
      this.error = 'Usage not yet saved — retrying';
    } finally {
      this.sending = false;
      if (!this.disposed) this.cost.syncCostUi();
    }
  }
  paint() {
    const ui = this.cost.ui;
    if (!ui?.usageFields) return;
    if (
      (this.cost.sessionCloudVoiceAuth || this.cost.cloudVoiceAuth) === 'oauth'
    ) {
      if (ui.usageFields.history)
        ui.usageFields.history.textContent =
          'API history is separate from ChatGPT sign-in.';
      for (const node of ui.usageDetails.querySelectorAll(
        '[data-recovered-usage], [data-recovered-note]',
      ))
        node.hidden = true;
      if (ui.usageFields.costLabel)
        ui.usageFields.costLabel.textContent = 'SESSION COST';
      if (ui.usageFields.total)
        ui.usageFields.total.textContent = 'Unavailable';
      return;
    }
    const recovered = this.data?.recovered;
    const recoveredRow = ui.usageDetails.querySelector(
      '[data-recovered-usage]',
    );
    const recoveredNote = ui.usageDetails.querySelector(
      '[data-recovered-note]',
    );
    if (recoveredRow) recoveredRow.hidden = !recovered;
    if (recoveredNote) {
      recoveredNote.hidden = !recovered;
      recoveredNote.textContent = recovered
        ? `${recovered.sessionCount} earlier sessions recovered from local logs. API key was not recorded; excluded from the key-specific total. Partial estimate, not your OpenAI bill.`
        : '';
    }
    if (ui.usageFields.recovered)
      ui.usageFields.recovered.textContent = recovered
        ? formatCostUsd(recovered.totalUsd)
        : '';
    if (ui.usageFields.costLabel)
      ui.usageFields.costLabel.textContent = 'SESSION COST';
    const last = this.data?.last;
    if (!this.sessionId && last) {
      const state = {
        ...last.state,
        capUsd: last.state.capUsd ?? Infinity,
        warnUsd: last.state.warnUsd ?? Infinity,
        display: formatCostUsd(last.state.totalUsd),
        level:
          last.state.capUsd !== null && last.state.totalUsd >= last.state.capUsd
            ? 'cap'
            : last.state.warnUsd !== null &&
                last.state.totalUsd >= last.state.warnUsd
              ? 'warn'
              : 'ok',
        note: last.state.incomplete
          ? 'Incomplete estimate: some usage was not reported before disconnect.'
          : '',
      };
      const view = voiceUsageView({
        state,
        usage: last.usage,
        auth: 'api-key',
        pendingModelId: state.modelId,
      });
      view.fields.source = 'Last saved voice session';
      view.compact = 'Last: ' + view.compact;
      renderVoiceUsage(ui, view);
      ui.costValue.dataset.level = view.level;
      ui.costValue.title = `Last saved voice session · ${view.fields.budget}`;
    }
    const saved = this.data;
    if (ui.usageFields.history)
      ui.usageFields.history.textContent =
        this.error ||
        (saved
          ? `Saved on this machine · ${saved.sessionCount} ${saved.sessionCount === 1 ? 'session' : 'sessions'} · tracking since ${new Date(saved.since).toLocaleDateString()}. Voice estimates only; excludes HUD summaries, earlier unrecorded use and other apps.`
          : 'Loading saved usage…');
    // Cumulative estimate is distinct from the per-session safety cap.
    if (ui.usageFields.total)
      ui.usageFields.total.textContent = saved
        ? saved.sessionCount
          ? formatCostUsd(saved.totalUsd)
          : 'Not recorded yet'
        : 'Unavailable';
    if (!this.sessionId && !last) {
      ui.costValue.textContent = recovered
        ? formatCostUsd(recovered.totalUsd)
        : '—';
      ui.usageCompact.textContent = recovered
        ? 'Recovered · earlier usage'
        : saved
          ? 'No history'
          : 'Loading…';
      if (ui.usageFields.cost)
        ui.usageFields.cost.textContent = recovered
          ? formatCostUsd(recovered.totalUsd)
          : 'No saved session';
      if (ui.usageFields.source)
        ui.usageFields.source.textContent = recovered
          ? 'Recovered earlier local voice usage'
          : 'No voice sessions recorded for this API key yet';
      if (ui.usageFields.costLabel && recovered)
        ui.usageFields.costLabel.textContent = 'RECOVERED ESTIMATE';
      for (const field of ['input', 'output', 'responses', 'captions'])
        if (ui.usageFields[field]) ui.usageFields[field].textContent = '—';
      if (ui.usageFields.budget)
        ui.usageFields.budget.textContent =
          'The spending cap applies to each new voice session.';
      for (const bar of ui.usageProgress || []) bar.hidden = true;
    } else if (!this.sessionId && last)
      ui.costValue.textContent = formatCostUsd(last.state.totalUsd);
    if (this.error) ui.usageCompact.textContent = 'Not synced';
  }
  async greet(speak, valid) {
    await this.ready;
    if (!this.data || !valid()) return;
    try {
      const result = await this.request({
        action: 'greet',
        scope: this.data.scope,
      });
      if (result.greeting) {
        const sent = valid() && speak(result.greeting);
        await this.request({
          action: sent ? 'greeted' : 'cancel-greeting',
          scope: this.data.scope,
          reservation: result.reservation,
        });
      }
    } catch {
      /* greetings are optional */
    }
  }
  touch() {
    if (!this.data || Date.now() - (this.lastTouch || 0) < 15000) return;
    this.lastTouch = Date.now();
    void this.request({ action: 'touch', scope: this.data.scope }).catch(
      () => {},
    );
  }
  destroy() {
    this.disposed = true;
    this.cleanup?.();
    clearInterval(this.retry);
    void this.flush();
  }
}

export function bindVoiceProfile(controller) {
  const cost = controller._cost,
    ui = controller.ui;
  if (!cost || !ui?.usageDetails) return;
  cost.history = new VoiceHistory(cost);
  const history = cost.history,
    root = ui.microphoneSettings;
  const input = root?.querySelector('[data-first-name]'),
    button = root?.querySelector('[data-save-name]'),
    status = root?.querySelector('[data-name-status]');
  history.ready.then(() => {
    if (input && !history.disposed) input.value = history.data?.firstName || '';
  });
  const save = async () => {
    await history.ready;
    if (!history.data) {
      status.textContent = 'Connect an API key before saving your profile.';
      return;
    }
    try {
      history.data = await history.request({
        action: 'profile',
        scope: history.data.scope,
        firstName: input.value,
      });
      status.textContent =
        'Saved. Jason will greet you on the next voice start, then only after over an hour away.';
    } catch (error) {
      status.textContent = error.message;
    }
  };
  button?.addEventListener('click', save);
  const activity = () => history.touch();
  document.addEventListener('pointerdown', activity);
  document.addEventListener('keydown', activity);
  history.cleanup = () => {
    button?.removeEventListener('click', save);
    document.removeEventListener('pointerdown', activity);
    document.removeEventListener('keydown', activity);
  };
  controller.lifetimeSignal?.addEventListener(
    'abort',
    () => history.destroy(),
    { once: true },
  );
}
