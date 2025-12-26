import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '../components/providers'
import { Navigation } from '../components/navigation'
import { Footer } from '../components/footer'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
})

export const metadata: Metadata = {
    title: {
        default: 'Signtusk - Digital Signature Platform',
        template: '%s | Signtusk',
    },
    description: 'Secure, compliant, and user-friendly digital signature platform. Sign documents electronically with enterprise-grade security and legal compliance.',
    keywords: [
        'digital signature',
        'electronic signature',
        'e-signature',
        'document signing',
        'PDF signing',
        'secure documents',
        'legal compliance',
        'enterprise security'
    ],
    authors: [{ name: 'Signtusk Team' }],
    creator: 'Signtusk',
    publisher: 'Signtusk',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: '/',
        title: 'Signtusk - Digital Signature Platform',
        description: 'Secure, compliant, and user-friendly digital signature platform',
        siteName: 'Signtusk',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Signtusk - Digital Signature Platform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Signtusk - Digital Signature Platform',
        description: 'Secure, compliant, and user-friendly digital signature platform',
        images: ['/og-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#000000' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="font-sans antialiased">
                <Providers>
                    <Navigation />
                    {children}
                    <Footer />
                </Providers>
            </body>
        </html>
    )
}

export default RootLayout