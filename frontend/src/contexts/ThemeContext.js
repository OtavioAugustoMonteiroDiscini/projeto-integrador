import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Verificar se há preferência salva no localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      // Se não há preferência salva, usar a preferência do sistema
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // Default para light se window não estiver disponível
  });

  useEffect(() => {
    // Salvar preferência no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Aplicar classe ao documento
      if (isDark) {
        document.documentElement.classList.add('dark');
        console.log('Tema escuro ativado');
      } else {
        document.documentElement.classList.remove('dark');
        console.log('Tema claro ativado');
      }
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const setTheme = (theme) => {
    setIsDark(theme === 'dark');
  };

  const value = {
    isDark,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
