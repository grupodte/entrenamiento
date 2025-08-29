import React, { createContext, useContext, useState } from 'react';

const BackNavigationContext = createContext();

export const useBackNavigation = () => {
  const context = useContext(BackNavigationContext);
  return context || { onBackClick: null, registerBackHandler: () => {} };
};

export const BackNavigationProvider = ({ children }) => {
  const [backClickHandler, setBackClickHandler] = useState(null);

  const registerBackHandler = (handler) => {
    setBackClickHandler(() => handler);
  };

  const value = {
    onBackClick: backClickHandler,
    registerBackHandler,
  };

  return (
    <BackNavigationContext.Provider value={value}>
      {children}
    </BackNavigationContext.Provider>
  );
};

export default BackNavigationProvider;
