import React, { useState } from 'react';
import api from '../api/axiosConfig'; 
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- REGEX VALIDATIONS ---
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^.{6,}$/; // At least 6 characters
    const usernamePattern = /^[a-zA-Z0-9_]{3,}$/; // Alphanumeric & underscore, min 3 chars

    if (!emailPattern.test(formData.email)) {
      return alert("Внесете валидна емаил адреса!");
    }
    if (!passwordPattern.test(formData.password)) {
      return alert("Лозинката мора да содржи најмалку 6 карактери!");
    }
    if (isRegister && !usernamePattern.test(formData.username)) {
      return alert("Корисничкото име мора да има најмалку 3 карактери (букви, броеви и долна цртичка)!");
    }
    // -------------------------

    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    try {
      const { data } = await api.post(endpoint, formData);
      
      if (!isRegister) {
        sessionStorage.setItem('userToken', data.token);
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('isAdmin', data.isAdmin);
        
        window.dispatchEvent(new Event('auth-change'));
        navigate('/stopwatch');
      } else {
        alert("Успешна регистрација!");
        setIsRegister(false);
      }
    } catch (err) {
      alert("Грешка: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container-fluid py-5">
      <div className="card bg-dark text-white p-4 mx-auto border-warning" style={{ maxWidth: '400px' }}>
        <h3 className="mb-4 text-warning">{isRegister ? 'Регистрација' : 'Најава'}</h3>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="mb-3">
              <input name="username" className="form-control bg-secondary text-white" placeholder="Корисничко име" 
                onChange={handleChange} required />
            </div>
          )}
          <div className="mb-3">
            <input name="email" type="email" className="form-control bg-secondary text-white" placeholder="Email" 
              onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <input name="password" type="password" className="form-control bg-secondary text-white" placeholder="Лозинка" 
              onChange={handleChange} required />
          </div>
          
          <div className="d-grid gap-2">
            <button className="btn btn-warning" type="submit">
              {isRegister ? 'Регистрирај се' : 'Најави се'}
            </button>
            <button className="btn btn-outline-light" type="button" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Веќе имате профил? Најава' : 'Немате профил? Регистрација'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;