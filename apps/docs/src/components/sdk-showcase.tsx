import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Download, Star } from 'lucide-react';
import Link from 'next/link';

const sdkShowcase = [
    {
        language: 'JavaScript',
        description: 'Full TypeScript support with modern async/await patterns',
        installation: 'npm install @signtusk/sdk',
        features: ['TypeScript Support', 'Promise-based', 'Tree-shakeable', 'Browser & Node.js'],
        popularity: 'Most Popular'
    },
    {
        language: 'Python',
        description: 'Pythonic API with async support and comprehensive error handling',
        installation: 'pip install docusign-alternative-sdk',
        features: ['Async/Await', 'Type Hints', 'Pydantic Models', 'Django Integration'],
        popularity: 'Developer Favorite'
    },
    {
        language: 'PHP',
        description: 'PSR-4 compliant with Laravel and Symfony integrations',
        installation: 'composer require docusign-alternative/sdk',
        features: ['PSR-4 Autoloading', 'Laravel Support', 'Guzzle HTTP', 'PHP 8+ Ready'],
        popularity: 'Enterprise Ready'
    },
    {
        language: 'C#',
        description: '.NET Standard 2.0 with dependency injection and async patterns',
        installation: 'dotnet add package DocuSignAlternative.SDK',
        features: ['.NET Standard 2.0', 'Dependency Injection', 'Async/Await', 'Strong Typing'],
        popularity: 'Enterprise Grade'
    }
];

export function SDKShowcase() {
    return (
        <section className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Official SDKs</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Get started quickly with our official SDKs. Built with modern best practices and comprehensive documentation.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sdkShowcase.map((sdk) => (
                    <Card key={sdk.language} className="group hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {sdk.language}
                                        {sdk.popularity === 'Most Popular' && (
                                            <Badge variant="default" className="bg-yellow-500 text-yellow-50">
                                                <Star className="h-3 w-3 mr-1" />
                                                Popular
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {sdk.description}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-3 rounded-lg">
                                <code className="text-sm">{sdk.installation}</code>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Key Features:</h4>
                                <div className="flex flex-wrap gap-1">
                                    {sdk.features.map((feature) => (
                                        <Badge key={feature} variant="secondary" className="text-xs">
                                            {feature}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Badge variant="outline">{sdk.popularity}</Badge>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/sdks/${sdk.language.toLowerCase()}`}>
                                            <Download className="h-3 w-3 mr-1" />
                                            Install
                                        </Link>
                                    </Button>
                                    <Button size="sm" variant="ghost" asChild>
                                        <Link href={`/sdks/${sdk.language.toLowerCase()}/docs`}>
                                            Docs
                                            <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="text-center">
                <Button size="lg" asChild>
                    <Link href="/sdks">
                        View All SDKs & Documentation
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </section>
    );
}