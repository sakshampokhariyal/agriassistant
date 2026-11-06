import { Sun, CloudSun, Cloud, CloudRain, CloudLightning, CloudDrizzle } from 'lucide-react';

const map = {
  sunny: { Icon: Sun, color: 'text-earth-400' },
  partly: { Icon: CloudSun, color: 'text-earth-400' },
  cloudy: { Icon: Cloud, color: 'text-forest-300' },
  rain: { Icon: CloudDrizzle, color: 'text-navy-500' },
  heavyRain: { Icon: CloudRain, color: 'text-navy-500' },
  thunder: { Icon: CloudLightning, color: 'text-earth-500' },
};

export default function WeatherIcon({ cond, size = 28, className = '', tinted = true }) {
  const { Icon, color } = map[cond] || map.partly;
  return <Icon size={size} className={`${tinted ? color : ''} ${className}`} aria-hidden />;
}
