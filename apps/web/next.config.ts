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
			{
				protocol: 'https',
				hostname: 'avatars.githubusercontent.com',
				pathname: '/**',
			},
		],
	},
	compiler: {
		styledComponents: true,
	},
	// API 프록시 설정
	async rewrites() {
		return [
			{
				source: '/api/:path*', // 프론트엔드에서 '/api/...'로 요청하면
				destination: 'http://localhost:3001/:path*', // 백엔드로 프록시
			},
		];
	},
	experimental: {
		// 서버 컴포넌트에서 쿠키 사용 허용
		serverActions: {
			bodySizeLimit: '2mb'
		}
	}
};

export default nextConfig;