# QIC Solutions website

Public landing page for [qicsolutions.net](https://qicsolutions.net).

## Local preview

Open `index.html` in a browser, or from this folder:

```bash
npx --yes serve .
```

## Deploy to Cloudflare Pages

1. In the Cloudflare dashboard: **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the `QICSolutions/qicsolutions-net` repository.
3. Build settings for this static site:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (repository root)
4. After the first deploy, open **Custom domains** and add `qicsolutions.net` (and optionally `www`).

DNS for the domain is already on Cloudflare, so custom-domain setup should be a few clicks.

## Contact

`support@qicsolutions.net` (Cloudflare Email Routing catch-all → Outlook).
