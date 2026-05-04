import React from 'react';
import atLogo from '@/assets/logo.png';

export function ATLogo({ className }) {
  return (
    <img 
      src={atLogo} 
      alt="Algérie Télécom Logo" 
      className={`${className} object-contain`} 
    />
  );
}
