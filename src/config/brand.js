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
