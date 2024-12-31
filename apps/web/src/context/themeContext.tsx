import React, { createContext, useState, useEffect, ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { ThemeName, getTheme } from "../styles/theme";
import { GlobalStyle } from "../styles/GlobalStyle";

const DEFAULT_THEME_NAME = "light";
const THEME_LOCALSTORAGE_KEY = "qru_theme";

interface State {
  themeName: ThemeName;
  toggleTheme: () => void;
}

export const state = {
  themeName: DEFAULT_THEME_NAME as ThemeName,
  toggleTheme: () => {},
};

export const ThemeContext = createContext<State>(state);

export const AppThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>(DEFAULT_THEME_NAME);

  const toggleTheme = () => {
    setThemeName(themeName === "light" ? "dark" : "light");
    localStorage.setItem(
      THEME_LOCALSTORAGE_KEY,
      themeName === "light" ? "dark" : "light"
    );
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
