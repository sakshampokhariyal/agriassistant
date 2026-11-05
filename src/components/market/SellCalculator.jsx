import { useEffect, useMemo, useState } from 'react';
import { Calculator, IndianRupee } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TRANSPORT_PER_KM, marketCrops, todayPrices } from '../../data/markets';
import { fmtNum } from '../../utils/date';
import { Field, SectionTitle } from '../ui';

/** Selling price calculator: quantity × price − transport − commission − handling = estimated net income. */
export default function SellCalculator({ cropId: initialCrop = 'ragi', live = null }) {
  const { t, L, lang } = useApp();
  const [cropId, setCropId] = useState(initialCrop);
  const [mandiId, setMandiId] = useState('');
  const [unit, setUnit] = useState('q'); // q | kg
  const [qty, setQty] = useState('20');
  const [price, setPrice] = useState('');
  const [transport, setTransport] = useState('');
  const [commission, setCommission] = useState('2');
  const [handling, setHandling] = useState('20');

  useEffect(() => setCropId(initialCrop), [initialCrop]);

  // Live Agmarknet markets when available for this crop, otherwise the demo mandis.
  const isLive = !!(live && live.cropId === cropId && live.source !== 'mock' && live.rows?.length);
  const options = useMemo(
    () =>
      isLive
        ? live.rows.slice(0, 40).map((r) => ({ id: r.id, label: `${r.market}${r.district ? `, ${r.district}` : ''}`, modal: r.modal, km: null }))
        : todayPrices(cropId).map((r) => ({ id: r.id, label: `${L(r.name)} (${r.km} ${t('market.km')})`, modal: r.modal, km: r.km })),
    [isLive, live, cropId, L, t]
  );
  const row = options.find((o) => o.id === mandiId) || options[0];
  const quintals = (Number(qty) || 0) / (unit === 'kg' ? 100 : 1);

  // Defaults follow the chosen crop/mandi until the farmer types their own values.
  useEffect(() => {
    if (row) setPrice(String(row.modal));
  }, [row?.id, row?.modal]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (row?.km != null) setTransport(String(Math.round(row.km * TRANSPORT_PER_KM * quintals)));
  }, [row?.id, row?.km, quintals]); // eslint-disable-line react-hooks/exhaustive-deps

  const gross = quintals * (Number(price) || 0);
  const transportCost = Number(transport) || 0;
  const commissionCost = (gross * (Number(commission) || 0)) / 100;
  const handlingCost = quintals * (Number(handling) || 0);
  const net = gross - transportCost - commissionCost - handlingCost;
  const rs = (v) => `₹${fmtNum(Math.round(v), lang)}`;

  return (
    <section className="card p-5">
      <SectionTitle icon={Calculator}>{t('mk.calc')}</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t('market.crop')}>
          <select className="input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
            {Object.entries(marketCrops).map(([id, c]) => <option key={id} value={id}>{L(c.name)}</option>)}
          </select>
        </Field>
        <Field label={t('market.mandi')}>
          <select className="input" value={row?.id || ''} onChange={(e) => setMandiId(e.target.value)}>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <span className={`mt-1 block text-xs ${isLive ? 'text-emerald-700' : 'text-earth-700'}`}>{isLive ? t('mk.calc.livePrice') : t('mk.calc.demoPrice')}</span>
        </Field>
        <Field label={t('mk.qty')}>
          <div className="flex gap-2">
            <input className="input" type="number" min="0" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            <div className="flex rounded-xl bg-cream-100 p-1 shrink-0" role="radiogroup" aria-label={t('mk.unit')}>
              {['q', 'kg'].map((u) => (
                <button key={u} role="radio" aria-checked={unit === u} onClick={() => setUnit(u)} className={`px-3 rounded-lg text-sm font-semibold ${unit === u ? 'bg-white text-forest-900 shadow-sm' : 'text-forest-600'}`}>
                  {t(`mk.unit.${u}`)}
                </button>
              ))}
            </div>
          </div>
        </Field>
        <Field label={`${t('mk.price')} (${t('market.perQ')})`}>
          <input className="input" type="number" min="0" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label={`${t('mk.transport')} (₹)`}>
          <input className="input" type="number" min="0" inputMode="numeric" value={transport} onChange={(e) => setTransport(e.target.value)} />
          {row?.km == null && <span className="mt-1 block text-xs text-forest-600">{t('mk.calc.enterTransport')}</span>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t('mk.commission')} (%)`}>
            <input className="input" type="number" min="0" step="0.1" inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} />
          </Field>
          <Field label={`${t('mk.handling')} (₹/q)`}>
            <input className="input" type="number" min="0" inputMode="numeric" value={handling} onChange={(e) => setHandling(e.target.value)} />
          </Field>
        </div>
      </div>

      <dl className="mt-5 rounded-2xl bg-cream-100 p-4 space-y-1.5 text-sm">
        <Row label={`${t('mk.gross')} (${quintals.toFixed(2)} q × ₹${fmtNum(Number(price) || 0, lang)})`} value={rs(gross)} />
        <Row label={`− ${t('mk.transport')}`} value={rs(transportCost)} minus />
        <Row label={`− ${t('mk.commission')} (${commission || 0}%)`} value={rs(commissionCost)} minus />
        <Row label={`− ${t('mk.handling')}`} value={rs(handlingCost)} minus />
        <div className="border-t border-black/10 pt-2 mt-2 flex items-end justify-between gap-3">
          <dt className="font-semibold text-forest-900">{t('mk.net')}</dt>
          <dd className={`text-3xl font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{rs(net)}</dd>
        </div>
        {quintals > 0 && (
          <p className="text-xs text-forest-600 text-right flex items-center justify-end gap-1">
            <IndianRupee size={12} /> {fmtNum(Math.round(net / quintals), lang)} {t('mk.netPerQ')}
          </p>
        )}
      </dl>
      <p className="text-xs text-forest-600/80 mt-2">{t('mk.calcNote')}</p>
    </section>
  );
}

function Row({ label, value, minus }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-forest-700">{label}</dt>
      <dd className={minus ? 'text-red-700' : 'font-semibold text-forest-900'}>{value}</dd>
    </div>
  );
}
