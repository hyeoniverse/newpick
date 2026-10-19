import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// distDir 제거
	// distDir: 'build', <- 이 부분이 문제가 될 수 있습니다

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
				source: '/api/:path*',
				destination:
					process.env.NODE_ENV === 'production'
						? 'https://api.newpick.site/:path*'
						: 'http://localhost:3001/:path*',
			},
		];
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'Access-Control-Allow-Origin', value: 'https://www.newpick.site' },
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{ key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
					{ key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Cookie' },
				],
			},
		];
	},
	experimental: {
		// 서버 컴포넌트에서 쿠키 사용 허용
		serverActions: {
			bodySizeLimit: '2mb',
		},
	},
};

export default nextConfig;
