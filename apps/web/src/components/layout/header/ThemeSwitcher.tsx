import React from 'react';
import { CSSProperties } from 'react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';
import { ButtonScheme } from '@/styles/theme';
import { useThemeStore } from '@/stores/useThemeStore';
import Button from '@/components/common/Button';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	scheme?: ButtonScheme;
	styles?: CSSProperties;
}

const ThemeSwitcher = ({ className, scheme, styles }: Props) => {
	const { themeName, toggleTheme } = useThemeStore(); // Zustand 사용

	return (
		<Button className={className} scheme={scheme} onClick={toggleTheme} style={styles}>
			{themeName === 'light' ? <MdLightMode className="light" /> : <MdDarkMode className="dark" />}
		</Button>
	);
};

export default React.memo(ThemeSwitcher);
