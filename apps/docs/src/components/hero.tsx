import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Globe, Code } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
    return (
        <div className="text-center space-y-8">
            <div className="space-y-4">
                <Badge variant="secondary" className="px-3 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    v1.0.0 - Production Ready
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                    Signtusk
                    <span className="block text-primary">API Documentation</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Build powerful e-signature workflows with our comprehensive REST API.
                    Enterprise-grade security, global compliance, and developer-friendly tools.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                    <Link href="/api-reference">
                        Explore API Reference
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="/playground">
                        Try API Playground
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <Card>
                    <CardContent className="p-6 text-center">
                        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
                        <p className="text-muted-foreground text-sm">
                            SOC 2 compliant with advanced encryption, HSM integration, and comprehensive audit trails.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Global Compliance</h3>
                        <p className="text-muted-foreground text-sm">
                            eIDAS, ESIGN Act, and 21 CFR Part 11 compliant signatures accepted worldwide.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <Code className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Developer First</h3>
                        <p className="text-muted-foreground text-sm">
                            Comprehensive SDKs, interactive playground, and detailed examples for rapid integration.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}