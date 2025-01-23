import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	distDir: 'build',
	// 이미지 설정
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'picsum.photos',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'imgnews.pstatic.net',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				pathname: '/**',
			},
		],
	},
	compiler: {
		styledComponents: true,
	},
};

export default nextConfig;
