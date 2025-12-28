import { CodeBlock } from '@/components/code-block';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRight,
    BookOpen,
    Code,
    FileText,
    Globe,
    Settings,
    Shield,
    Webhook,
    Zap
} from 'lucide-react';
import Link from 'next/link';

const guides = [
    {
        title: 'Authentication & Security',
        description: 'Learn how to authenticate with the API and implement security best practices',
        icon: Shield,
        difficulty: 'Beginner',
        estimatedTime: '15 min',
        topics: ['API Keys', 'JWT Tokens', 'OAuth 2.0', 'Rate Limiting'],
        href: '/guides/authentication'
    },
    {
        title: 'Webhook Integration',
        description: 'Set up real-time notifications for document events and status changes',
        icon: Webhook,
        difficulty: 'Intermediate',
        estimatedTime: '30 min',
        topics: ['Event Types', 'Signature Verification', 'Retry Logic', 'Testing'],
        href: '/guides/webhooks'
    },
    {
        title: 'Document Workflows',
        description: 'Create complex signing workflows with multiple recipients and approval chains',
        icon: FileText,
        difficulty: 'Intermediate',
        estimatedTime: '45 min',
        topics: ['Sequential Signing', 'Parallel Signing', 'Conditional Logic', 'Templates'],
        href: '/guides/workflows'
    },
    {
        title: 'Error Handling',
        description: 'Implement robust error handling and recovery mechanisms',
        icon: Settings,
        difficulty: 'Intermediate',
        estimatedTime: '20 min',
        topics: ['Error Codes', 'Retry Strategies', 'Logging', 'Monitoring'],
        href: '/guides/error-handling'
    },
    {
        title: 'Compliance & Legal',
        description: 'Ensure your integration meets legal and compliance requirements',
        icon: Globe,
        difficulty: 'Advanced',
        estimatedTime: '60 min',
        topics: ['eIDAS', 'ESIGN Act', '21 CFR Part 11', 'Audit Trails'],
        href: '/guides/compliance'
    },
    {
        title: 'Performance Optimization',
        description: 'Optimize your integration for high-volume document processing',
        icon: Zap,
        difficulty: 'Advanced',
        estimatedTime: '40 min',
        topics: ['Batch Processing', 'Caching', 'Connection Pooling', 'Monitoring'],
        href: '/guides/performance'
    }
];

const quickStartExample = `// Quick start example - Upload and send for signature
import { DocuSignAlternativeSDK } from '@signtusk/sdk';

const client = new DocuSignAlternativeSDK({
  apiKey: process.env.DOCUSIGN_ALTERNATIVE_API_KEY,
  baseURL: 'https://api.docusign-alternative.com'
});

async function sendDocumentForSignature() {
  try {
    // 1. Upload document
    const document = await client.documents.upload({
      file: fs.readFileSync('contract.pdf'),
      name: 'Employment Contract'
    });

    // 2. Create signing request
    const signingRequest = await client.signing.createRequest({
      documentId: document.id,
      recipients: [
        {
          email: 'employee@company.com',
          name: 'John Doe',
          role: 'signer'
        },
        {
          email: 'hr@company.com',
          name: 'HR Manager',
          role: 'approver'
        }
      ],
      message: 'Please review and sign the employment contract.'
    });

    console.log('Signing URL:', signingRequest.signingUrl);
    return signingRequest;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}`;

export function IntegrationGuides() {
    return (
        <div className="space-y-8">
            {/* Quick Start */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Quick Start Example
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Get started with a complete example that uploads a document and sends it for signature.
                    </p>
                    <CodeBlock language="javascript" code={quickStartExample} />
                    <div className="mt-4 flex gap-4">
                        <Button asChild>
                            <Link href="/playground">
                                Try in Playground
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/guides/authentication">
                                Setup Authentication
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Integration Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => {
                    const Icon = guide.icon;
                    return (
                        <Card key={guide.title} className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{guide.title}</CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant={
                                                        guide.difficulty === 'Beginner' ? 'secondary' :
                                                            guide.difficulty === 'Intermediate' ? 'default' : 'destructive'
                                                    }
                                                >
                                                    {guide.difficulty}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {guide.estimatedTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    {guide.description}
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Topics Covered:</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {guide.topics.map((topic) => (
                                                <Badge key={topic} variant="outline" className="text-xs">
                                                    {topic}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <Button className="w-full" asChild>
                                        <Link href={guide.href}>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Read Guide
                                            <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Framework-Specific Guides */}
            <Card>
                <CardHeader>
                    <CardTitle>Framework-Specific Integration Guides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">Frontend Frameworks</h3>
                            <ul className="space-y-1 text-sm">
                                <li>• <Link href="/guides/react" className="text-primary hover:underline">React Integration</Link></li>
                                <li>• <Link href="/guides/vue" className="text-primary hover:underline">Vue.js Integration</Link></li>
                                <li>• <Link href="/guides/angular" className="text-primary hover:underline">Angular Integration</Link></li>
                                <li>• <Link href="/guides/svelte" className="text-primary hover:underline">Svelte Integration</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">Backend Frameworks</h3>
                            <ul className="space-y-1 text-sm">
                                <li>• <Link href="/guides/nextjs" className="text-primary hover:underline">Next.js Integration</Link></li>
                                <li>• <Link href="/guides/express" className="text-primary hover:underline">Express.js Integration</Link></li>
                                <li>• <Link href="/guides/fastapi" className="text-primary hover:underline">FastAPI Integration</Link></li>
                                <li>• <Link href="/guides/django" className="text-primary hover:underline">Django Integration</Link></li>
                                <li>• <Link href="/guides/laravel" className="text-primary hover:underline">Laravel Integration</Link></li>
                                <li>• <Link href="/guides/aspnet" className="text-primary hover:underline">ASP.NET Core Integration</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">Cloud Platforms</h3>
                            <ul className="space-y-1 text-sm">
                                <li>• <Link href="/guides/aws-lambda" className="text-primary hover:underline">AWS Lambda</Link></li>
                                <li>• <Link href="/guides/netlify" className="text-primary hover:underline">Netlify Functions</Link></li>
                                <li>• <Link href="/guides/cloudflare" className="text-primary hover:underline">Cloudflare Workers</Link></li>
                                <li>• <Link href="/guides/azure" className="text-primary hover:underline">Azure Functions</Link></li>
                                <li>• <Link href="/guides/gcp" className="text-primary hover:underline">Google Cloud Functions</Link></li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
                <CardHeader>
                    <CardTitle>Best Practices & Tips</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Security Best Practices
                            </h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Always use HTTPS for API calls</li>
                                <li>• Store API keys securely (environment variables)</li>
                                <li>• Implement proper error handling</li>
                                <li>• Validate webhook signatures</li>
                                <li>• Use least privilege access principles</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Performance Tips
                            </h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Use batch operations for multiple documents</li>
                                <li>• Implement proper caching strategies</li>
                                <li>• Handle rate limits gracefully</li>
                                <li>• Use webhooks instead of polling</li>
                                <li>• Optimize document sizes before upload</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}