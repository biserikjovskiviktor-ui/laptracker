// Export individual functions so you can import only what you need
export const formatToMs = (str) => {
  if (!str || typeof str !== 'string') return 0;
  const parts = str.split(/[:.]/);
  const [h, m, s, ms] = parts.map(Number);
  return (h * 3600000) + (m * 60000) + (s * 1000) + (ms || 0);
};

export const formatTime = (ms) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msPart = ms % 1000;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msPart.toString().padStart(3, '0')}`;
};

export const calculateGap = (time1, time2) => {
  const diff = Math.abs(time1 - time2);
  const prefix = time1 > time2 ? '+' : '-';
  return `${prefix}${formatTime(diff)}`;
};