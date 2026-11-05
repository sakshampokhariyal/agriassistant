/**
 * Crop-loss claim logic: loss category, ClaimClock deadline, preliminary
 * eligibility, and missing / inconsistent field checks. Pure functions only –
 * every result is preliminary guidance, never an official decision.
 */
import { REF_PREFIX } from '../config/brand';
import {
  AREA_PERILS, CHECKLIST, DEADLINE_HOURS, LOCALIZED_PERILS, POST_HARVEST_DAYS, POST_HARVEST_PERILS,
} from '../data/insurance';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export function newDraft(profile, crops) {
  const first = crops[0];
  return {
    id: null,
    ref: null,
    createdAt: null,
    updatedAt: null,
    incidentDate: '',
    incidentTime: '',
    timeUnknown: false,
    damageType: '',
    otherDamage: '',
    cropState: '',
    harvestDate: '',
    cutSpread: '',
    submerged: '',
    village: profile.village || '',
    district: profile.district || '',
    state: profile.state || '',
    surveyNo: '',
    cropId: first?.cropId || '',
    cropOther: '',
    area: first?.acres != null ? String(first.acres) : '',
    extent: '',
    description: '',
    insured: '',
    policyId: '',
    insurer: '',
    insuredCrop: '',
    season: '',
    year: String(new Date().getFullYear()),
    insuredArea: '',
    premiumProof: '',
    notified: '',
    photos: [],
    preLeave: {},
    status: 'draft',
    officialRef: '',
    notes: '',
    statusUpdatedAt: null,
    pdfAt: null,
  };
}

/** App reference like AS-20261105-4F2A (local only, NOT an official claim number). */
export function makeRef(date = new Date()) {
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `${REF_PREFIX}-${ymd}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
}

/** Incident moment. Unknown time → start of day (earliest possible = safest for deadlines). */
export function incidentAt(d) {
  if (!d.incidentDate) return null;
  const time = !d.timeUnknown && d.incidentTime ? d.incidentTime : '00:00';
  const at = new Date(`${d.incidentDate}T${time}`);
  return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * Loss category:
 *  localized | postHarvest | areaBased            – determined
 *  localizedCheck | postHarvestCheck | unknownPeril | needCropState – needs info
 *  phNotCutSpread | ph14 | phNotListed            – not covered as post-harvest
 */
export function classify(d) {
  if (!d.damageType) return 'unknownPeril';
  if (!d.cropState) return 'needCropState';

  if (d.cropState === 'harvested') {
    if (!POST_HARVEST_PERILS.includes(d.damageType)) return 'phNotListed';
    if (d.cutSpread === 'no') return 'phNotCutSpread';
    if (d.harvestDate && d.incidentDate) {
      const days = Math.round((new Date(d.incidentDate) - new Date(d.harvestDate)) / DAY);
      if (days > POST_HARVEST_DAYS) return 'ph14';
    }
    if (d.cutSpread !== 'yes' || !d.harvestDate) return 'postHarvestCheck';
    return 'postHarvest';
  }

  // standing crop
  if (d.damageType === 'other') return 'unknownPeril';
  if (d.damageType === 'heavyRain') {
    if (d.submerged === 'yes') return 'localized';
    if (d.submerged === 'no') return 'areaBased';
    return 'localizedCheck';
  }
  if (LOCALIZED_PERILS.includes(d.damageType)) return 'localized';
  if (AREA_PERILS.includes(d.damageType)) return 'areaBased';
  return 'unknownPeril';
}

export const DEADLINE_CATS = ['localized', 'postHarvest'];
export const MAYBE_DEADLINE_CATS = ['localizedCheck', 'postHarvestCheck'];

/**
 * ClaimClock.
 * applies: 'yes' | 'maybe' | 'no'
 * state: 'ok' | 'soon' | 'expired' | 'future' | 'noDate' | 'na'
 */
export function deadlineInfo(d, now = new Date()) {
  const cat = classify(d);
  const applies = DEADLINE_CATS.includes(cat) ? 'yes' : MAYBE_DEADLINE_CATS.includes(cat) ? 'maybe' : 'no';
  const at = incidentAt(d);
  if (!at) return { cat, applies, state: 'noDate' };
  const elapsedMs = now - at;
  if (elapsedMs < 0) return { cat, applies, state: 'future', at };
  const deadline = new Date(at.getTime() + DEADLINE_HOURS * HOUR);
  const leftMs = deadline - now;
  let state = 'na';
  if (applies !== 'no') state = leftMs <= 0 ? 'expired' : leftMs <= 24 * HOUR ? 'soon' : 'ok';
  return { cat, applies, state, at, deadline, elapsedMs, leftMs: Math.max(0, leftMs) };
}

export const splitHM = (ms) => ({ h: Math.floor(ms / HOUR), m: Math.floor((ms % HOUR) / 60000) });

/** Category key used for the badge text. */
export function categoryLabelKey(cat) {
  if (cat === 'localized') return 'ins.cat.localized';
  if (cat === 'postHarvest') return 'ins.cat.postHarvest';
  if (cat === 'areaBased') return 'ins.cat.areaBased';
  if (['phNotCutSpread', 'ph14', 'phNotListed'].includes(cat)) return 'ins.cat.notListed';
  return 'ins.cat.uncertain';
}

/**
 * Missing / inconsistent fields.
 * severity: 'error' (must fix) | 'warn' (check)
 * step: wizard step index to jump to for fixing.
 */
export function validate(d, profile, now = new Date()) {
  const issues = [];
  const add = (key, step, severity = 'error', vars) => issues.push({ key, step, severity, vars });
  const num = (v) => (v === '' || v == null ? null : Number(v));

  // step 0 – when
  if (!d.incidentDate) add('dateMissing', 0);
  else if (incidentAt(d) && incidentAt(d) > now) add('dateFuture', 0);
  if (d.incidentDate && !d.incidentTime && !d.timeUnknown) add('timeMissing', 0, 'warn');

  // step 1 – incident
  if (!d.damageType) add('damageMissing', 1);
  if (d.damageType === 'other' && !d.otherDamage.trim()) add('otherDamageMissing', 1);
  if (!d.cropState) add('cropStateMissing', 1);
  if (d.cropState === 'harvested') {
    if (!d.harvestDate) add('harvestDateMissing', 1);
    else if (d.incidentDate && d.harvestDate > d.incidentDate) add('harvestAfter', 1);
  }
  if (!d.village.trim() || !d.district.trim() || !d.state.trim()) add('locationMissing', 1);
  if (!d.surveyNo.trim()) add('surveyMissing', 1, 'warn');
  if (!d.cropId || (d.cropId === 'other' && !d.cropOther.trim())) add('cropMissing', 1);
  const area = num(d.area);
  if (area == null || !(area > 0)) add('areaMissing', 1);
  else if (profile?.landSize && area > Number(profile.landSize)) add('areaTooBig', 1, 'warn', { area, land: profile.landSize });
  const extent = num(d.extent);
  if (extent == null) add('extentMissing', 1);
  else if (!(extent >= 1 && extent <= 100)) add('extentRange', 1);
  if (!d.description.trim()) add('descMissing', 1, 'warn');

  // step 2 – insurance
  if (!d.insured) add('insuredMissing', 2);
  if (d.insured === 'yes') {
    if (!d.policyId.trim()) add('policyMissing', 2, 'warn');
    if (!d.season || !d.year) add('seasonMissing', 2, 'warn');
    const ia = num(d.insuredArea);
    if (ia != null && area != null && ia < area) add('insuredAreaSmall', 2, 'warn');
    if (d.insuredCrop && d.cropId && d.insuredCrop !== 'unknown' && d.insuredCrop !== d.cropId) add('cropMismatch', 2);
  }

  // step 3 – evidence
  if (!d.photos.length) add('noPhotos', 3, 'warn');
  else {
    const open = CHECKLIST.filter((c) => !d.photos.some((p) => p.tag === c)).length;
    if (open) add('checklistOpen', 3, 'warn', { n: open });
  }
  return issues;
}

/**
 * Preliminary eligibility.
 * result: 'eligible' | 'moreInfo' | 'notCovered'
 */
export function assessEligibility(d, profile, cropName, now = new Date()) {
  const reasons = []; // {key, vars, tone: 'good'|'info'|'bad'}
  const next = new Set();
  let result = 'eligible';
  const worsen = (r) => {
    const rank = { eligible: 0, moreInfo: 1, notCovered: 2 };
    if (rank[r] > rank[result]) result = r;
  };
  const peril = d.damageType ? `ins.dmg.${d.damageType}` : null;

  // 1. Insurance status
  if (!d.insured) {
    reasons.push({ key: 'insuredMissing', tone: 'info' });
    worsen('moreInfo');
    next.add('fillMissing');
  } else if (d.insured === 'no') {
    reasons.push({ key: 'notInsured', tone: 'bad' });
    worsen('notCovered');
    next.add('relief');
  } else if (d.insured === 'unknown') {
    reasons.push({ key: 'insuredUnsure', tone: 'info' });
    worsen('moreInfo');
    next.add('checkPolicy');
  }

  if (d.insured === 'yes' || d.insured === 'unknown') {
    if (d.notified === 'no') {
      reasons.push({ key: 'notNotified', tone: 'bad' });
      worsen('notCovered');
      next.add('relief');
    } else if (d.notified === 'unknown' || !d.notified) {
      reasons.push({ key: 'notifiedUnsure', tone: 'info' });
      worsen('moreInfo');
      next.add('checkPolicy');
    }
    if (d.insured === 'yes' && d.insuredCrop && d.insuredCrop !== 'unknown' && d.cropId && d.insuredCrop !== d.cropId) {
      reasons.push({ key: 'cropMismatch', tone: 'bad', vars: { insured: cropName(d.insuredCrop), affected: cropName(d.cropId) } });
      worsen('notCovered');
    }
    const ia = Number(d.insuredArea);
    if (d.insuredArea !== '' && d.area !== '' && ia < Number(d.area)) reasons.push({ key: 'areaExceeds', tone: 'info' });
  }

  // 2. Peril & claim category
  const dl = deadlineInfo(d, now);
  const cat = dl.cat;
  const perilVars = { peril: peril ? `__T__${peril}` : '' };
  if (cat === 'localized') reasons.push({ key: 'localized', tone: 'good', vars: perilVars });
  else if (cat === 'postHarvest') reasons.push({ key: 'postHarvest', tone: 'good', vars: perilVars });
  else if (cat === 'areaBased') {
    reasons.push({ key: 'areaBased', tone: 'info', vars: perilVars });
    next.add('areaBased');
  } else if (cat === 'phNotListed') {
    reasons.push({ key: 'phNotListed', tone: 'bad', vars: perilVars });
    worsen('notCovered');
  } else if (cat === 'phNotCutSpread') {
    reasons.push({ key: 'phNotCutSpread', tone: 'bad' });
    worsen('notCovered');
  } else if (cat === 'ph14') {
    const days = Math.round((new Date(d.incidentDate) - new Date(d.harvestDate)) / DAY);
    reasons.push({ key: 'ph14', tone: 'bad', vars: { days } });
    worsen('notCovered');
  } else if (cat === 'postHarvestCheck') {
    reasons.push({ key: d.harvestDate ? 'cutSpreadUnknown' : 'harvestDateMissing', tone: 'info' });
    worsen('moreInfo');
  } else if (cat === 'localizedCheck') {
    reasons.push({ key: 'submergedUnknown', tone: 'info' });
    worsen('moreInfo');
  } else if (cat === 'needCropState') {
    reasons.push({ key: 'cropStateMissing', tone: 'info' });
    worsen('moreInfo');
  } else if (cat === 'unknownPeril') {
    // No damage type yet is reported via the missing-fields check below.
    if (d.damageType === 'other') {
      reasons.push({ key: 'otherPeril', tone: 'info' });
      next.add('askInsurer');
    }
    worsen('moreInfo');
  }

  // 3. Reporting deadline (only where it applies)
  if (dl.applies !== 'no' && dl.state !== 'noDate' && dl.state !== 'future') {
    if (dl.state === 'expired') {
      reasons.push({ key: 'deadlinePassed', tone: 'bad' });
      if (dl.applies === 'yes') worsen('notCovered');
      next.add('reportLate');
    } else {
      reasons.push({ key: 'deadlineOk', tone: 'good' });
      next.add('reportNow');
    }
  }

  // 4. Required information
  const errors = validate(d, profile, now).filter((i) => i.severity === 'error');
  if (errors.length) {
    reasons.push({ key: 'missing', tone: 'info', vars: { n: errors.length } });
    worsen('moreInfo');
    next.add('fillMissing');
  }

  if (result === 'notCovered' && d.insured === 'no') next.add('relief');
  return { result, reasons, next: [...next], cat, deadline: dl };
}

/** Ordered summary fields (order the farmer is usually asked for them). */
export function summaryFields(d, ctx) {
  const { t, profile, auth, cropName, fmtDateTime } = ctx;
  const np = t('ins.notProvided');
  const acres = (v) => (v === '' || v == null ? np : t('ins.acresHa', { ac: v, ha: (Number(v) * 0.4047).toFixed(2) }));
  const val = (v) => (v && String(v).trim() && v !== 'unknown' ? String(v).trim() : np);
  const at = incidentAt(d);
  const season = d.season ? `${t(`ins.season.${d.season}`)} ${d.year || ''}`.trim() : np;
  return [
    ['name', val(profile.name)],
    ['mobile', val(profile.phone)],
    ['village', val(d.village)],
    ['district', val(d.district)],
    ['state', val(d.state)],
    ['survey', val(d.surveyNo)],
    ['crop', d.cropId ? (d.cropId === 'other' ? val(d.cropOther) : cropName(d.cropId)) : np],
    ['season', season],
    ['insuredArea', acres(d.insuredArea)],
    ['affectedArea', acres(d.area)],
    ['damage', d.damageType ? (d.damageType === 'other' ? `${t('ins.dmg.other')}: ${val(d.otherDamage)}` : t(`ins.dmg.${d.damageType}`)) : np],
    ['when', at ? `${fmtDateTime(at)}${d.timeUnknown || !d.incidentTime ? ` (${t('ins.f.timeUnknown')})` : ''}` : np],
    ['cropState', d.cropState ? t(`ins.state.${d.cropState}`) + (d.cropState === 'harvested' && d.harvestDate ? ` – ${d.harvestDate}` : '') : np],
    ['extent', d.extent ? `${d.extent}%` : np],
    ['policy', val(d.policyId)],
    ['insurer', val(d.insurer)],
    ['description', val(d.description)],
  ].map(([key, value]) => ({ key, label: t(`ins.s.${key}`), value }));
}

/** Suggested description built from the entered facts (farmer can edit). */
export function suggestDescription(d, ctx) {
  const { t, cropName, fmtDateTime } = ctx;
  const at = incidentAt(d);
  const parts = [];
  if (d.damageType) parts.push(d.damageType === 'other' ? d.otherDamage : t(`ins.dmg.${d.damageType}`));
  if (at) parts.push(fmtDateTime(at));
  if (d.cropId) parts.push(d.cropId === 'other' ? d.cropOther : cropName(d.cropId));
  if (d.cropState) parts.push(t(`ins.state.${d.cropState}`));
  if (d.area) parts.push(t('ins.acresHa', { ac: d.area, ha: (Number(d.area) * 0.4047).toFixed(2) }));
  if (d.extent) parts.push(`${t('ins.s.extent')}: ${d.extent}%`);
  if (d.submerged === 'yes') parts.push(t('ins.f.submerged') + ' ' + t('ins.opt.yes'));
  return parts.filter(Boolean).join(' · ');
}

/** Resolve reason vars that reference translation keys (marked __T__key). */
export function resolveVars(vars, t) {
  if (!vars) return vars;
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === 'string' && v.startsWith('__T__') ? t(v.slice(5)) : v]));
}
