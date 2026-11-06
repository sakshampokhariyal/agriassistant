/**
 * Sample mandi prices, shown ONLY when live Agmarknet prices can't be loaded and nothing is saved
 * on the device (e.g. the hosted site, where data.gov.in refuses Vercel's servers).
 *
 * The levels are typical early-November modal prices (₹/quintal) for the named Karnataka APMCs,
 * in line with recent Agmarknet reports; each mandi gets a small fixed spread around that level.
 * They are labelled "Sample prices" everywhere they appear, are never cached as live data,
 * never feed the price-trend history and never reach the AI chat.
 */
import { todayISO } from '../utils/date';

/** crop → [typical modal price, scope, [market, district] …] */
const SAMPLE = {
  ragi: [3300, 'Karnataka', [['Mandya APMC', 'Mandya'], ['Mysuru APMC', 'Mysuru'], ['Bengaluru APMC', 'Bengaluru'], ['Tumakuru APMC', 'Tumakuru'], ['Hassan APMC', 'Hassan'], ['Chitradurga APMC', 'Chitradurga']]],
  paddy: [2260, 'Karnataka', [['Mandya APMC', 'Mandya'], ['Shivamogga APMC', 'Shivamogga'], ['Davangere APMC', 'Davangere'], ['Raichur APMC', 'Raichur'], ['Gangavathi APMC', 'Koppal'], ['Mysuru APMC', 'Mysuru']]],
  maize: [2150, 'Karnataka', [['Davangere APMC', 'Davangere'], ['Haveri APMC', 'Haveri'], ['Ranebennur APMC', 'Haveri'], ['APMC Hubballi', 'Dharwad'], ['Chitradurga APMC', 'Chitradurga'], ['Bagalkot APMC', 'Bagalkot']]],
  wheat: [2950, 'Karnataka', [['APMC Hubballi', 'Dharwad'], ['Belgaum APMC', 'Belagavi'], ['Vijayapura APMC', 'Vijayapura'], ['Bagalkot APMC', 'Bagalkot'], ['Gadag APMC', 'Gadag']]],
  jowar: [3350, 'Karnataka', [['APMC Hubballi', 'Dharwad'], ['Vijayapura APMC', 'Vijayapura'], ['Kalaburagi APMC', 'Kalaburagi'], ['Gadag APMC', 'Gadag'], ['Bidar APMC', 'Bidar']]],
  bajra: [2480, 'Karnataka', [['Vijayapura APMC', 'Vijayapura'], ['Bagalkot APMC', 'Bagalkot'], ['Raichur APMC', 'Raichur'], ['Ballari APMC', 'Bellary']]],
  redgram: [10100, 'Karnataka', [['Kalaburagi APMC', 'Kalaburagi'], ['Bidar APMC', 'Bidar'], ['Raichur APMC', 'Raichur'], ['Vijayapura APMC', 'Vijayapura'], ['Yadgir APMC', 'Yadgir']]],
  greengram: [8150, 'Karnataka', [['Gadag APMC', 'Gadag'], ['APMC Hubballi', 'Dharwad'], ['Kalaburagi APMC', 'Kalaburagi'], ['Bidar APMC', 'Bidar'], ['Laxmeshwar APMC', 'Gadag']]],
  blackgram: [7350, 'Karnataka', [['Bidar APMC', 'Bidar'], ['Kalaburagi APMC', 'Kalaburagi'], ['APMC Hubballi', 'Dharwad'], ['Vijayapura APMC', 'Vijayapura']]],
  cowpea: [5600, 'Karnataka', [['Bengaluru APMC', 'Bengaluru'], ['Mysuru APMC', 'Mysuru'], ['Chikkaballapur APMC', 'Chikkaballapur'], ['Tumakuru APMC', 'Tumakuru']]],
  groundnut: [6150, 'Karnataka', [['Chitradurga APMC', 'Chitradurga'], ['Challakere APMC', 'Chitradurga'], ['Tumakuru APMC', 'Tumakuru'], ['Raichur APMC', 'Raichur'], ['Hiriyur APMC', 'Chitradurga']]],
  soybean: [4650, 'Karnataka', [['Bidar APMC', 'Bidar'], ['Belgaum APMC', 'Belagavi'], ['APMC Hubballi', 'Dharwad'], ['Kalaburagi APMC', 'Kalaburagi']]],
  mustard: [6450, 'India', [['Jaipur (Grain) APMC', 'Jaipur'], ['Alwar APMC', 'Alwar'], ['Bharatpur APMC', 'Bharatpur'], ['Kota APMC', 'Kota']]],
  cotton: [7350, 'Karnataka', [['Raichur APMC', 'Raichur'], ['APMC Hubballi', 'Dharwad'], ['Ballari APMC', 'Bellary'], ['Haveri APMC', 'Haveri'], ['Chitradurga APMC', 'Chitradurga']]],
  tomato: [1650, 'Karnataka', [['Kolar APMC', 'Kolar'], ['Chikkaballapur APMC', 'Chikkaballapur'], ['Binny Mill (F&V) Bengaluru', 'Bengaluru'], ['Mysuru APMC', 'Mysuru'], ['Chintamani APMC', 'Chikkaballapur']]],
  pepper: [66500, 'Karnataka', [['Sirsi APMC', 'Uttara Kannada'], ['Madikeri APMC', 'Kodagu'], ['Sakleshpur APMC', 'Hassan'], ['Mudigere APMC', 'Chikkamagaluru']]],
};

/** Fixed spread per mandi, so the same crop always shows the same believable spread. */
const SPREAD = [1.04, 1.0, 0.97, 1.02, 0.95, 0.99];
const round10 = (n) => Math.round(n / 10) * 10;

/** Sample rows shaped like Agmarknet rows (highest modal first), or null for crops without samples. */
export function samplePrices(cropId) {
  const s = SAMPLE[cropId];
  if (!s) return null;
  const [base, scope, markets] = s;
  const [y, m, d] = todayISO().split('-');
  const rows = markets
    .map(([market, district], i) => {
      const modal = round10(base * SPREAD[i % SPREAD.length]);
      return {
        id: `sample-${cropId}-${i}`,
        market,
        district,
        state: scope === 'India' ? 'Rajasthan' : 'Karnataka',
        variety: '',
        commodity: '',
        date: `${d}/${m}/${y}`,
        min: round10(modal * 0.92),
        max: round10(modal * 1.06),
        modal,
      };
    })
    .sort((a, b) => b.modal - a.modal);
  return { rows, scope };
}
