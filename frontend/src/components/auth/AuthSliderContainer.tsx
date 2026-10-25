/**
 * AuthSliderContainer Component.
 *
 * Master container implementing the 33-Login & SignUp Form sliding experience:
 * - Fluid 1.8s curved shape transition (.toggle-box::before)
 * - Persistently mounted DOM elements ensuring buttery-smooth animation
 * - URL bar synchronization with window.history.replaceState and popstate
 * - Seamless integration with Rakib Silk & Fashion's backend API & testing suite
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser, registerUser } from '../../services/api';
import { LoginFormBox } from './LoginFormBox';
import { RegisterFormBox } from './RegisterFormBox';
import { AuthTogglePanels } from './AuthTogglePanels';

export interface AuthSliderContainerProps {
  initialMode?: 'login' | 'register';
  initialSuccessMsg?: string | null;
}

export const AuthSliderContainer: React.FC<AuthSliderContainerProps> = ({
  initialMode = 'login',
  initialSuccessMsg = null,
}) => {
  const { userEmail, login } = useAuth();
  const navigate = useNavigate();

  // Active state: false = Login, true = Register
  const [isActive, setIsActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.includes('/register') || initialMode === 'register';
    }
    return initialMode === 'register';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(initialSuccessMsg);

  useEffect(() => {
    if (userEmail) {
      navigate('/', { replace: true });
    }
  }, [userEmail, navigate]);

  // Synchronize on browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setIsActive(window.location.pathname.includes('/register'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize on route changes
  useEffect(() => {
    const isReg = window.location.pathname.includes('/register') || initialMode === 'register';
    setIsActive(isReg);
    document.title = isReg ? 'Register - Silk & Fashion' : 'Login - Silk & Fashion';
  }, [initialMode]);

  const handleClearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  /**
   * Toggles the active state, triggering the 1.8s sliding curve animation,
   * and updates the browser URL bar without unmounting the DOM.
   */
  const handleToggle = (targetMode: 'login' | 'register') => {
    handleClearMessages();
    const shouldBeActive = targetMode === 'register';
    setIsActive(shouldBeActive);
    window.history.replaceState(null, '', shouldBeActive ? '/register' : '/login');
    document.title = shouldBeActive ? 'Register - Silk & Fashion' : 'Login - Silk & Fashion';
  };

  const handleSubmitLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    handleClearMessages();
    try {
      const res = await loginUser(email, pass);
      login(res.email || email, res.tokenVersion);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRegister = async (email: string, pass: string) => {
    setIsLoading(true);
    handleClearMessages();
    try {
      await registerUser(email, pass);
      setSuccessMessage('Account created successfully! Switching to sign in...');
      setTimeout(() => {
        setIsActive(false);
        window.history.replaceState(null, '', '/login');
        setSuccessMessage('Account created! Please sign in.');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-slider-wrapper">
      <div className={`container ${isActive ? 'active' : ''}`}>
        {/* Login Form Box */}
        <LoginFormBox
          isLoading={isLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onSubmitLogin={handleSubmitLogin}
          onClearMessages={handleClearMessages}
          setSuccessMessage={setSuccessMessage}
        />

        {/* Registration Form Box */}
        <RegisterFormBox
          isLoading={isLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onSubmitRegister={handleSubmitRegister}
          onClearMessages={handleClearMessages}
        />

        {/* Sliding Curved Toggle Box */}
        <AuthTogglePanels onToggle={handleToggle} />
      </div>
    </div>
  );
};
