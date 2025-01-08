'use client';

import React, { useContext } from 'react';
import { ThemeContext } from '@/context/themeContext';
import styled, { CSSProp } from 'styled-components';
import { MdLightMode, MdDarkMode } from 'react-icons/md';
import Button from '@/components/common/Button';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  styles?: CSSProp;
}

const ThemeSwitcher = ({ className, styles }: Props) => {
  const { themeName, toggleTheme } = useContext(ThemeContext);

  return (
    <StyledThemeSwitcher className={ className }>
      <Button scheme="default" size="small" onClick={ toggleTheme } styles={ styles }>
        { themeName === 'light' ? <MdLightMode className="light" /> : <MdDarkMode className="dark" /> }
      </Button>
    </StyledThemeSwitcher>
  );
};

const StyledThemeSwitcher = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        fill: ${ ({ theme }) => theme.color.text };;
    }
`;

export default React.memo(ThemeSwitcher);
