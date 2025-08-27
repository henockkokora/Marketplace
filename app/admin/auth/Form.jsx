import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getApiUrl, API_ENDPOINTS } from '../../../lib/config';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const validateInput = (username, password) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return 'Le login doit contenir entre 3 et 30 caractères alphanumériques ou underscore.';
  }
  if (password.length < 6) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  return null;
};

const Form = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Les erreurs sont maintenant gérées par les toasts

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.target);
    const username = formData.get('login');
    const password = formData.get('password');

    const errorMsg = validateInput(username, password);
    if (errorMsg) {
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.AUTH}/login`), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          username: username.trim(),
          password: password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Erreur lors de la connexion');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      window.location.href = '/admin';
    } catch (error) {
      console.error('Erreur réseau:', error);
      toast.error('Erreur réseau, réessaie plus tard.');
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="container">
        <div className="heading">Connexion admin</div>
        <form className="form" method="POST" onSubmit={handleSubmit}>
          <input
            required
            className="input"
            type="text"
            name="login"
            id="login"
            placeholder="Login"
            autoComplete="username"
            maxLength={30}
          />
          <input
            required
            className="input"
            type="password"
            name="password"
            id="password"
            placeholder="Mot de passe"
            autoComplete="current-password"
            minLength={6}
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <div className="loader"></div>
            ) : (
              'Se connecter'
            )}
          </button>
          {/* Les erreurs sont affichées via les toasts */}
        </form>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  .container {
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    width: 100%;
    max-width: 400px;
    animation: ${fadeIn} 0.5s ease-out;
  }

  .heading {
    color: #1a202c;
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 2rem;
    text-align: center;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .input {
    padding: 0.875rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s ease;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    background-color: #f8fafc;

    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    &::placeholder {
      color: #94a3b8;
    }
  }

  .login-button {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 0.875rem 1rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;

    &:hover:not(:disabled) {
      background: #4338ca;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: #a5b4fc;
      cursor: not-allowed;
    }
  }

  .loader {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: ${spin} 0.8s linear infinite;
  }

  .error {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 0.875rem;
    text-align: center;
    animation: ${fadeIn} 0.3s ease-out;
  }
`;

export default Form;
