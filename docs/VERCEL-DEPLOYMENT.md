# ArgoNG on Vercel

The `argong` project is separate from `tam-c` in the `il-princeps` Vercel team.

This initial deployment is a **frontend preview**, built with
`vite.vercel.config.js`. It uses the keyless globe and displays a hosted-preview
notice. It does not load local environment files or install local Vite API
middleware. Personal credentials, cached data, voice history and logs are excluded
from the deployment and Git.

## Deploy

```sh
vercel link --yes --project argong --scope il-princeps
vercel --prod --yes --scope il-princeps
```

Vercel runs `npm ci` and `npm run build -- --config vite.vercel.config.js`, then
serves `dist`. The normal `npm run dev` workflow retains all configured local
providers.

## Full hosted application work still required

- Port the local provider middleware to hosted backend routes, including their
  same-origin checks and authenticated access to paid API credentials.
- Replace local-file voice history and counters with durable, user-scoped storage.
- Adapt the AIS upstream connection and other process-lifetime caches to the
  hosting lifecycle.
- Configure provider credentials in the new project's environment and restrict
  browser keys to its final domain.
- Replace the localhost credential editor / server restart flow with hosted
  settings, and verify each feed and voice on the deployed domain.

Do not treat a successful static deployment as a migration of those services.
