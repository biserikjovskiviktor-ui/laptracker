import React, { useState } from 'react';
import api from '../api/axiosConfig'; 
import { useNavigate } from 'react-router-dom';
import { getRankStyle } from '../utils/helpers';

const AddVehicle = () => {
  const [formData, setFormData] = useState({
    make: '', model: '', year: '', engineDisplacement: '', hp: ''
  });
  const navigate = useNavigate();

  const calculateRank = (hp) => {
    const h = parseInt(hp);
    if (isNaN(h) || h <= 0) return '-';
    return h >= 1000 ? 'S' : h >= 600 ? 'A' : h >= 400 ? 'B' : h >= 250 ? 'C' : h >= 150 ? 'D' : 'E';
  };

  const currentRank = calculateRank(formData.hp);
  const rankStyle = getRankStyle(currentRank);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- REGEX VALIDATIONS ---
    const textPattern = /^[a-zA-Z0-9\s\-]+$/;
    const yearPattern = /^(19|20)\d{2}$/;
    const numberPattern = /^[1-9]\d*$/;

    if (!textPattern.test(formData.make) || !textPattern.test(formData.model)) {
      return alert("Марката и модела содржат невалидни специјални карактери!");
    }
    if (!yearPattern.test(formData.year)) {
      return alert("Внесете валидна година (на пр. 1990 - 2029)!");
    }
    if (!numberPattern.test(formData.engineDisplacement) || !numberPattern.test(formData.hp)) {
      return alert("Купикажата и коњските сили мора да бидат позитивни броеви!");
    }
    // -------------------------
    
    const rawLiters = parseFloat(formData.engineDisplacement) / 1000;
    const roundedLiters = Number(rawLiters.toFixed(1));

    const payload = {
      ...formData,
      engineDisplacement: roundedLiters,
      carRank: currentRank
    };

    try {
      await api.post('/vehicles', payload);
      alert("Возилото е успешно додадено!");
      navigate('/stopwatch');
    } catch (err) {
      alert("Грешка: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container-fluid py-5">
      <h2 className="text-warning mb-4">Додај ново возило</h2>
      <form onSubmit={handleSubmit} className="card bg-black p-4 border border-secondary mx-auto" style={{ maxWidth: '500px' }}>
        <div className="mb-3">
          <label className="form-label text-light">Марка</label>
          <input name="make" className="form-control bg-dark text-white" required onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label text-light">Модел</label>
          <input name="model" className="form-control bg-dark text-white" required onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label text-light">Година</label>
          <input name="year" type="number" className="form-control bg-dark text-white" required onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label text-light">Зафатнина (cc)</label>
          <input name="engineDisplacement" type="number" step="100" className="form-control bg-dark text-white" required onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label text-light">Коњски сили (HP)</label>
          <input name="hp" type="number" className="form-control bg-dark text-white" required onChange={handleChange} />
          
          {currentRank !== '-' && (
            <div className="mt-3 p-2 rounded d-inline-block border" style={{ borderColor: rankStyle.color }}>
              <span className="text-light me-2">Проценета класа:</span>
              <strong style={{ color: rankStyle.color, fontSize: '1.5rem' }}>{currentRank}</strong>
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-success w-100">Додај возило</button>
      </form>
    </div>
  );
};

export default AddVehicle;