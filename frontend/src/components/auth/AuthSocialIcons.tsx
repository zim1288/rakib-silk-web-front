/**
 * AuthSocialIcons Component.
 *
 * Implements the exact social platform icon row from the 33-Login & SignUp Form reference design:
 * Google, Facebook, GitHub, and LinkedIn using Boxicons.
 */

import React from 'react';

export interface AuthSocialIconsProps {
  labelPrefix?: string;
  onSocialClick?: (platform: string) => void;
}

export const AuthSocialIcons: React.FC<AuthSocialIconsProps> = ({
  labelPrefix = 'or login with social platforms',
  onSocialClick,
}) => {
  const handleClick = (e: React.MouseEvent, platform: string) => {
    e.preventDefault();
    if (onSocialClick) {
      onSocialClick(platform);
    }
  };

  return (
    <>
      <p>{labelPrefix}</p>
      <div className="social-icons">
        <a href="#google" title="Google" onClick={(e) => handleClick(e, 'Google')}>
          <i className="bx bxl-google"></i>
        </a>
        <a href="#facebook" title="Facebook" onClick={(e) => handleClick(e, 'Facebook')}>
          <i className="bx bxl-facebook"></i>
        </a>
        <a href="#github" title="GitHub" onClick={(e) => handleClick(e, 'GitHub')}>
          <i className="bx bxl-github"></i>
        </a>
        <a href="#linkedin" title="LinkedIn" onClick={(e) => handleClick(e, 'LinkedIn')}>
          <i className="bx bxl-linkedin"></i>
        </a>
      </div>
    </>
  );
};
