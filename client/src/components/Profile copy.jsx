import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api/axiosConfig';
import { formatTime } from '../utils/formatTime';
import { getRankStyle } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for Add Vehicle Modal
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: '', engineDisplacement: '', hp: '' });
  
  // States for Add Track Modal
  const [countries, setCountries] = useState([]);
  const [trackForm, setTrackForm] = useState({ name: '', location: '', countryCode: '', length: '', surface: '' });
  const [submittingTrack, setSubmittingTrack] = useState(false);

useEffect(() => {
    fetchProfileData();

    const loadCountries = async () => {
      try {
        // Calls your backend, which safely fetches from the external API server-side
        const response = await api.get('/external-countries');
        const countries = response.data;
        
        if (Array.isArray(countries)) {
          countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
          setCountries(countries);
        }
      } catch (err) {
        console.error("Could not load countries", err);
      }
    };

    loadCountries();
  }, []);

  const fetchProfileData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError("Please log in to view your profile.");
        setLoading(false);
        return;
      }

      const { data } = await api.get(`/profile/${userId}`);
      setProfile({
        user: data.user || {},
        vehicles: data.vehicles || [],
        tracks: data.tracks || [],
        runs: data.runs || []
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Vehicle
  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehicleForm(prev => ({ ...prev, [name]: value }));
  };

  const calculateRank = (hp) => {
    const h = parseInt(hp);
    if (isNaN(h) || h <= 0) return '-';
    return h >= 1000 ? 'S' : h >= 600 ? 'A' : h >= 400 ? 'B' : h >= 250 ? 'C' : h >= 150 ? 'D' : 'E';
  };

  const currentRank = calculateRank(vehicleForm.hp);
  const rankStyle = getRankStyle(currentRank);

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    const rawLiters = parseFloat(vehicleForm.engineDisplacement) / 1000;
    const roundedLiters = Number(rawLiters.toFixed(1));

    const payload = {
      ...vehicleForm,
      engineDisplacement: roundedLiters,
      carRank: currentRank
    };

    try {
      await api.post('/vehicles', payload);
      alert("Возилото е успешно додадено!");
      
      // Programmatically hide modal & clean backdrop
      const modalEl = document.getElementById('vehicleModal');
      const modal = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
      modal.hide();
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

      setVehicleForm({ make: '', model: '', year: '', engineDisplacement: '', hp: '' });
      fetchProfileData();
    } catch (err) {
      alert("Грешка: " + (err.response?.data?.error || err.message));
    }
  };

  // Handlers for Track
const handleTrackChange = (e) => {
    const { name, value } = e.target; // Change 'id' to 'name'
    setTrackForm(prev => ({ ...prev, [name]: value }));
  };

const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackForm.name || !trackForm.location || !trackForm.countryCode) {
      return alert("Ве молиме пополнете ги сите задолжителни полиња!");
    }

    setSubmittingTrack(true);
    try {
      await api.post('/tracks', trackForm);
      alert("Патеката е успешно додадена!");
      
      const modalEl = document.getElementById('trackModal');
      const modal = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
      modal.hide();
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

      setTrackForm({ name: '', location: '', countryCode: '', length: '', surface: '' });
      fetchProfileData();
    } catch (err) {
      alert("Грешка при зачувување: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingTrack(false);
    }
  };
  // Deletion Handlers
  const deleteVehicle = async (id) => {
    if (!window.confirm("Сигурно сакаш да го избришеш ова возило?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setProfile(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v._id !== id) }));
    } catch (err) {
      alert("Грешка при бришење.");
    }
  };

  const deleteTrack = async (id) => {
    if (!window.confirm("Сигурно сакаш да го избришеш ова место?")) return;
    try {
      await api.delete(`/tracks/${id}`);
      setProfile(prev => ({ ...prev, tracks: prev.tracks.filter(t => t._id !== id) }));
    } catch (err) {
      alert("Грешка при бришење.");
    }
  };

  const deleteRun = async (id) => {
    if (!window.confirm("Сигурно сакаш да го избришеш ова време?")) return;
    try {
      await api.delete(`/runs/${id}`);
      setProfile(prev => ({ ...prev, runs: prev.runs.filter(r => r._id !== id) }));
    } catch (err) {
      alert("Грешка при бришење.");
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-5">Loading profile...</div>;
  }

  if (error || !profile) {
    return <div className="text-danger text-center mt-5">{error || "Profile data unavailable."}</div>;
  }

  const { user, vehicles, tracks, runs } = profile;

  const sortedRuns = [...runs].reverse();
  const chartData = {
    labels: sortedRuns.map((_, index) => `Run ${index + 1}`),
    datasets: [{
      label: 'Време',
      data: sortedRuns.map(r => r.runTime),
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
      tension: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        reverse: true,
        ticks: { callback: (value) => formatTime(value) }
      }
    },
    plugins: {
      tooltip: {
        callbacks: { label: (context) => 'Време: ' + formatTime(context.raw) }
      }
    }
  };

  return (
    <div className="container-fluid py-4 text-white">
      <div className="row">
        <div className="col-md-3">
          <div className="card bg-dark text-white p-3 border-warning">
            <div className="text-center">
              <i className="bi bi-person-square text-warning" style={{ fontSize: '5rem' }}></i>
            </div>
            <div className="text-center mt-2">
              <h4 id="userName" className="text-light">{user.username || 'Корисник'}</h4>
              <p id="userEmail" className="text-secondary">{user.email || 'email@example.com'}</p>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          <div className="row">
            {/* Garage Section */}
            <div className="col-md-6">
              <h3>Гаража</h3>
              <div id="garageList" className="d-flex flex-column gap-2 mb-3">
                {vehicles.length > 0 ? (
                  vehicles.map(v => (
                    <div key={v._id} className="card bg-secondary text-white p-2 mb-2 d-flex flex-row align-items-center justify-content-between">
                      <span>{v.make} {v.model} ({v.year}) - {v.engineDisplacement} L - {v.hp} HP [{v.carRank}]</span>
                      <button className="btn btn-sm btn-danger ms-auto" onClick={() => deleteVehicle(v._id)}>X</button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Нема додадени возила.</p>
                )}
              </div>
              <button 
              type="button"
              className="btn btn-primary" 
              onClick={() => {
                const modalElement = document.getElementById('vehicleModal');
                const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalElement);
                modalInstance.show();
              }}
            >
              Креирај Возило
            </button>
            </div>

            {/* Tracks Section */}
            <div className="col-md-6">
              <h3>Твои Патеки</h3>
              <div id="tracksList" className="d-flex flex-column gap-2 mb-3">
                {tracks.length > 0 ? (
                  tracks.map(t => (
                    <div key={t._id} className="card bg-secondary text-white p-2 mb-2 d-flex flex-row align-items-center justify-content-between">
                      <span>{t.name}</span>
                      <button className="btn btn-sm btn-danger ms-auto" onClick={() => deleteTrack(t._id)}>X</button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Нема додадени патеки.</p>
                )}
              </div>
              <button 
              type="button"
              className="btn btn-primary" 
              onClick={() => {
                const modalElement = document.getElementById('trackModal');
                const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalElement);
                modalInstance.show();
              }}
            >
              Креирај Патека
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="row mt-5">
        <div className="col-12">
          <h3>Статистика (Графикон)</h3>
          {runs.length > 0 ? (
            <>
              <div className="bg-dark p-3 rounded mb-4">
                <Line data={chartData} options={chartOptions} />
              </div>
              
              <h3 className="mt-4">Историја на времиња</h3>
              <table className="table table-dark table-hover">
                <thead>
                  <tr><th>Патека</th><th>Возило</th><th>Време</th><th>Акции</th></tr>
                </thead>
                <tbody id="myRunsList">
                  {runs.map(r => (
                    <tr key={r._id}>
                      <td>{r.trackId?.name || 'Unknown'}</td>
                      <td>{r.carId?.model || 'Unknown'}</td>
                      <td>{formatTime(r.runTime)}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRun(r._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-muted">Нема снимени вожњи.</p>
          )}
        </div>
      </div>

{/* --- POPUP MODAL: Add Vehicle --- */}
      <div className="modal fade" id="vehicleModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content bg-dark text-light border border-warning">
            <div className="modal-header border-warning">
              <h5 className="modal-title text-warning">Add New Vehicle</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="closeVehicleModal"></button>
            </div>
            <form onSubmit={handleVehicleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Make</label>
                  <input type="text" name="make" value={vehicleForm.make} className="form-control bg-black text-white" required onChange={handleVehicleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Model</label>
                  <input type="text" name="model" value={vehicleForm.model} className="form-control bg-black text-white" required onChange={handleVehicleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Year</label>
                  <input type="number" name="year" value={vehicleForm.year} className="form-control bg-black text-white" required onChange={handleVehicleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Engine Displacement (cc)</label>
                  <input type="number" name="engineDisplacement" value={vehicleForm.engineDisplacement} className="form-control bg-black text-white" placeholder="e.g. 1300" required onChange={handleVehicleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Horsepower (HP)</label>
                  <input type="number" name="hp" value={vehicleForm.hp} className="form-control bg-black text-white" required onChange={handleVehicleChange} />
                </div>
                <div className="mb-3 text-center">
                  <span className="badge p-2 fs-6" style={rankStyle}>
                    Calculated Rank: {currentRank}
                  </span>
                </div>
              </div>
              <div className="modal-footer border-warning">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="submit" className="btn btn-success">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* --- POPUP MODAL: Add Track --- */}
      <div className="modal fade" id="trackModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content bg-dark text-light border border-warning">
            <div className="modal-header border-warning">
              <h5 className="modal-title text-warning">Add New Track</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="closeTrackModal"></button>
            </div>
            <form onSubmit={handleTrackSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Track Name</label>
                  <input type="text" name="name" value={trackForm.name} className="form-control bg-black text-white" required onChange={handleTrackChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">City / Location</label>
                  <input type="text" name="location" value={trackForm.location} className="form-control bg-black text-white" required onChange={handleTrackChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Country</label>
                  <select name="countryCode" value={trackForm.countryCode} className="form-select bg-black text-white" required onChange={handleTrackChange}>
                    <option value="">Select a country...</option>
                    {countries.map(c => <option key={c.cca2} value={c.cca2}>{c.name.common}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Length (km)</label>
                  <input type="number" name="length" step="0.01" value={trackForm.length} className="form-control bg-black text-white" required onChange={handleTrackChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Surface Type</label>
                  <select name="surface" value={trackForm.surface} className="form-select bg-black text-white" required onChange={handleTrackChange}>
                    <option value="">Select a surface...</option>
                    {['Asphalt', 'Gravel', 'Sand', 'Dirt', 'Ice', 'Snow'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer border-warning">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="submit" className="btn btn-success" disabled={submittingTrack}>
                  {submittingTrack ? 'Saving...' : 'Save Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;