import { Metadata } from 'next'

import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Pricing',
    description: 'Simple, transparent pricing for digital signatures. Choose the plan that fits your business needs.',
    openGraph: {
        title: 'Pricing - Signtusk',
        description: 'Simple, transparent pricing for digital signatures',
        images: ['/og-pricing.jpg'],
    },
}

// Static generation
export const revalidate = 86400 // Revalidate daily

const plans = [
    {
        name: 'Starter',
        price: '$0',
        period: 'forever',
        description: 'Perfect for individuals and small teams',
        features: [
            '5 documents per month',
            'Basic templates',
            'Email support',
            'Mobile app access',
        ],
        cta: 'Get Started Free',
        href: '/signup?plan=starter',
        popular: false,
    },
    {
        name: 'Professional',
        price: '$15',
        period: 'per user/month',
        description: 'For growing businesses and teams',
        features: [
            'Unlimited documents',
            'Advanced templates',
            'Priority support',
            'API access',
            'Custom branding',
            'Advanced analytics',
        ],
        cta: 'Start Free Trial',
        href: '/signup?plan=professional',
        popular: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: 'contact us',
        description: 'For large organizations with custom needs',
        features: [
            'Everything in Professional',
            'SSO integration',
            'Advanced security',
            'Dedicated support',
            'Custom integrations',
            'SLA guarantee',
        ],
        cta: 'Contact Sales',
        href: '/contact?plan=enterprise',
        popular: false,
    },
]

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <section className="py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the plan that fits your business needs. All plans include our core features with no hidden fees.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl border p-8 ${plan.popular
                                    ? 'border-primary-500 bg-primary-50 shadow-lg'
                                    : 'border-gray-200 bg-white'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {plan.name}
                                    </h3>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold text-gray-900">
                                            {plan.price}
                                        </span>
                                        <span className="text-gray-600 ml-2">
                                            {plan.period}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-gray-600">
                                        {plan.description}
                                    </p>
                                </div>

                                <ul className="mt-8 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <svg
                                                className="w-5 h-5 text-primary-500 mr-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-8">
                                    <Link
                                        href={plan.href}
                                        className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-lg transition-colors font-semibold ${plan.popular
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                                            : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                            }`}
                                    >
                                        {plan.cta}
                                        {plan.name !== 'Enterprise' && (
                                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        )}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Can I change plans anytime?
                            </h3>
                            <p className="text-gray-600">
                                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Is there a free trial?
                            </h3>
                            <p className="text-gray-600">
                                Yes, all paid plans come with a 14-day free trial. No credit card required.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                What payment methods do you accept?
                            </h3>
                            <p className="text-gray-600">
                                We accept all major credit cards, PayPal, and bank transfers for enterprise customers.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}