import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, PenTool, Users, Webhook } from 'lucide-react';
import Link from 'next/link';

const featuredEndpoints = [
    {
        title: 'Upload Document',
        method: 'POST',
        path: '/v1/documents',
        description: 'Upload a document for signing with support for multiple formats including PDF, DOCX, and images.',
        icon: FileText,
        category: 'Documents'
    },
    {
        title: 'Create Signing Request',
        method: 'POST',
        path: '/v1/signing/requests',
        description: 'Create a new signing request with recipients, fields, and workflow configuration.',
        icon: PenTool,
        category: 'Signing'
    },
    {
        title: 'List Users',
        method: 'GET',
        path: '/v1/users',
        description: 'Retrieve a paginated list of users in your organization with filtering and sorting options.',
        icon: Users,
        category: 'Users'
    },
    {
        title: 'Configure Webhooks',
        method: 'POST',
        path: '/v1/webhooks',
        description: 'Set up webhook endpoints to receive real-time notifications about document events.',
        icon: Webhook,
        category: 'Webhooks'
    }
];

export function FeaturedEndpoints() {
    return (
        <section className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Featured API Endpoints</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Explore the most commonly used endpoints to get started with Signtusk API.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredEndpoints.map((endpoint) => {
                    const Icon = endpoint.icon;
                    return (
                        <Card key={endpoint.path} className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{endpoint.title}</CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant="outline"
                                                    className={`method-badge ${endpoint.method.toLowerCase()}`}
                                                >
                                                    {endpoint.method}
                                                </Badge>
                                                <code className="text-sm text-muted-foreground">
                                                    {endpoint.path}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    {endpoint.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary">{endpoint.category}</Badge>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/api-reference/${endpoint.category.toLowerCase()}`}>
                                            View Details
                                            <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="text-center">
                <Button size="lg" variant="outline" asChild>
                    <Link href="/api-reference">
                        View All Endpoints
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </section>
    );
}