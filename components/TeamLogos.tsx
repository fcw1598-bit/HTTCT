import React from 'react';

// Enthusiastic: A flaming cricket ball
export const EnthusiasticLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g>
      <circle cx="50" cy="50" r="30" fill="#E53E3E" />
      <path d="M50 80 C 40 70, 30 60, 35 50 C 40 40, 50 40, 50 40" fill="none" stroke="#F6E05E" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 80 C 55 70, 60 65, 65 55 C 70 45, 60 42, 60 42" fill="none" stroke="#F6AD55" strokeWidth="4" strokeLinecap="round" />
      <path d="M45 85 C 40 75, 50 65, 50 55 C 50 45, 45 45, 45 45" fill="none" stroke="#F6AD55" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>
);

// Humorous: A winking cricket ball with a smile
export const HumorousLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g>
      <circle cx="50" cy="50" r="30" fill="#68D391" />
      <circle cx="38" cy="45" r="3" fill="white" />
      <path d="M58 48 Q 62 42, 68 48" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M35 60 Q 50 70, 65 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

// Technical: A stylized, geometric wicket
export const TechnicalLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g>
      <rect x="25" y="30" width="10" height="40" fill="#4299E1" />
      <rect x="45" y="30" width="10" height="40" fill="#4299E1" />
      <rect x="65" y="30" width="10" height="40" fill="#4299E1" />
      <rect x="22" y="25" width="26" height="5" fill="#63B3ED" />
      <rect x="52" y="25" width="26" height="5" fill="#63B3ED" />
      <path d="M20 70 L 80 70 L 50 85 Z" fill="#2B6CB0" />
    </g>
  </svg>
);

// Analytical: A cricket ball as a pie chart
export const AnalyticalLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g>
      <circle cx="50" cy="50" r="30" fill="#9F7AEA" />
      <path d="M50 50 L 50 20 A 30 30 0 0 1 80 50 Z" fill="#805AD5" />
      <path d="M50 50 L 80 50 A 30 30 0 0 1 35 72 Z" fill="#6B46C1" />
      <path d="M50 50 L 35 72 A 30 30 0 0 1 50 20 Z" fill="#B794F4" />
    </g>
  </svg>
);