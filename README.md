# ReforestationAR

ReforestationAR is a web-based augmented reality extension for the Rebuilding Augusta project. It gives users two ways to explore digital tree models in AR: a single-model experience for viewing one plant at a time, and a multi-model experience for building a small tree garden in place.

The project is built as a Vite + React + TypeScript application inside `my-react-app`. It is meant to be deployed as a static web app over HTTPS so camera access and mobile AR features can work correctly.

## Technologies Used

- `React` powers the page UI, mode selection flow, and catalog interactions.
- `TypeScript` adds type safety for the catalog data, tree metadata, and AR scene events.
- `Vite` handles local development, bundling, and multi-page output.
- `Needle Engine` powers the multi-model AR experience. It manages the WebXR AR session, scene placement, lighting, and interactive tree placement/repositioning.
- `model-viewer` powers the single-model page. It provides a browser-based 3D preview plus native AR handoff support on compatible Android and iOS devices.
- `WordPress REST API` provides the live tree catalog data. The app requests tree entries from a custom WordPress endpoint and maps them into the same structure used by the local fallback catalog.

## Current App Pages

- `index.html`
  - Landing page and mode selector.
- `single-model.html`
  - Opens the `model-viewer` experience for previewing one tree at a time.
- `multi-model.html`
  - Opens the Needle Engine experience for placing multiple trees in AR.

## Project Structure

- `my-react-app/src/App.tsx`
  - Landing page and AR mode selection screen.
- `my-react-app/src/SingleModelApp.tsx`
  - Single-model experience using `model-viewer`.
- `my-react-app/src/MultiModelApp.tsx`
  - Multi-model React overlay for the Needle scene.
- `my-react-app/src/ar/needleScene.ts`
  - Needle Engine scene setup, tree placement, lighting, drag behavior, and AR button handling.
- `my-react-app/src/treeCatalog.ts`
  - Shared tree catalog types, local fallback data, and WordPress response mapping.
- `my-react-app/src/useTreeCatalog.ts`
  - Catalog loading hook with loading, error, and fallback handling.
- `my-react-app/src/components/TreeCatalogModal.tsx`
  - Shared modal used to browse tree entries.

## Local Development

1. Open a terminal in `ReforestationAR/my-react-app`.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build a production bundle:

```bash
npm run build
```

5. Preview the production build locally:

```bash
npm run preview
```

## WordPress Tree Catalog

The app loads tree data from the WordPress REST API by default:

```text
https://heliotrox.heliotrox.com/wp-json/wp/v2/tree?acf_format=standard&_fields=id,slug,acf,title
```

Expected data is similar to the `TreeCatalogEntry` structure in `my-react-app/src/treeCatalog.ts`.

If the API request fails or returns unusable data, the app automatically falls back to a small local catalog so the single-model and multi-model pages still remain usable.

### Environment Variable

You can override the default API URL with:

```text
VITE_TREE_API_URL
```

Example:

```env
VITE_TREE_API_URL=https://example.com/wp-json/wp/v2/tree?acf_format=standard&_fields=id,slug,acf,title
```

## Deployment Notes

- Deploy the built contents of `my-react-app/dist`.
- Host the app over `https`.
- Keep the WordPress API endpoint, preview images, `.glb` files, and `.usdz` files publicly accessible.
- The project is multi-page, so `index.html`, `single-model.html`, and `multi-model.html` should all stay together with their generated assets.
- The single-model page is typically the lighter-weight option for older or lower-powered devices.
- The multi-model Needle page is more demanding and works best on stronger mobile devices.

## Handoff Notes

- The marker-based AR mode was removed from the final version.
- Helpful comments were added throughout the React and Needle files to explain the responsibilities of the major systems.
- The local fallback catalog is useful during client handoff because it lets the UI keep functioning even if the live WordPress endpoint is still being configured.
