import { defineConfig } from 'vite';
import { createBrowserViteConfig } from './build/vite.js';

// The hosted preview deliberately has no local credentials or Vite API plugins.
// Local development continues to use vite.config.js and the configured providers.
export default defineConfig(() => {
  const config = createBrowserViteConfig({ command: 'build' });
  config.plugins.push({
    name: 'argong-hosted-preview-notice',
    transformIndexHtml(html) {
      return html.replace(
        '</body>',
        '<aside class="hosted-preview-notice" role="status">HOSTED PREVIEW · Voice, private feeds and saved usage run in the local app.</aside></body>',
      );
    },
  });
  return config;
});
