/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    
    // Enable linting for better code quality
    eslint: {
        ignoreDuringBuilds: false,
    },
    
    // Transpile necessary packages, avoid email packages to prevent conflicts
    transpilePackages: [
        '@signtusk/api',
        '@signtusk/sdk',
        '@signtusk/ui'
    ],
    
    // Minimal experimental configuration
    experimental: {
        // Optimize package imports for better performance
        optimizePackageImports: ['lucide-react'],
        forceSwcTransforms: true,
    },
    
    // CONFIGURATION-LEVEL CONFLICT PREVENTION:
    // This configuration prevents Html component conflicts by:
    // 1. Not transpiling email packages (they remain external)
    // 2. Using static export to avoid server-side rendering conflicts
    // 3. Proper routing configuration that doesn't interfere with Html components
    
    // Static export configuration
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    
    // Note: rewrites and headers are disabled for static export
    // This prevents conflicts with Html component rendering during static generation
    async rewrites() {
        // Only apply rewrites in development
        if (process.env.NODE_ENV === 'development') {
            return [
                {
                    source: '/api/proxy/:path*',
                    destination: process.env.API_BASE_URL
                        ? `${process.env.API_BASE_URL}/:path*`
                        : 'http://localhost:8080/:path*'
                }
            ];
        }
        return [];
    },
    
    async headers() {
        // Only apply headers in development
        if (process.env.NODE_ENV === 'development') {
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
        return [];
    }
};

module.exports = nextConfig;