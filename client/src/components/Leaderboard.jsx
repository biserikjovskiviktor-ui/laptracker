import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { getWeatherIcon } from '../utils/helpers';
import { getRankStyle } from '../utils/helpers';
import { formatTime } from '../utils/formatTime';
import { Modal } from 'react-bootstrap';

const Leaderboard = () => {
  const [laps, setLaps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  
  // Strict admin check: requires a valid session AND the admin flag
  const [isAdmin, setIsAdmin] = useState(() => {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const adminFlag = sessionStorage.getItem('isAdmin') === 'true';
    
    const hasValidSession = Boolean(
      token && token !== 'undefined' && token !== 'null' && token.trim() !== '' &&
      userId && userId !== 'undefined' && userId !== 'null' && userId.trim() !== ''
    );
    
    return hasValidSession && adminFlag;
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();

    const handleAuthChange = () => {
      const token = sessionStorage.getItem('token');
      const userId = sessionStorage.getItem('userId');
      const adminFlag = sessionStorage.getItem('isAdmin') === 'true';
      
      const hasValidSession = Boolean(
        token && token !== 'undefined' && token !== 'null' && token.trim() !== '' &&
        userId && userId !== 'undefined' && userId !== 'null' && userId.trim() !== ''
      );

      setIsAdmin(hasValidSession && adminFlag);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/leaderboard');
      setLaps(data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  const handleDelete = async (runId) => {
    if (!window.confirm("Сигурно сакаш да го избришеш овој запис?")) return;
    try {
      await api.delete(`/runs/${runId}`);
      fetchLeaderboard();
    } catch (err) {
      alert("Грешка при бришење: " + (err.response?.data?.error || err.message));
    }
  };

  const openDetails = async (runId) => {
    try {
      const { data } = await api.get(`/runs/details/${runId}`);
      setSelectedRun(data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to load lap details:", err);
      alert("Грешка при вчитување на детали.");
    }
  };

  return (
    <div className="container-fluid py-4 text-white">
      <h2 className="mb-4 fw-bold text-uppercase text-center">Листа на Резултати</h2>
      
      <div className="table-responsive">
        <table className="table table-dark table-striped align-middle">
          <thead>
            <tr>
              <th>Возач</th>
              <th>Патека</th>
              <th>Возило</th>
              <th>Време</th>
              <th className="text-center">Акција</th>
            </tr>
          </thead>
          <tbody>
            {laps.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-secondary">Нема зачувани резултати.</td>
              </tr>
            ) : (
              laps.map(lap => {
                const rankInfo = getRankStyle(lap.carId?.carRank);
                const runId = lap.runId || lap._id;
                const timeValue = lap.bestTime !== undefined ? lap.bestTime : lap.runTime;
                
                return (
                  <tr key={runId}>
                    <td>{lap.driverId?.username || lap.userId?.username || 'Anonymous'}</td>
                    <td>{lap.trackId?.name || 'Unknown'}</td>
                    <td>
                      <i className={`${rankInfo.icon} me-2`} style={{ color: rankInfo.color }}></i>
                      {lap.carId?.make} {lap.carId?.model} 
                      {lap.carId?.carRank && (
                        <span className="badge ms-2" style={{ backgroundColor: rankInfo.color, color: '#000' }}>
                          {lap.carId.carRank}
                        </span>
                      )}
                    </td>
                    <td className="text-warning fw-bold">{timeValue !== undefined ? formatTime(timeValue) : '--:--:--.---'}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-sm btn-info fw-bold" onClick={() => openDetails(runId)}>
                          Детали
                        </button>
                        <button 
                          className="btn btn-sm btn-danger fw-bold" 
                          onClick={() => navigate('/stopwatch', { state: { trackId: lap.trackId?._id, targetTime: timeValue } })}
                        >
                          Compete
                        </button>
                        {isAdmin && (
                          <button className="btn btn-sm btn-warning fw-bold" onClick={() => handleDelete(runId)}>
                            Избриши
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-dark text-warning border-secondary">
          <Modal.Title className="text-uppercase fw-bold">Детали за вожњата</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light p-4">
          {selectedRun ? (
            <div className="row g-4">
              {/* Track Info */}
              <div className="col-md-4">
                <div className="bg-black p-3 rounded border border-secondary h-100">
                  <h5 className="text-warning text-uppercase fw-bold mb-3">Патека</h5>
                  <p className="mb-2"><strong>Име:</strong> {selectedRun.trackId?.name}</p>
                  <p className="mb-2"><strong>Локација:</strong> {selectedRun.trackId?.location}, {selectedRun.trackId?.countryCode}</p>
                  <p className="mb-2"><strong>Должина:</strong> {selectedRun.trackId?.length} km</p>
                  <p className="mb-0"><strong>Подлога:</strong> {selectedRun.trackId?.surface}</p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="col-md-4">
                <div className="bg-black p-3 rounded border border-secondary h-100">
                  <h5 className="text-warning text-uppercase fw-bold mb-3">Возило</h5>
                  <p className="mb-2"><strong>Модел:</strong> {selectedRun.carId?.make} {selectedRun.carId?.model} ({selectedRun.carId?.year})</p>
                  <p className="mb-2"><strong>Мотор:</strong> {selectedRun.carId?.engineDisplacement}L</p>
                  <p className="mb-2"><strong>КС:</strong> {selectedRun.carId?.hp} HP</p>
                  <p className="mb-0"><strong>Ранг:</strong> {selectedRun.carId?.carRank}</p>
                </div>
              </div>

              {/* Run Info */}
              <div className="col-md-4">
                <div className="bg-black p-3 rounded border border-secondary h-100">
                  <h5 className="text-warning text-uppercase fw-bold mb-3">Вожња</h5>
                  <p className="mb-2"><strong>Возач:</strong> {selectedRun.driverId?.username || selectedRun.userId?.username || 'Anonymous'}</p>
                  <p className="mb-2"><strong>Време:</strong> {formatTime(selectedRun.runTime || selectedRun.bestTime)}</p>
                  <p className="mb-0"><strong>Временски услови:</strong> <i className={`fas ${getWeatherIcon(selectedRun.weatherInfo)} me-2`}></i>{selectedRun.weatherInfo || 'Нема податоци'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-secondary">Се вчитува...</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Leaderboard;