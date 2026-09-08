import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { formatTime } from '../utils/formatTime';

const AdminPanel = () => {
  const [data, setData] = useState({ users: [], vehicles: [], tracks: [], runs: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await api.get('/db/data'); // Changed from /admin/data to /db/data
      setData(response.data);
    } catch (err) { 
      console.error("Error fetching admin data", err); 
    }
  };

  const handleAction = async (action) => {
    if (action === 'clear' && !window.confirm("Ова ќе ја избрише целата база. Сигурни сте?")) return;
    setLoading(true);
    try {
      await api.post(`/db/${action}`);
      alert("Операцијата е успешна!");
      fetchAdminData();
    } catch (err) { 
      alert("Грешка: " + (err.response?.data?.error || err.message)); 
    } finally {
      setLoading(false);
    }
  };
  const handleResetDatabase = async () => {
    try {
      await api.post('/db/reset'); // Make sure it points to /db/reset
      alert("Database wiped successfully!");
      window.location.reload();
    } catch (err) {
      alert("Reset failed: " + (err.response?.data?.error || err.message));
    }
  };
  // Individual Delete Handlers
  const handleDelete = async (endpoint, id, stateKey) => {
    if (!window.confirm("Сигурни сте дека сакате да го избришете ова?")) return;
    try {
      await api.delete(`/${endpoint}/${id}`);
      setData(prev => ({
        ...prev,
        [stateKey]: prev[stateKey].filter(item => item._id !== id)
      }));
    } catch (err) {
      alert("Грешка при бришење: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container-fluid py-4 text-white">
      <h2 className="text-warning text-center mb-4">Администраторски Панел</h2>

      <div className="card bg-dark p-3 mb-4 text-center border-warning shadow-lg">
        <h5>Управување со База</h5>
        <div className="d-flex justify-content-center gap-3 mt-2">
          <button className="btn btn-outline-primary" onClick={() => handleAction('seed')} disabled={loading}>Сеење податоци</button>
          <button className="btn btn-outline-danger" onClick={() => handleResetDatabase()} disabled={loading}>Избриши база</button>
        </div>
      </div>

      <div className="row g-4">
        {/* Runs Section */}
        <div className="col-12">
          <div className="card bg-dark border-secondary p-3 shadow-lg">
            <h4>Времиња / Вожњи ({data.runs.length})</h4>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table table-dark table-sm align-middle">
                <thead><tr><th>Корисник</th><th>Патека</th><th>Возило</th><th>Време</th><th>Акции</th></tr></thead>
                <tbody>
                  {data.runs.length > 0 ? data.runs.map(r => (
                    <tr key={r._id}>
                      <td>{r.userId?.username || 'Unknown'}</td>
                      <td>{r.trackId?.name || 'Unknown'}</td>
                      <td>{r.carId?.make} {r.carId?.model || 'Unknown'}</td>
                      <td className="text-warning fw-bold">{formatTime(r.runTime)}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete('runs', r._id, 'runs')}>Избриши</button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="5" className="text-muted text-center">Нема снимени вожњи.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="col-md-6">
          <div className="card bg-dark border-secondary p-3 shadow-lg h-100">
            <h4>Корисници ({data.users.length})</h4>
            <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="table table-dark table-sm align-middle">
                <thead><tr><th>Име</th><th>Email</th><th>Акции</th></tr></thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete('users', u._id, 'users')}>Избриши</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Vehicles Section */}
        <div className="col-md-6">
          <div className="card bg-dark border-secondary p-3 shadow-lg h-100">
            <h4>Возила ({data.vehicles.length})</h4>
            <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="table table-dark table-sm align-middle">
                <thead><tr><th>Марка</th><th>Модел</th><th>Ранг</th><th>Акции</th></tr></thead>
                <tbody>
                  {data.vehicles.map(v => (
                    <tr key={v._id}>
                      <td>{v.make}</td>
                      <td>{v.model}</td>
                      <td>{v.carRank}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete('vehicles', v._id, 'vehicles')}>Избриши</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;