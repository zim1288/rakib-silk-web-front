import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { apiLatency } = useAuth();

  return (
    <footer id="app-footer" data-testid="app-footer" className="site-footer">
      <div className="footer-container">
        <div className="footer-left">
          <span id="build-version" data-testid="build-version">
            Build v1.0
          </span>
          <span className="footer-separator">•</span>
          <span className="footer-company">Silk &amp; Fashion Saree Management</span>
        </div>
        <div className="footer-right">
          <span className="latency-label">Last API Latency: </span>
          <span id="api-latency" data-testid="api-latency" className="latency-badge">
            {apiLatency > 0 ? `${apiLatency} ms` : '0 ms'}
          </span>
        </div>
      </div>
    </footer>
  );
};
