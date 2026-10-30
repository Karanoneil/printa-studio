# Printa Designer — Magento 2 Module

Drop-in product designer for Magento 2. Embeds the Printa Studio design
editor on product pages via `layout.xml`, stores the finished design JSON
on the quote/order item, and shows the customer's preview in cart,
checkout, and order views.

## Install (manual copy — works with any Magento 2.3/2.4)

```bash
# from this folder's parent (magento2/ root)
mkdir -p app/code/Printa
cp -r magento-module/Printa/Designer app/code/Printa/Designer

php bin/magento module:enable Printa_Designer
php bin/magento setup:upgrade
php bin/magento setup:static-content:deploy -f   # or skip in dev
php bin/magento cache:flush
```

## Configure

Stores → Configuration → Catalog → Printa Designer:

| Field | Description | Example |
|---|---|---|
| **Studio Origin** | Where the Printa editor is hosted | `https://your-printa-host` |
| **Enabled** | Master switch | Yes |

(The default config points at `http://localhost:3000` for local testing.)

## What it does

1. **Product page** — adds a "🎨 Customize & Design" button + modal under
   the add-to-cart form (`catalog_product_view.xml` layout handle).
2. **Cart item** — design JSON + preview thumbnail are saved into the
   quote item's `printa_design` / `printa_preview` custom option values
   via a plugin on `Magento\Quote\Model\Quote\Item::addQty` → actually
   via the `checkout_cart_product_add_after` observer.
3. **Order** — values persist to the order item through Magento's
   standard option-carrying mechanism, so they're visible in admin and
   email templates.
4. **No core hacks** — everything is layout XML, an observer, and a
   plugin. Uninstall = remove the folder.

## PostMessage protocol

```
host → iframe: { type: "printa:init", product, preset?, design? }
iframe → host: { type: "printa:ready" }
iframe → host: { type: "printa:complete", design, previewPng, width, height }
iframe → host: { type: "printa:cancel" }
```

`design` is the full StudioDesign JSON — attach it to the buy request:

```php
$buyRequest->setData('printa_design', $designJson);
```

## Mapping design JSON → production files

The `StudioDesign` JSON contains absolute-px element geometry + font ids.
To produce print-ready output, render it server-side (Puppeteer/Chromium
screenshot of the same renderer, or a Node canvas port of
`lib/exportDesign.ts`) at `design.width × design.height` — it's a
coordinate-exact spec, same as the client-side PNG export.
