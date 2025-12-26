/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    transpilePackages: [
        '@signtusk/api',
        '@signtusk/sdk',
        '@signtusk/ui'
    ],
    experimental: {
        optimizePackageImports: ['lucide-react']
    },
    async rewrites() {
        return [
            {
                source: '/api/proxy/:path*',
                destination: process.env.API_BASE_URL
                    ? `${process.env.API_BASE_URL}/:path*`
                    : 'http://localhost:8080/:path*'
            }
        ];
    },
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
                ]
            }
        ];
    }
};

module.exports = nextConfig;