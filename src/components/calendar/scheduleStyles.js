/** Colour tokens for crop-calendar task types and statuses (shared by the calendar and Home card). */
export const TYPE_STYLE = {
  nursery: { chip: 'bg-lime-100 text-forest-800' },
  sowing: { chip: 'bg-moss-100 text-moss-600' },
  transplanting: { chip: 'bg-emerald-100 text-emerald-800' },
  fertilizer: { chip: 'bg-amber-100 text-amber-800' },
  weeding: { chip: 'bg-forest-100 text-forest-800' },
  irrigation: { chip: 'bg-navy-100 text-navy-500' },
  protection: { chip: 'bg-navy-100 text-navy-800' },
  caution: { chip: 'bg-red-100 text-red-800' },
  harvest: { chip: 'bg-clay-100 text-clay-600' },
  other: { chip: 'bg-cream-200 text-forest-700' },
};

export const STATUS_STYLE = {
  done: 'bg-emerald-100 text-emerald-800',
  today: 'bg-amber-100 text-amber-800',
  upcoming: 'bg-navy-100 text-navy-500',
  overdue: 'bg-red-100 text-red-800',
};
