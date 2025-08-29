import React from 'react';
import { motion } from 'framer-motion';

const ProgressRing = ({
  progress = 0,
  size = 40,
  strokeWidth = 3,
  color = '#06b6d4', // cyan-500
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  showPercentage = false,
  className = '',
  children = null,
}) => {
  // Cálculos para el círculo
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Círculo de fondo */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Círculo de progreso */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Contenido central */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <span className="text-xs font-bold text-white tabular-nums">
            {Math.round(progress)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProgressRing;
