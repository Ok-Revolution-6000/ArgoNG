import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { readRequestBody } from '../common/request.js';

export const GREETING_IDLE_MS = 60 * 60 * 1000;
export function greetingDue(profile, now) {
  return (
    Boolean(profile.firstName) &&
    (profile.welcomePending ||
      !profile.lastGreeting ||
      now - Math.max(profile.lastActivity || 0, profile.lastGreeting) >
        GREETING_IDLE_MS)
  );
}
export function createVoiceHistory({
  sourceRoot,
  resolveKey = () => process.env.OPENAI_API_KEY,
  now = Date.now,
}) {
  const dir = path.join(sourceRoot, '.gev-cache', 'voice-history');
  const scope = () => {
    const key = resolveKey();
    return key ? createHash('sha256').update(key).digest('hex') : null;
  };
  const load = (id) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return {
        since: now(),
        sessions: {},
        profile: { firstName: '', lastActivity: 0, lastGreeting: 0 },
      };
    }
  };
  const save = (id, data) => {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const target = path.join(dir, id + '.json'),
      tmp = target + '.' + randomUUID() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600, flag: 'wx' });
    fs.renameSync(tmp, target);
  };
  const recoveredUsage = () => {
    try {
      const recovered = JSON.parse(
        fs.readFileSync(path.join(dir, 'recovered.json'), 'utf8'),
      );
      const rows = recovered.sessions;
      if (
        !Array.isArray(rows) ||
        !rows.length ||
        rows.some((row) => !Number.isFinite(row.totalUsd) || row.totalUsd < 0)
      )
        return null;
      return {
        totalUsd: rows.reduce((sum, row) => sum + row.totalUsd, 0),
        sessionCount: rows.length,
        keyAttribution: 'unknown',
      };
    } catch {
      return null;
    }
  };
  const summary = (id, data) => {
    const rows = Object.values(data.sessions);
    const last = rows.sort((a, b) => b.startedAt - a.startedAt)[0] || null;
    return {
      scope: id,
      since: data.since,
      totalUsd: rows.reduce((sum, row) => sum + row.state.totalUsd, 0),
      sessionCount: rows.length,
      last,
      firstName: data.profile.firstName,
      recovered: recoveredUsage(),
    };
  };
  return async (req, res) => {
    const respond = (status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(body));
    };
    if (
      !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(
        req.socket?.remoteAddress,
      )
    )
      return respond(403, { error: 'Local access only' });
    const id = scope();
    if (!id) return respond(409, { error: 'API key is not configured' });
    try {
      if (req.method === 'GET') return respond(200, summary(id, load(id)));
      if (req.method !== 'POST')
        return respond(405, { error: 'Method not allowed' });
      const body = JSON.parse(await readRequestBody(req, 16384));
      if (body.scope !== id)
        return respond(409, {
          error: 'Configured key changed. Refresh before continuing.',
        });
      const data = load(id),
        time = now();
      if (body.action === 'profile') {
        const name = String(body.firstName || '').trim();
        if (name.length > 60 || (name && !/^[\p{L}\p{M} .’'-]+$/u.test(name)))
          return respond(400, {
            error:
              'Enter a first name using letters, spaces, apostrophes or hyphens.',
          });
        if (data.profile.firstName !== name)
          data.profile = { firstName: name, lastActivity: 0, lastGreeting: 0 };
      } else if (body.action === 'touch') {
        if (greetingDue(data.profile, time)) data.profile.welcomePending = true;
        data.profile.lastActivity = time;
      } else if (body.action === 'greet') {
        const due =
          greetingDue(data.profile, time) &&
          !(data.profile.reservation?.expires > time);
        const reservation = due
          ? { id: randomUUID(), expires: time + 30000 }
          : null;
        if (reservation) data.profile.reservation = reservation;
        save(id, data);
        return respond(200, {
          greeting: due
            ? `Hi ${data.profile.firstName}, Jason here. How can I help?`
            : null,
          reservation: reservation?.id || null,
        });
      } else if (
        body.action === 'greeted' ||
        body.action === 'cancel-greeting'
      ) {
        if (body.reservation !== data.profile.reservation?.id)
          return respond(409, { error: 'Greeting reservation expired' });
        if (body.action === 'greeted') {
          data.profile.lastGreeting = time;
          data.profile.lastActivity = time;
          data.profile.welcomePending = false;
        }
        delete data.profile.reservation;
      } else if (body.action === 'usage') {
        const row = body.session;
        if (
          !row ||
          !/^[-\w]{1,80}$/.test(row.id) ||
          ['__proto__', 'constructor', 'prototype'].includes(row.id) ||
          !row.state ||
          !row.usage
        )
          return respond(400, { error: 'Invalid usage snapshot' });
        for (const v of [
          row.state.totalUsd,
          ...['input', 'output', 'responses', 'captions'].map(
            (k) => row.usage[k],
          ),
        ])
          if (!Number.isFinite(v) || v < 0 || v > 1e10)
            return respond(400, { error: 'Invalid usage values' });
        const old = data.sessions[row.id];
        if (!old && Object.keys(data.sessions).length >= 20000)
          return respond(409, { error: 'History capacity reached' });
        // Snapshot maxima make retries and out-of-order updates idempotent.
        const state = {
          totalUsd: Math.max(row.state.totalUsd, old?.state.totalUsd || 0),
          modelId: String(row.state.modelId || '').slice(0, 100),
          capUsd: Number.isFinite(row.state.capUsd) ? row.state.capUsd : null,
          warnUsd: Number.isFinite(row.state.warnUsd)
            ? row.state.warnUsd
            : null,
          incomplete: Boolean(row.state.incomplete || old?.state.incomplete),
        };
        const usage = Object.fromEntries(
          ['input', 'output', 'responses', 'captions'].map((k) => [
            k,
            Math.max(row.usage[k], old?.usage[k] || 0),
          ]),
        );
        data.sessions[row.id] = {
          id: row.id,
          startedAt: old?.startedAt || time,
          updatedAt: time,
          state,
          usage,
        };
      } else return respond(400, { error: 'Unknown operation' });
      save(id, data);
      respond(200, summary(id, data));
    } catch {
      respond(500, { error: 'Voice history could not be read or saved' });
    }
  };
}
