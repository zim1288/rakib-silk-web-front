/**
 * Merchant Registration Page Orchestrator.
 *
 * Implements the interactive sliding authentication experience adapted from the
 * 33-Login & SignUp Form design, launching in active registration mode and allowing
 * fluid one-click transitions back to sign in.
 */

import React from 'react';
import { AuthSliderContainer } from '../components/auth';

export const RegisterPage: React.FC = () => {
  return <AuthSliderContainer initialMode="register" />;
};
