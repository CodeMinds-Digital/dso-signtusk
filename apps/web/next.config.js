/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
    // Enable SWC minification (required for proper builds)
    swcMinify: true,
    
    // Transpile only necessary packages
    transpilePackages: [],
    
    // Minimal experimental configuration
    experimental: {
        // Optimize package imports for better performance
        optimizePackageImports: ['lucide-react'],
    },
    
    // Use static export to avoid server-side rendering conflicts
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    
    // CONFIGURATION-LEVEL CONFLICT PREVENTION:
    // This configuration prevents Html component conflicts by:
    // 1. Removing @signtusk/lib dependency (which depends on email packages)
    // 2. Using static export to avoid server-side rendering conflicts
    // 3. Not transpiling or bundling any email packages
    // 4. Keeping the web app completely isolated from email functionality
    
    // Standard Next.js optimizations
    images: {
        unoptimized: true, // Required for static export
    },
    
    // Enable linting and type checking for better code quality
    eslint: {
        ignoreDuringBuilds: false,
    },
    
    typescript: {
        ignoreBuildErrors: false,
    },
    
    // Enable compression for better performance
    compress: true,
}

module.exports = nextConfig