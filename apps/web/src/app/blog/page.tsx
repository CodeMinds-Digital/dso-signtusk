import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Blog - Digital Signature Insights',
    description: 'Stay updated with the latest trends, tips, and insights about digital signatures, document management, and e-signature compliance.',
    openGraph: {
        title: 'Blog - Signtusk',
        description: 'Digital signature insights and industry trends',
        images: ['/og-blog.jpg'],
    },
}

// Static generation
export const revalidate = 3600 // Revalidate every hour

// Mock blog posts - in a real app, this would come from a CMS or markdown files
const blogPosts = [
    {
        id: 1,
        title: 'The Future of Digital Signatures: Trends to Watch in 2024',
        excerpt: 'Explore the emerging trends shaping the digital signature industry, from AI-powered document processing to enhanced security protocols.',
        author: 'Sarah Johnson',
        date: '2024-01-15',
        readTime: '5 min read',
        category: 'Industry Trends',
        image: '/blog/digital-signatures-2024.jpg',
        slug: 'future-digital-signatures-2024',
    },
    {
        id: 2,
        title: 'Understanding eIDAS Compliance: A Complete Guide',
        excerpt: 'Learn everything you need to know about eIDAS regulation and how it affects your digital signature implementation in the EU.',
        author: 'Michael Chen',
        date: '2024-01-10',
        readTime: '8 min read',
        category: 'Compliance',
        image: '/blog/eidas-compliance.jpg',
        slug: 'eidas-compliance-guide',
    },
    {
        id: 3,
        title: 'How to Reduce Document Turnaround Time by 90%',
        excerpt: 'Discover proven strategies to accelerate your document signing process and improve business efficiency.',
        author: 'Emily Rodriguez',
        date: '2024-01-05',
        readTime: '6 min read',
        category: 'Best Practices',
        image: '/blog/reduce-turnaround-time.jpg',
        slug: 'reduce-document-turnaround-time',
    },
    {
        id: 4,
        title: 'Security Best Practices for Digital Document Management',
        excerpt: 'Essential security measures to protect your sensitive documents and maintain compliance with industry standards.',
        author: 'David Kim',
        date: '2023-12-28',
        readTime: '7 min read',
        category: 'Security',
        image: '/blog/security-best-practices.jpg',
        slug: 'security-best-practices-digital-documents',
    },
    {
        id: 5,
        title: 'API Integration Guide: Automating Your Signature Workflow',
        excerpt: 'Step-by-step guide to integrating our API into your existing systems for seamless document automation.',
        author: 'Alex Thompson',
        date: '2023-12-20',
        readTime: '10 min read',
        category: 'Development',
        image: '/blog/api-integration-guide.jpg',
        slug: 'api-integration-signature-workflow',
    },
    {
        id: 6,
        title: 'Remote Work and Digital Signatures: A Perfect Match',
        excerpt: 'How digital signatures are enabling remote work and transforming business operations in the post-pandemic world.',
        author: 'Lisa Wang',
        date: '2023-12-15',
        readTime: '4 min read',
        category: 'Remote Work',
        image: '/blog/remote-work-digital-signatures.jpg',
        slug: 'remote-work-digital-signatures',
    },
]

const categories = ['All', 'Industry Trends', 'Compliance', 'Best Practices', 'Security', 'Development', 'Remote Work']

export default function BlogPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                        Digital Signature Insights
                    </h1>
                    <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                        Stay updated with the latest trends, tips, and insights about digital signatures,
                        document management, and e-signature compliance.
                    </p>
                </div>
            </section>

            {/* Categories */}
            <section className="py-8 border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === 'All'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Post */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Article</h2>
                    </div>

                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl overflow-hidden">
                        <div className="p-8 md:p-12 text-white">
                            <div className="flex items-center mb-4">
                                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                                    {blogPosts[0].category}
                                </span>
                                <span className="ml-4 text-blue-100">{blogPosts[0].readTime}</span>
                            </div>

                            <h3 className="text-3xl font-bold mb-4 leading-tight">
                                {blogPosts[0].title}
                            </h3>

                            <p className="text-xl text-blue-100 mb-6 leading-relaxed">
                                {blogPosts[0].excerpt}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-sm font-semibold">
                                            {blogPosts[0].author.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-medium">{blogPosts[0].author}</div>
                                        <div className="text-blue-100 text-sm">{blogPosts[0].date}</div>
                                    </div>
                                </div>

                                <Link
                                    href={`/blog/${blogPosts[0].slug}`}
                                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    Read Article
                                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog Posts Grid */}
            <section className="pb-20">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Articles</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogPosts.slice(1).map((post) => (
                            <article
                                key={post.id}
                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="aspect-video bg-gray-200 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-80"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="text-sm font-medium">{post.category}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center mb-3">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                            {post.category}
                                        </span>
                                        <span className="ml-auto text-gray-500 text-sm">{post.readTime}</span>
                                    </div>

                                    <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="hover:text-blue-600 transition-colors"
                                        >
                                            {post.title}
                                        </Link>
                                    </h3>

                                    <p className="text-gray-600 mb-4 leading-relaxed">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-xs font-semibold text-gray-600">
                                                    {post.author.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{post.author}</div>
                                                <div className="text-xs text-gray-500">{post.date}</div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                        >
                                            Read more →
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter Signup */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Stay Updated
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Get the latest insights about digital signatures and document management delivered to your inbox.
                    </p>

                    <div className="max-w-md mx-auto">
                        <div className="flex gap-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                                Subscribe
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            No spam. Unsubscribe at any time.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}