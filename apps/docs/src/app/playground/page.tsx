import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { APIPlayground } from '@/components/api-playground';

export const metadata: Metadata = {
    title: 'API Playground - Signtusk',
    description: 'Interactive API testing playground for Signtusk'
};

export default function PlaygroundPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">API Playground</h1>
                            <p className="text-muted-foreground">
                                Test Signtusk API endpoints interactively with authentication and real-time responses.
                            </p>
                        </div>
                        <APIPlayground />
                    </div>
                </main>
            </div>
        </div>
    );
}