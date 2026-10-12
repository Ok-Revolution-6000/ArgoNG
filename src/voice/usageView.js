/** Presentation of reported session telemetry; never infer account quotas. */
export function voiceUsageView({ state, usage, auth, pendingModelId }) {
  const oauth = auth === 'oauth';
  const capped = !oauth && Number.isFinite(state.capUsd) && state.capUsd > 0;
  const percent = capped ? (state.totalUsd / state.capUsd) * 100 : null;
  const number = (value) => Number(value || 0).toLocaleString('en-US');
  const money = (value) => `$${value.toFixed(2)}`;
  return {
    percent: percent === null ? null : Math.min(100, Math.max(0, percent)),
    level: oauth ? 'unknown' : state.level,
    compact: oauth
      ? `${number(usage.input + usage.output)} tokens`
      : capped
        ? `${Math.round(percent)}% of cap${state.incomplete ? ' · partial' : ''}`
        : 'No session cap',
    fields: {
      source: oauth ? 'ChatGPT sign-in' : 'API key · session estimate',
      cost: oauth ? 'Unavailable' : state.display,
      budget: oauth
        ? 'Account quota is not reported'
        : capped
          ? `${Math.round(percent)}% of ${money(state.capUsd)} session cap`
          : 'Session cap is disabled',
      model: state.modelId,
      next:
        pendingModelId !== state.modelId
          ? `Next session: ${pendingModelId}`
          : '',
      input: number(usage.input),
      output: number(usage.output),
      responses: number(usage.responses),
      captions: number(usage.captions),
      warning: oauth
        ? 'Unavailable'
        : Number.isFinite(state.warnUsd)
          ? money(state.warnUsd)
          : 'Disabled',
      note: [
        oauth
          ? 'USD cost, account limits and reset times are not reported for ChatGPT sign-in.'
          : 'Estimated API spend for this session, including reported caption charges. Token counts below cover responses only.',
        state.ratesRecognized === false && !oauth
          ? 'Unrecognized model: estimate uses conservative fallback rates.'
          : '',
        state.note || '',
      ]
        .filter(Boolean)
        .join(' '),
    },
  };
}

export function renderVoiceUsage(ui, view) {
  if (!ui?.usageDetails) return;
  ui.usageDetails.dataset.level = view.level;
  if (ui.usageCompact) ui.usageCompact.textContent = view.compact;
  for (const [key, value] of Object.entries(view.fields)) {
    const node = ui.usageFields?.[key];
    if (node) {
      node.textContent = value;
      if (key === 'next') node.hidden = !value;
    }
  }
  for (const progress of ui.usageProgress || []) {
    progress.hidden = view.percent === null;
    if (view.percent === null) {
      progress.removeAttribute('aria-valuenow');
      continue;
    }
    progress.style.setProperty('--usage-percent', `${view.percent}%`);
    progress.setAttribute('aria-valuenow', String(Math.round(view.percent)));
    progress.setAttribute('aria-valuetext', view.fields.budget);
  }
}
