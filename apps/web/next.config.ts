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
	/**
	 * 다른 사이트 안(iframe)에 넣는 것은 hyeoniverse.com 계열에서만 허용한다.
	 * 그 밖의 사이트가 화면을 덮어 클릭을 가로채는 것(클릭재킹)을 막는다. 로그인은 iframe 안에서 팝업으로 연다 (utils/loginPopup.ts)
	 */
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'Content-Security-Policy',
						// 개발 중에는 다른 포트의 테스트 페이지에 넣어 볼 수 있게 localhost도 허용
						value: `frame-ancestors 'self' https://hyeoniverse.com https://*.hyeoniverse.com${
							process.env.NODE_ENV === 'production' ? '' : ' http://localhost:*'
						}`,
					},
				],
			},
		];
	},
	// API 프록시 설정
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				// 서버에서만 읽는 값. 4단계에서 클라이언트 요청을 이 프록시로 통일합니다.
				destination: `${process.env.API_URL ?? 'http://localhost:3001'}/:path*`,
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
