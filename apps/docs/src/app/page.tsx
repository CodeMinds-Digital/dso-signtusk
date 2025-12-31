import { FeaturedEndpoints } from '@/components/featured-endpoints';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { QuickStart } from '@/components/quick-start';
import { SDKShowcase } from '@/components/sdk-showcase';
import { Sidebar } from '@/components/sidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Signtusk API Documentation',
    description: 'Comprehensive API documentation for Signtusk - Enterprise-grade e-signature platform'
};

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <Hero />
                        <div className="mt-16 space-y-16">
                            <QuickStart />
                            <FeaturedEndpoints />
                            <SDKShowcase />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}