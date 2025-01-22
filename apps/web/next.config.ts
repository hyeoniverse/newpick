import type { NextConfig } from "next";

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

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: "picsum.photos",
      },
      {
        protocol: 'https',
        hostname: "imgnews.pstatic.net",
      },
    ],
  },
}

export default nextConfig;
