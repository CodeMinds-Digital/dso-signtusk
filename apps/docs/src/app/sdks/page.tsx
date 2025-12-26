import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { SDKDocumentation } from '@/components/sdk-documentation';

export const metadata: Metadata = {
    title: 'SDKs & Client Libraries - Signtusk',
    description: 'Official SDKs and client libraries for Signtusk API in multiple programming languages'
};

export default function SDKsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">SDKs & Client Libraries</h1>
                            <p className="text-muted-foreground">
                                Official SDKs and client libraries for seamless integration with Signtusk API.
                            </p>
                        </div>
                        <SDKDocumentation />
                    </div>
                </main>
            </div>
        </div>
    );
}