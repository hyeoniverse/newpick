import React from 'react';
import { CSSProperties } from 'react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';
import { ButtonScheme } from '@/styles/theme';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/common/Button';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	scheme?: ButtonScheme;
	styles?: CSSProperties;
}

const ThemeSwitcher = ({ className, scheme, styles }: Props) => {
	const { themeName, toggleTheme } = useTheme();

	return (
		<Button className={className} scheme={scheme} onClick={toggleTheme} style={styles}>
			{themeName === 'light' ? <MdLightMode className="light" /> : <MdDarkMode className="dark" />}
		</Button>
	);
};

export default React.memo(ThemeSwitcher);
