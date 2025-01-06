"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { ThemeName, getTheme } from "@/styles/theme";
import { GlobalStyle } from "@/styles/globals";

const DEFAULT_THEME_NAME: ThemeName = "light";
const THEME_LOCALSTORAGE_KEY = "qru_theme";

interface State {
  themeName: ThemeName;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<State>({
  themeName: DEFAULT_THEME_NAME,
  toggleTheme: () => {},
});

export const AppThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>(DEFAULT_THEME_NAME);

  const toggleTheme = () => {
    const newTheme = themeName === "light" ? "dark" : "light";
    setThemeName(newTheme);
    localStorage.setItem(THEME_LOCALSTORAGE_KEY, newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      THEME_LOCALSTORAGE_KEY
    ) as ThemeName;
    setThemeName(savedTheme || DEFAULT_THEME_NAME);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeName, toggleTheme }}>
      <ThemeProvider theme={getTheme(themeName)}>
        <GlobalStyle themeName={themeName} />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
