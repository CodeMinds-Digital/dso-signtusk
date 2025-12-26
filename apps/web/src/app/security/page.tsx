import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Security - Enterprise-Grade Protection',
    description: 'Learn about our comprehensive security measures, compliance certifications, and data protection practices for digital signatures.',
    openGraph: {
        title: 'Security - Signtusk',
        description: 'Enterprise-grade security and compliance',
        images: ['/og-security.jpg'],
    },
}

const securityFeatures = [
    {
        title: 'Data Encryption',
        description: 'End-to-end encryption with AES-256 bit encryption for data at rest and TLS 1.3 for data in transit.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
    {
        title: 'Multi-Factor Authentication',
        description: 'Support for TOTP, SMS, email verification, and biometric authentication methods.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },
    {
        title: 'Access Controls',
        description: 'Role-based access control (RBAC) with granular permissions and IP restrictions.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    {
        title: 'Audit Logging',
        description: 'Comprehensive audit trails with immutable logs for all user actions and document events.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
]

const complianceStandards = [
    {
        name: 'SOC 2 Type II',
        description: 'Independently audited for security, availability, and confidentiality controls.',
        status: 'Certified',
    },
    {
        name: 'ISO 27001',
        description: 'International standard for information security management systems.',
        status: 'Certified',
    },
    {
        name: 'GDPR',
        description: 'Full compliance with European General Data Protection Regulation.',
        status: 'Compliant',
    },
    {
        name: 'CCPA',
        description: 'California Consumer Privacy Act compliance for data protection.',
        status: 'Compliant',
    },
    {
        name: 'HIPAA',
        description: 'Healthcare data protection for covered entities and business associates.',
        status: 'Available',
    },
    {
        name: 'eIDAS',
        description: 'European regulation for electronic identification and trust services.',
        status: 'Compliant',
    },
]

export default function SecurityPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                        Enterprise-Grade
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">
                            Security & Compliance
                        </span>
                    </h1>
                    <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                        Your documents and data are protected by industry-leading security measures
                        and comprehensive compliance certifications.
                    </p>
                </div>
            </section>

            {/* Security Features */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                            Multi-Layered Security
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We implement multiple layers of security to protect your sensitive documents and data
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {securityFeatures.map((feature) => (
                            <div
                                key={feature.title}
                                className="p-8 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                    <div className="text-blue-600">
                                        {feature.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Infrastructure Security */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                                Infrastructure Security
                            </h2>
                            <p className="text-lg text-gray-600">
                                Built on secure, scalable infrastructure with global redundancy
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                    Cloud Infrastructure
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">AWS & Azure Hosting</h4>
                                            <p className="text-gray-600">Multi-region deployment with automatic failover and 99.9% uptime SLA</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Data Centers</h4>
                                            <p className="text-gray-600">SOC 2 certified data centers with 24/7 physical security monitoring</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Network Security</h4>
                                            <p className="text-gray-600">DDoS protection, WAF, and intrusion detection systems</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Backup & Recovery</h4>
                                            <p className="text-gray-600">Automated backups with point-in-time recovery and disaster recovery plans</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                                <h3 className="text-2xl font-bold mb-6">Security Monitoring</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span>Uptime</span>
                                        <span className="font-semibold">99.99%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Security Incidents</span>
                                        <span className="font-semibold">0 in 2024</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Response Time</span>
                                        <span className="font-semibold">&lt; 15 minutes</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Vulnerability Scans</span>
                                        <span className="font-semibold">Daily</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white border-opacity-20">
                                    <p className="text-blue-100 text-sm">
                                        Real-time monitoring with automated threat detection and incident response
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Compliance Standards */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                            Compliance Certifications
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We maintain the highest standards of compliance to meet regulatory requirements worldwide
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {complianceStandards.map((standard) => (
                            <div
                                key={standard.name}
                                className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {standard.name}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${standard.status === 'Certified'
                                        ? 'bg-green-100 text-green-800'
                                        : standard.status === 'Compliant'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {standard.status}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm">
                                    {standard.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Data Protection */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-6">
                            Your Data, Your Control
                        </h2>
                        <p className="text-lg text-gray-600 mb-12">
                            We believe in transparency and giving you complete control over your data
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="text-left">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Ownership</h3>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        You own and control all your data
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Export your data anytime in standard formats
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Delete your data permanently when requested
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        No vendor lock-in or proprietary formats
                                    </li>
                                </ul>
                            </div>

                            <div className="text-left">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy Protection</h3>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        No data sharing with third parties
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Minimal data collection principles
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Transparent privacy policies
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Regular privacy impact assessments
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Resources */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                            Security Resources
                        </h2>
                        <p className="text-lg text-gray-600">
                            Learn more about our security practices and compliance
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <Link
                            href="/security/whitepaper"
                            className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                Security Whitepaper
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Detailed technical overview of our security architecture
                            </p>
                        </Link>

                        <Link
                            href="/compliance/certifications"
                            className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center"
                        >
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                                Compliance Reports
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Download our latest SOC 2 and compliance audit reports
                            </p>
                        </Link>

                        <Link
                            href="/security/incident-response"
                            className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center"
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                                Incident Response
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Learn about our security incident response procedures
                            </p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
                        Questions About Security?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Our security team is here to answer your questions and provide additional documentation
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/contact?subject=security"
                            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                        >
                            Contact Security Team
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            href="/app/signup"
                            className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold"
                        >
                            Try Secure Platform
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}