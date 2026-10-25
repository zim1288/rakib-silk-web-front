/**
 * AuthTogglePanels Component.
 *
 * Implements the exact curved sliding toggle box and panels from the 33-Login & SignUp Form design:
 * - Left Panel: 'Hello, Welcome!', 'Don't have an account?', [Register] button
 * - Right Panel: 'Welcome Back!', 'Already have an account?', [Login] button
 */

import React from 'react';

export interface AuthTogglePanelsProps {
  onToggle: (targetMode: 'login' | 'register') => void;
}

export const AuthTogglePanels: React.FC<AuthTogglePanelsProps> = ({ onToggle }) => {
  return (
    <div className="toggle-box">
      {/* Left panel visible in login state */}
      <div className="toggle-panel toggle-left">
        <h1>Hello, Welcome!</h1>
        <p>Don't have an account?</p>
        <button
          type="button"
          className="btn register-btn"
          id="link-to-register"
          data-testid="link-to-register"
          onClick={() => onToggle('register')}
        >
          Register
        </button>
      </div>

      {/* Right panel visible in register state */}
      <div className="toggle-panel toggle-right">
        <h1>Welcome Back!</h1>
        <p>Already have an account?</p>
        <button
          type="button"
          className="btn login-btn"
          id="link-to-login"
          data-testid="link-to-login"
          onClick={() => onToggle('login')}
        >
          Login
        </button>
      </div>
    </div>
  );
};
