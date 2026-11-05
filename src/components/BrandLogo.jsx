import { APP_NAME, LOGO } from '../config/brand';

/** Circular emblem (sprout + hands). Raster at 256 px, so it stays crisp up to ~85 px at 3× DPR. */
export function LogoMark({ className = 'h-9 w-9' }) {
  return <img src={LOGO.mark} alt="" aria-hidden width="256" height="256" decoding="async" className={`shrink-0 select-none ${className}`} draggable="false" />;
}

/**
 * "AGRI" + "SAHAYA" wordmark in the logo's two colours.
 * `light` swaps the navy half to cream for dark surfaces (navy would disappear there).
 */
export function Wordmark({ light = false, className = '' }) {
  const split = APP_NAME.toUpperCase().match(/^(AGRI)(.*)$/) || [null, APP_NAME, ''];
  return (
    <span className={`font-extrabold tracking-[0.04em] leading-none ${className}`}>
      <span className={light ? 'text-brand-leaf' : 'text-brand-green'}>{split[1]}</span>
      <span className={light ? 'text-cream-50' : 'text-brand-navy'}>{split[2]}</span>
    </span>
  );
}

/** Emblem + wordmark + optional tagline – used in sidebar, top bar, drawer, sign-in and footer. */
export default function BrandLogo({ light = false, size = 'md', tagline, compact = false, className = '' }) {
  const s = {
    sm: { mark: 'h-8 w-8', word: 'text-base', tag: 'text-[10px]' },
    md: { mark: 'h-10 w-10', word: 'text-lg sm:text-xl', tag: 'text-[11px]' },
    lg: { mark: 'h-16 w-16', word: 'text-2xl', tag: 'text-xs' },
  }[size];
  return (
    <span className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <LogoMark className={s.mark} />
      <span className={`leading-tight whitespace-nowrap min-w-0 ${compact ? 'hidden min-[400px]:block' : 'block'}`}>
        <Wordmark light={light} className={`block ${s.word}`} />
        {tagline && (
          <span className={`block mt-1 font-medium whitespace-normal leading-snug ${s.tag} ${light ? 'text-brand-gold-light/90' : 'text-brand-navy-dark/80'}`}>{tagline}</span>
        )}
      </span>
    </span>
  );
}
