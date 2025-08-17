'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
}

export const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  useEffect(() => {
    const storedSize = localStorage.getItem('fontSize') as FontSize;
    if (storedSize && ['small', 'medium', 'large'].includes(storedSize)) {
      setFontSizeState(storedSize);
    }
  }, []);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);


  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size);
  };

  const value = {
    fontSize,
    setFontSize,
  };

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = (): FontSizeContextType => {
    const context = useContext(FontSizeContext);
    if (context === undefined) {
        throw new Error('useFontSize must be used within a FontSizeProvider');
    }
    return context;
};
