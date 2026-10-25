/**
 * Merchant Login Page Orchestrator.
 *
 * Implements the interactive sliding authentication experience adapted from the
 * 33-Login & SignUp Form design, fully integrated with Rakib Silk & Fashion's
 * boutique palette, MongoDB backend authentication, and Selenium test suites.
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { AuthSliderContainer } from '../components/auth';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const successMsg = (location.state as any)?.successMsg || null;

  return <AuthSliderContainer initialMode="login" initialSuccessMsg={successMsg} />;
};
