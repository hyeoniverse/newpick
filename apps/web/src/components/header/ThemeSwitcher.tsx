import React, { useContext } from "react";
import { ThemeContext } from "../../context/themeContext";
import styled, { CSSProp } from "styled-components";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import Button from "../common/Button";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  styles?: CSSProp;
}

const ThemeSwitcher = ({ className, styles }: Props) => {
  const { themeName, toggleTheme } = useContext(ThemeContext);
  return (
    <StyledThemeSwitcher className={className}>
      <Button size="small" onClick={toggleTheme} styles={styles}>
        {themeName === "light" ? <MdLightMode /> : <MdDarkMode />}
      </Button>
    </StyledThemeSwitcher>
  );
};

const StyledThemeSwitcher = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default React.memo(ThemeSwitcher);
