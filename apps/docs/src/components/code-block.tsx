'use client';

import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';

interface CodeBlockProps {
    language: string;
    code: string;
    className?: string;
}

export function CodeBlock({ language, code, className = '' }: CodeBlockProps) {
    useEffect(() => {
        Prism.highlightAll();
    }, [code, language]);

    return (
        <div className={`relative ${className}`}>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code className={`language-${language}`}>
                    {code}
                </code>
            </pre>
        </div>
    );
}