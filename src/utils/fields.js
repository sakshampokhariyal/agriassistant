import { cropCatalog } from '../data/farmer';

/** "Field 1 · Ragi" – uses the farmer's own field name when given. */
export function fieldLabel(field, t, L, { withCrop = true } = {}) {
  if (!field) return '';
  const name = field.name?.trim() || t('fld.field', { n: field.no || 1 });
  if (!withCrop) return name;
  const crop = cropCatalog[field.cropId] ? L(cropCatalog[field.cropId].name).split(' (')[0] : '';
  return crop ? `${name} · ${crop}` : name;
}
