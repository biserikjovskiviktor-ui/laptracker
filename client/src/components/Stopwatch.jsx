import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { formatTime, calculateGap } from '../utils/formatTime';
import { getWeatherIcon } from '../utils/helpers';

const Stopwatch = () => {
  const [tracks, setTracks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState({ track: '', car: '' });
  const [pb, setPb] = useState(null);
  const [weather, setWeather] = useState({ text: 'Вчитување на временски услови...', icon: 'fa-question' });
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [result, setResult] = useState(null);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { trackId, targetTime } = location.state || {};

  // 1. Initial Load: Fetch tracks and vehicles
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tRes, vRes] = await Promise.all([api.get('/tracks'), api.get('/vehicles')]);
        setTracks(tRes.data);
        setVehicles(vRes.data);
      } catch (err) {
        console.error("Failed to load resources:", err);
      }
    };
    loadData();
  }, []);

  // 2. Handle Navigation Context (Target Time from Leaderboard)
  useEffect(() => {
    if (trackId) {
      setSelected(prev => ({ ...prev, track: trackId }));
      if (targetTime) {
        setPb(targetTime);
      }
    }
  }, [trackId, targetTime]);

  // Reusable function to fetch Personal Best
  const fetchPersonalBest = useCallback((trackId, carId) => {
    if (!trackId || !carId) return;
    api.get(`/runs/pb/${trackId}/${carId}`)
      .then(res => setPb(res.data?.bestTime || null))
      .catch(() => setPb(null));
  }, []);

  // 3. Fetch PB & Weather when selection changes
  useEffect(() => {
    if (selected.track && selected.car) {
      // If we came from the leaderboard with a targetTime, keep it initially. 
      // Once the user manually changes the car or track, targetTime from location state is ignored and DB is checked.
      if (!targetTime || selected.track !== trackId) {
        fetchPersonalBest(selected.track, selected.car);
      }
      
      // Fetch Weather
      const track = tracks.find(t => t._id === selected.track);
      if (track) {
        const apiKey = 'a4d752f23f10ecaa556da8b11b6e8eb5';
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${track.location},${track.countryCode}&appid=${apiKey}&units=metric`)
          .then(res => res.json())
          .then(data => {
            const mainCondition = data.weather[0].main;
            const description = data.weather[0].description;
            const cloudCover = data.clouds?.all || 0;
            
            let condition = mainCondition;
            if (mainCondition === 'Clouds' && cloudCover < 20) {
              condition = 'Clear';
            }

            const formattedDescription = description.charAt(0).toUpperCase() + description.slice(1);

            setWeather({
              text: `${formattedDescription}, ${Math.round(data.main.temp)}°C`,
              icon: getWeatherIcon(condition)
            });
          })
          .catch(() => setWeather({ text: "Нема податоци", icon: 'fa-question' }));
      }
    }
  }, [selected.track, selected.car, tracks, fetchPersonalBest, targetTime, trackId]);

  // 4. Timer Logic
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
      await api.post('/runs', {
        trackId: selected.track,
        carId: selected.car,
        runTime: timer,
        weatherInfo: weather.text
      });
      alert("Резултатот е зачуван!");
      
      // Re-read and update the personal best immediately after saving
      fetchPersonalBest(selected.track, selected.car);

      setResult(null);
      setTimer(0);
    } catch (err) {
      alert("Грешка при зачувување на резултатот.");
    }
  };

  const resetTimer = () => {
    setResult(null);
    setTimer(0);
  };

  return (
    <div className="container-fluid text-center py-4 text-white">
      <h2 className="mb-3 fw-bold text-uppercase">Мерење на Време</h2>

      <div className="row g-3 justify-content-center mb-4">
        <div className="col-md-3">
          <div className="text-white text-uppercase fw-bold mb-1">Track</div>
          <select 
            className="form-select bg-dark text-white border-secondary" 
            value={selected.track}
            onChange={(e) => setSelected({...selected, track: e.target.value})}
          >
            <option value="" disabled>Избери Патека</option>
            {tracks.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>

        <div className="col-md-3">
          <div className="text-white text-uppercase fw-bold mb-1">Car</div>
          <select 
            className="form-select bg-dark text-white border-secondary" 
            value={selected.car}
            onChange={(e) => setSelected({...selected, car: e.target.value})}
          >
            <option value="" disabled>Избери Возило</option>
            {vehicles.map(v => <option key={v._id} value={v._id}>{v.make} {v.model}</option>)}
          </select>
        </div>

        {/* Fixed Time to Beat Box */}
        <div className="col-md-3">
          <div className="text-white text-uppercase fw-bold mb-1 opacity-0">Info</div>
          <div className="card bg-black border border-warning text-dark p-3 h-100 fw-bold d-flex justify-content-center">
            <p className="mb-0 text-secondary text-uppercase fw-bold small">Time to beat</p>
            <h5 className="m-0 text-warning fw-bold">{pb ? formatTime(pb) : '--:--:--.---'}</h5>
          </div>
        </div>

        {/* Fixed Weather Box */}
        <div className="col-md-3">
          <div className="text-white text-uppercase fw-bold mb-1 opacity-0">Weather</div>
          <div className="card bg-black border border-primary text-secondary fw-bold d-flex align-items-center justify-content-center p-3 h-100">
            <div>
              <i className={`fas ${weather.icon} me-2`}></i>
              <span>{weather.text}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Countdown / Timer Display with Fixed Min-Height Container */}
      <div style={{ minHeight: '130px' }} className="d-flex flex-column justify-content-center align-items-center my-3">
        {countdown !== null ? (
          <div className="display-1 fw-bold text-warning">{countdown}</div>
        ) : (
          <div className="bg-black border border-warning rounded p-4 shadow-lg w-100" style={{ maxWidth: '600px' }}>
            <div className="display-4 text-warning fw-bold">{formatTime(timer)}</div>
          </div>
        )}
      </div>

      <div className="text-center my-4">
        {!isRunning && !result && (
          <button className="btn btn-lg btn-success px-5 fw-bold text-uppercase" onClick={startCountdown}>START</button>
        )}
        {isRunning && (
          <button className="btn btn-lg btn-danger px-5 fw-bold text-uppercase" onClick={stopTimer}>STOP</button>
        )}
      </div>

      {result && (
        <div className="card bg-black border border-secondary p-4 my-4 shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
          <h5 className="text-uppercase text-warning fw-bold mb-3">Резултат од Рундата</h5>
          <div className="row g-3 text-center mb-4">
            <div className="col-6">
              <div className="bg-dark p-2 rounded border border-secondary">
                <small className="text-secondary d-block">Твое време</small>
                <div className="h4 text-light">{formatTime(result)}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="bg-dark p-2 rounded border border-secondary">
                <small className="text-secondary d-block">Time to beat</small>
                <div className="h4 text-info">{pb ? formatTime(pb) : 'N/A'}</div>
              </div>
            </div>
          </div>

          {pb && (
            <div className="row g-3 text-center mb-4">
              <div className="bg-dark p-2 rounded border border-secondary">
                <small className="text-secondary d-block">Разлика</small>
                <div className={`h1 fw-bold ${result > pb ? "text-danger" : "text-success"}`}>
                  {calculateGap(result, pb)}
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-success fw-bold text-uppercase" onClick={saveRun}>Зачувај Време</button>
            <button className="btn btn-outline-danger fw-bold text-uppercase" onClick={resetTimer}>Откажи</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stopwatch;