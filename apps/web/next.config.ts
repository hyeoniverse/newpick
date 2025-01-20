import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	distDir: 'build',
	experimental: {
		turbo: {
			rules: {
				'*.svg': {
					loaders: ['@svgr/webpack'],
					as: '*.js',
				},
			},
		},
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
};

export default nextConfig;
