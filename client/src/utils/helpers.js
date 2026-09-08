export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('mk-MK');
};

export const getWeatherIcon = (condition) => {
  if (!condition) return 'bi-question-circle';
  
  // Convert to lowercase to make it case-insensitive
  const cond = condition.toLowerCase();

  if (cond.includes('clear') || cond.includes('sun')) return 'bi-sun-fill text-warning';
  
  // Specific cloud variations
  if (cond.includes('few clouds') || cond.includes('scattered clouds')) return 'bi-cloud-sun-fill text-warning';
  if (cond.includes('broken clouds') || cond.includes('overcast')) return 'bi-clouds-fill text-secondary';
  if (cond.includes('cloud')) return 'bi-cloud-fill text-secondary';
  
  if (cond.includes('rain') || cond.includes('shower')) return 'bi-cloud-rain-heavy-fill text-info';
  if (cond.includes('drizzle')) return 'bi-cloud-rain text-info';
  if (cond.includes('thunder') || cond.includes('storm')) return 'bi-lightning-fill text-warning';
  if (cond.includes('snow')) return 'bi-snow text-info';
  if (cond.includes('mist') || cond.includes('fog') || cond.includes('haze')) return 'bi-cloud-fog2-fill text-secondary';
  
  return 'bi-question-circle';
};

export const formatEngine = (cc) => {
  return `${(parseFloat(cc) / 1000).toFixed(1)}L`;
};

export const getRankStyle = (rank) => {
  const styles = {
    'S': { color: '#ffcc00', icon: 'bi bi-award-fill' },
    'A': { color: '#ff4d4d', icon: 'bi bi-lightning-charge-fill' },
    'B': { color: '#4dff4d', icon: 'bi bi-shield-fill' },
    'C': { color: '#4d94ff', icon: 'bi bi-car-front-fill' },
    'D': { color: '#cccccc', icon: 'bi bi-circle-fill' },
    'E': { color: '#888888', icon: 'bi bi-circle' }
  };
  return styles[rank] || { color: '#ffffff', icon: 'bi bi-question-circle' };
};

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);