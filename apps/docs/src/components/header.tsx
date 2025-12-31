'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">DA</span>
                        </div>
                        <span className="font-bold text-lg">Signtusk</span>
                    </Link>
                    <span className="text-muted-foreground text-sm">API Documentation</span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link
                        href="/api-reference"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        API Reference
                    </Link>
                    <Link
                        href="/guides"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Guides
                    </Link>
                    <Link
                        href="/sdks"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        SDKs
                    </Link>
                    <Link
                        href="/playground"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Playground
                    </Link>
                    <Link
                        href="/examples"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Examples
                    </Link>
                </nav>

                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link
                            href="https://github.com/docusign-alternative/api"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Github className="h-4 w-4" />
                            <span className="sr-only">GitHub</span>
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href="https://app.docusign-alternative.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Try it Live
                        </Link>
                    </Button>

                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-background">
                    <nav className="container px-4 py-4 space-y-4">
                        <Link
                            href="/api-reference"
                            className="block text-sm font-medium hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            API Reference
                        </Link>
                        <Link
                            href="/guides"
                            className="block text-sm font-medium hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Guides
                        </Link>
                        <Link
                            href="/sdks"
                            className="block text-sm font-medium hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            SDKs
                        </Link>
                        <Link
                            href="/playground"
                            className="block text-sm font-medium hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Playground
                        </Link>
                        <Link
                            href="/examples"
                            className="block text-sm font-medium hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Examples
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}