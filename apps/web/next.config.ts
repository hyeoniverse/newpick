import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	distDir: 'build',

	// Webpack 설정
	webpack: (config) => {
		config.module.rules.push({
			test: /\.svg$/i,
			issuer: /\.[jt]sx?$/,
			use: [
				{
					loader: '@svgr/webpack',
					options: {
						svgoConfig: {
							plugins: [{ removeViewBox: false }],
						},
					},
				},
			],
		});
		return config;
	},

	// 이미지 설정
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'picsum.photos',
				pathname: '/**',
			},
		],
	},

	// 스타일 컴포넌트 설정
	compiler: {
		styledComponents: true,
	},
};

export default nextConfig;
