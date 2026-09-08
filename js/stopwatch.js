import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatTime, formatToMs, calculateGap } from '../utils/formatTime';
import { getWeatherIcon } from '../utils/helpers';

const Stopwatch = () => {
  const [tracks, setTracks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState({ track: '', car: '' });
  const [pb, setPb] = useState(null);
  const [weather, setWeather] = useState({ text: 'Избери патека...', icon: 'fa-question' });
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [result, setResult] = useState(null);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // 1. Initial Load
  useEffect(() => {
    Promise.all([axios.get('/api/tracks'), axios.get('/api/vehicles')])
      .then(([tRes, vRes]) => { 
        setTracks(tRes.data); 
        setVehicles(vRes.data); 
      });
  }, []);

  // 2. Fetch PB & Weather when selection changes
  useEffect(() => {
    if (selected.track && selected.car) {
      // Fetch PB
      axios.get(`/api/runs/pb/${selected.track}/${selected.car}`)
        .then(res => setPb(res.data?.bestTime || null));
      
      // Fetch Weather
      const track = tracks.find(t => t._id === selected.track);
      if (track) {
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${track.location},${track.countryCode}&appid=a4d752f23f10ecaa556da8b11b6e8eb5&units=metric`)
          .then(res => {
            const condition = res.data.weather[0].main;
            setWeather({
              text: `${condition}, ${Math.round(res.data.main.temp)}°C`,
              icon: getWeatherIcon(condition)
            });
          })
          .catch(() => setWeather({ text: "Нема податоци", icon: 'fa-question' }));
      }
    }
  }, [selected.track, selected.car, tracks]);

  // 3. Timer Logic
  const startCountdown = () => {
    if (!selected.track || !selected.car) return alert("Избери патека и кола!");
    let count = 3;
    setCountdown(count);
    const cd = setInterval(() => {
      count -= 1;
      if (count > 0) setCountdown(count);
      else {
        clearInterval(cd);
        setCountdown(null);
        setIsRunning(true);
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(() => setTimer(Date.now() - startTimeRef.current), 10);
      }
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setResult(timer);
  };

  const saveRun = async () => {
    try {
      await axios.post('/api/runs', {
        userId: localStorage.getItem('userId'),
        trackId: selected.track,
        carId: selected.car,
        runTime: timer,
        weatherInfo: weather.text
      });
      alert("Зачувано!");
      setResult(null);
      setTimer(0);
    } catch (err) { alert("Грешка при зачувување!"); }
  };

  return (
    <div className="container py-4 text-center">
      <div className="row g-3 justify-content-center mb-4">
        <select className="form-select w-25" onChange={(e) => setSelected({...selected, track: e.target.value})}>
          <option value="">Избери Патека</option>
          {tracks.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select className="form-select w-25" onChange={(e) => setSelected({...selected, car: e.target.value})}>
          <option value="">Избери Возило</option>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.make} {v.model}</option>)}
        </select>
      </div>

      <div className="mb-3">
        <i className={`fas ${weather.icon} me-2`}></i> {weather.text}
        {pb && <div className="text-warning">PB: {formatTime(pb)}</div>}
      </div>

      <div className="display-1">{countdown !== null ? countdown : formatTime(timer)}</div>

      {!isRunning && !result && <button className="btn btn-success btn-lg" onClick={startCountdown}>START</button>}
      {isRunning && <button className="btn btn-danger btn-lg" onClick={stopTimer}>STOP</button>}

      {result && (
        <div className="mt-4 card p-3 bg-dark text-white border-warning">
          <h4>Резултат: {formatTime(result)}</h4>
          {pb && <p>Разлика: <span className={result > pb ? "text-danger" : "text-success"}>{calculateGap(result, pb)}</span></p>}
          <button className="btn btn-primary" onClick={saveRun}>Зачувај</button>
        </div>
      )}
    </div>
  );
};

export default Stopwatch;