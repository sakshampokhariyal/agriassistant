/**
 * Single source of truth for branding.
 * Every UI string uses the `{app}` token (filled in by `translate()`), and code
 * imports APP_NAME directly – so renaming the product is a one-line change here.
 */
export const APP_NAME = 'AgriSahaya';
export const APP_TITLE = `${APP_NAME} – Farming Assistant`;
/** Prefix for locally generated report references, e.g. AS-20261105-4F2A. */
export const REF_PREFIX = 'AS';
/** Prefix for downloaded files. */
export const FILE_PREFIX = APP_NAME;

/** Official tagline from the logo (English-only lockup; translated UI tagline lives in `app.tagline`). */
export const BRAND_TAGLINE = 'Cultivating Hope, Supporting Farmers';
/** Logo assets in /public (served from the site root). */
export const LOGO = {
  full: '/logo.png', // emblem + wordmark + tagline
  mark: '/logo-mark.png', // circular emblem, transparent corners
};
/** Palette sampled from the logo – mirrored in tailwind `brand.*` and CSS vars `--brand-*`. */
export const BRAND_COLORS = {
  green: '#1b7a32',
  leaf: '#58a73c',
  gold: '#e9a84f',
  navy: '#1b2a5e',
  cream: '#f9f7ea',
};
