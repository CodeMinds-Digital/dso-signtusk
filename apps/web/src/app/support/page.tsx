import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Support Center - Help & Documentation',
    description: 'Find answers to common questions, browse our documentation, and get help with digital signatures and document management.',
    openGraph: {
        title: 'Support Center - Signtusk',
        description: 'Help documentation and support resources',
        images: ['/og-support.jpg'],
    },
}

// Mock FAQ data - in a real app, this would come from a CMS
const faqs = [
    {
        category: 'Getting Started',
        questions: [
            {
                question: 'How do I create my first document for signing?',
                answer: 'To create your first document, log into your account and click "New Document" on your dashboard. Upload your PDF or document file, add signature fields by dragging them onto the document, add recipient email addresses, and click "Send for Signature". Your recipients will receive an email with a secure link to sign the document.',
            },
            {
                question: 'What file formats are supported?',
                answer: 'We support PDF, Word documents (.docx), Excel files (.xlsx), PowerPoint presentations (.pptx), and most image formats (PNG, JPG, GIF). All documents are automatically converted to PDF for signing to ensure consistency and legal compliance.',
            },
            {
                question: 'How do I add multiple signers to a document?',
                answer: 'When preparing your document, click "Add Recipient" to include multiple signers. You can set the signing order (sequential or parallel), assign different fields to each signer, and customize the message each recipient receives.',
            },
        ],
    },
    {
        category: 'Security & Compliance',
        questions: [
            {
                question: 'Are digital signatures legally binding?',
                answer: 'Yes, our digital signatures are legally binding in most countries. We comply with eIDAS (EU), ESIGN Act (US), and other international regulations. Each signature includes a comprehensive audit trail with timestamps, IP addresses, and authentication details.',
            },
            {
                question: 'How secure is my data?',
                answer: 'We use bank-level security with 256-bit SSL encryption, SOC 2 Type II compliance, and ISO 27001 certification. Your documents are encrypted at rest and in transit. We never share your data with third parties and offer enterprise-grade security features.',
            },
            {
                question: 'What compliance standards do you meet?',
                answer: 'We comply with GDPR, CCPA, HIPAA (for healthcare customers), SOX, and other major regulatory frameworks. Our platform includes features for data retention, right to erasure, and comprehensive audit logging.',
            },
        ],
    },
    {
        category: 'Account & Billing',
        questions: [
            {
                question: 'How do I upgrade or downgrade my plan?',
                answer: 'You can change your plan anytime from your account settings. Go to "Billing & Plans" in your dashboard, select your new plan, and the change will take effect immediately. Upgrades are prorated, and downgrades take effect at your next billing cycle.',
            },
            {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers. All payments are processed securely through Stripe.',
            },
            {
                question: 'Can I cancel my subscription anytime?',
                answer: 'Yes, you can cancel your subscription at any time from your account settings. Your account will remain active until the end of your current billing period, and you\'ll retain access to your signed documents.',
            },
        ],
    },
    {
        category: 'Technical Issues',
        questions: [
            {
                question: 'Why can\'t I sign a document on my mobile device?',
                answer: 'Our platform is fully mobile-optimized. If you\'re having issues, try clearing your browser cache, updating your browser, or using our mobile app. Ensure you have a stable internet connection and that JavaScript is enabled.',
            },
            {
                question: 'The document won\'t load. What should I do?',
                answer: 'First, check your internet connection and try refreshing the page. If the issue persists, try a different browser or clear your browser cache. For large documents, allow extra time for loading. Contact support if the problem continues.',
            },
            {
                question: 'How do I integrate with my existing software?',
                answer: 'We offer REST APIs, webhooks, and pre-built integrations with popular platforms like Salesforce, HubSpot, and Google Drive. Check our developer documentation or contact our integration team for custom solutions.',
            },
        ],
    },
]

const quickLinks = [
    {
        title: 'API Documentation',
        description: 'Complete guide to our REST API and webhooks',
        href: '/docs/api',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
    },
    {
        title: 'Video Tutorials',
        description: 'Step-by-step video guides for common tasks',
        href: '/tutorials',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        title: 'System Status',
        description: 'Check our current system status and uptime',
        href: '/status',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        title: 'Security Center',
        description: 'Learn about our security practices and compliance',
        href: '/security',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
]

export default function SupportPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                        Support Center
                    </h1>
                    <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                        Find answers to common questions, browse our documentation,
                        and get help with digital signatures and document management.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 max-w-2xl mx-auto">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search for help articles, guides, and FAQs..."
                                className="w-full px-6 py-4 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Links */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                        Popular Resources
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.title}
                                href={link.href}
                                className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                                    <div className="text-blue-600">
                                        {link.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {link.title}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {link.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-lg text-gray-600">
                            Quick answers to the most common questions about our platform
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {faqs.map((category) => (
                            <div key={category.category} className="mb-12">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                                    {category.category}
                                </h3>

                                <div className="space-y-4">
                                    {category.questions.map((faq, index) => (
                                        <details
                                            key={index}
                                            className="group bg-white border border-gray-200 rounded-lg"
                                        >
                                            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                                                <h4 className="text-lg font-medium text-gray-900 pr-4">
                                                    {faq.question}
                                                </h4>
                                                <svg
                                                    className="w-5 h-5 text-gray-500 transform group-open:rotate-180 transition-transform flex-shrink-0"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </summary>
                                            <div className="px-6 pb-6">
                                                <p className="text-gray-600 leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Support */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Still need help?
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Our support team is here to help you succeed. Get in touch and we'll respond quickly.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
                                <p className="text-gray-600 mb-4">Chat with our support team in real-time</p>
                                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    Start Chat
                                </button>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
                                <p className="text-gray-600 mb-4">Send us a detailed message</p>
                                <Link
                                    href="/contact"
                                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Send Email
                                </Link>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
                                <p className="text-gray-600 mb-4">Call us for urgent issues</p>
                                <a
                                    href="tel:+15551234567"
                                    className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Call Now
                                </a>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Enterprise Support
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Need dedicated support? Our Enterprise plans include priority support,
                                dedicated account management, and SLA guarantees.
                            </p>
                            <Link
                                href="/contact?plan=enterprise"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Learn about Enterprise Support
                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}