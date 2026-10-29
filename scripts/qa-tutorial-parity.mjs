import puppeteer from 'puppeteer';
import { writeFile, mkdir } from 'node:fs/promises';
// Run against an already configured local server. Uses an isolated browser profile.
// Calls the real tool runner, not the speech model; may consume provider quota.
const baseUrl = process.env.ARGO_QA_URL || 'http://localhost:4173';
await mkdir('qa-artifacts', { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const results = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(baseUrl);
  await page.waitForSelector('#first-run-launcher.visible');
  await page.click('[data-first-run-choice="explore"]');
  await page.waitForSelector('#loading-screen', { hidden: true });
  await page.waitForFunction(
    () => typeof window.__gevVoiceCommands?.runner === 'function',
  );
  async function run(name, args = {}) {
    const out = await page.evaluate(
      async (name, args) => {
        try {
          return await window.__gevVoiceCommands.runner(name, args, {
            signal: AbortSignal.timeout(30000),
          });
        } catch (e) {
          return { ok: false, error: e.message };
        }
      },
      name,
      args,
    );
    results.push({ name, args, out });
    console.log(
      JSON.stringify({
        name,
        ok: out.ok,
        error: out.error,
        say: out.say,
        result: JSON.stringify(out).slice(0, 1300),
      }),
    );
    return out;
  }
  await run('fly_to_location', { query: 'Rotterdam, Netherlands' });
  await run('set_layer_visibility', {
    layerId: 'ais-live-vessels',
    enabled: true,
  });
  await new Promise((r) => setTimeout(r, 5000));
  await run('get_entity_context', {});
  await run('annotate_map', {
    annotations: [
      {
        type: 'pin',
        target: 'Erasmus Bridge, Rotterdam',
        label: 'Erasmus Bridge',
      },
    ],
  });
  await run('move_camera', {
    motion: 'orbit',
    speed: 'slow',
    mode: 'continuous',
  });
  await run('move_camera', { motion: 'stop' });
  const route = await run('annotate_map', {
    annotations: [
      {
        type: 'route',
        label: 'Rotterdam route',
        mode: 'driving',
        points: [
          { target: 'Rotterdam Centraal, Netherlands' },
          { target: 'Erasmus Bridge, Rotterdam' },
        ],
      },
    ],
  });
  if (route.ok && !route.routeFallback)
    await run('fly_route', { label: 'Rotterdam route', speed: 'fast' });
  await run('move_camera', { motion: 'stop' });
  await run('fly_to_location', { locationId: 'london' });
  await run('set_layer_visibility', { layerId: 'flights', enabled: true });
  await new Promise((r) => setTimeout(r, 5000));
  await run('select_nearest_aircraft', {
    layerId: 'flights',
    locationId: 'london',
  });
  await run('control_cockpit', { action: 'enter', targetLayer: 'flights' });
  await run('control_cockpit', { action: 'status' });
  await run('control_cockpit', { action: 'exit' });
  await run('stop_tracking');
  await run('fly_to_location', { locationId: 'austin', rangeM: 2500 });
  await run('set_layer_visibility', { layerId: 'traffic', enabled: true });
  await run('set_layer_visibility', { layerId: 'cctv', enabled: true });
  await new Promise((r) => setTimeout(r, 10000));
  await run('control_cctv', { action: 'nearest' });
  const stats = await page.evaluate(() =>
    Object.fromEntries(
      ['traffic', 'cctv', 'flights', 'ais-live-vessels'].map((id) => [
        id,
        window.__godsEyeView.dataManager.layers.get(id)?.module?.getStats?.(),
      ]),
    ),
  );
  results.push({ stats });
  console.log(JSON.stringify({ stats }));
  await run('set_layer_visibility', { layerId: 'earthquakes', enabled: true });
  await run('set_layer_visibility', { layerId: 'local-firms', enabled: true });
  await run('control_scene', { action: 'list' });
  await page.screenshot({ path: 'qa-artifacts/tutorial-parity.png' });
} finally {
  await writeFile(
    'qa-artifacts/tutorial-parity.json',
    JSON.stringify(results, null, 2),
  );
  await browser.close();
}
