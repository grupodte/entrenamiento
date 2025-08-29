import React, { createContext, useContext, useState } from 'react';

const ProgressDockContext = createContext();

export const useProgressDock = () => {
  const context = useContext(ProgressDockContext);
  if (!context) {
    throw new Error('useProgressDock debe ser usado dentro de un ProgressDockProvider');
  }
  return context;
};

export const ProgressDockProvider = ({ children }) => {
  const [showProgressDock, setShowProgressDock] = useState(false);
  const [progressGlobal, setProgressGlobal] = useState(0);

  const toggleProgressDock = () => {
    setShowProgressDock(prev => !prev);
  };

  const updateProgressGlobal = (progress) => {
    setProgressGlobal(progress);
  };

  const value = {
    showProgressDock,
    setShowProgressDock,
    progressGlobal,
    setProgressGlobal,
    toggleProgressDock,
    updateProgressGlobal,
  };

  return (
    <ProgressDockContext.Provider value={value}>
      {children}
    </ProgressDockContext.Provider>
  );
};

export default ProgressDockProvider;
