import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter'
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains-mono'
});

export const metadata: Metadata = {
    title: 'Signtusk API Documentation',
    description: 'Comprehensive API documentation for Signtusk - Enterprise-grade e-signature platform',
    keywords: ['API', 'documentation', 'e-signature', 'digital signature', 'Signtusk'],
    authors: [{ name: 'Signtusk Team' }],
    openGraph: {
        title: 'Signtusk API Documentation',
        description: 'Comprehensive API documentation for Signtusk',
        type: 'website',
        url: 'https://docs.docusign-alternative.com'
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Signtusk API Documentation',
        description: 'Comprehensive API documentation for Signtusk'
    }
};

export default function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}