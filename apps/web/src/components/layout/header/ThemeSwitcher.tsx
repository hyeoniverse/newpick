'use client';

import React, { useContext } from 'react';
import { ThemeContext } from '@/context/themeContext';
import { CSSProperties } from 'react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';
import Button from '@/components/common/Button';
import { ButtonScheme } from '@/styles/theme';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	scheme?: ButtonScheme;
	styles?: CSSProperties;
}

const ThemeSwitcher = ({ className, scheme, styles }: Props) => {
	const { themeName, toggleTheme } = useContext(ThemeContext);

	return (
		<Button className={className} scheme={scheme} onClick={toggleTheme} style={styles}>
			{themeName === 'light' ? <MdLightMode className="light" /> : <MdDarkMode className="dark" />}
		</Button>
	);
};

export default React.memo(ThemeSwitcher);
