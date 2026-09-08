import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig'; 
import { useNavigate } from 'react-router-dom';

const AddTrack = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    countryCode: '',
    length: '',
    surface: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await api.get('/external-countries');
        const countriesData = response.data;
        
        if (Array.isArray(countriesData)) {
          countriesData.sort((a, b) => a.name.common.localeCompare(b.name.common));
          setCountries(countriesData);
        }
      } catch (err) {
        console.error("Could not load countries", err);
      }
    };

    loadCountries();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.countryCode) {
      return alert("Ве молиме пополнете ги сите задолжителни полиња!");
    }

    // --- REGEX VALIDATIONS ---
    const textPattern = /^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/;
    const lengthPattern = /^\d+(\.\d{1,2})?$/;

    if (!textPattern.test(formData.name) || !textPattern.test(formData.location)) {
      return alert("Името на патеката или локацијата содржи невалидни карактери!");
    }
    if (!lengthPattern.test(formData.length) || parseFloat(formData.length) <= 0) {
      return alert("Должината мора да биде валиден позитивен број (на пр. 2.5)!");
    }
    // -------------------------

    setLoading(true);
    try {
      await api.post('/tracks', formData); 
      
      alert("Патеката е успешно додадена!");
      navigate('/stopwatch');
    } catch (err) {
      alert("Грешка при зачувување: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-5">
      <h2 className="text-warning mb-4">Add New Track</h2>
      <form onSubmit={handleSubmit} className="card bg-black p-4 border border-warning mx-auto" style={{ maxWidth: '500px' }}>
        <div className="mb-3">
          <label className="form-label text-light">Track Name</label>
          <input type="text" id="name" className="form-control bg-dark text-white" required onChange={handleChange} />
        </div>
        
        <div className="mb-3">
          <label className="form-label text-light">City / Location</label>
          <input type="text" id="location" className="form-control bg-dark text-white" required onChange={handleChange} />
        </div>
        
        <div className="mb-3">
          <label className="form-label text-light">Country</label>
          <select id="countryCode" className="form-select bg-dark text-white" required onChange={handleChange}>
            <option value="">Select a country...</option>
            {countries.map(c => <option key={c.cca2} value={c.cca2}>{c.name.common}</option>)}
          </select>
        </div>
        
        <div className="mb-3">
          <label className="form-label text-light">Length (km)</label>
          <input type="number" id="length" step="0.01" className="form-control bg-dark text-white" required onChange={handleChange} />
        </div>
        
        <div className="mb-3">
          <label className="form-label text-light">Surface Type</label>
          <select id="surface" className="form-select bg-dark text-white" required onChange={handleChange}>
            <option value="">Select a surface...</option>
            {['Asphalt', 'Gravel', 'Sand', 'Dirt', 'Ice', 'Snow'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        <button type="submit" className="btn btn-success w-100 mt-3" disabled={loading}>
          {loading ? 'Saving...' : 'Save Track'}
        </button>
      </form>
    </div>
  );
};

export default AddTrack;