import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { IntegrationGuides } from '@/components/integration-guides';

export const metadata: Metadata = {
    title: 'Integration Guides - Signtusk',
    description: 'Comprehensive integration guides and tutorials for Signtusk API'
};

export default function GuidesPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">Integration Guides</h1>
                            <p className="text-muted-foreground">
                                Step-by-step guides to help you integrate Signtusk into your applications.
                            </p>
                        </div>
                        <IntegrationGuides />
                    </div>
                </main>
            </div>
        </div>
    );
}