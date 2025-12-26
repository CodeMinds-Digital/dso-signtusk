'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Play } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';

const quickStartExamples = {
    curl: `# 1. Get your API key from the dashboard
export API_KEY="your_api_key_here"

# 2. Upload a document
curl -X POST "https://api.docusign-alternative.com/v1/documents" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@contract.pdf" \\
  -F "name=Contract Agreement"

# 3. Create a signing request
curl -X POST "https://api.docusign-alternative.com/v1/signing/requests" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "documentId": "doc_123",
    "recipients": [
      {
        "email": "signer@example.com",
        "name": "John Doe",
        "role": "signer"
      }
    ]
  }'`,
    javascript: `import { DocuSignAlternativeSDK } from '@signtusk/sdk';

// Initialize the SDK
const client = new DocuSignAlternativeSDK({
  apiKey: 'your_api_key_here',
  baseURL: 'https://api.docusign-alternative.com'
});

// Upload a document
const document = await client.documents.upload({
  file: fileBuffer,
  name: 'Contract Agreement'
});

// Create a signing request
const signingRequest = await client.signing.createRequest({
  documentId: document.id,
  recipients: [
    {
      email: 'signer@example.com',
      name: 'John Doe',
      role: 'signer'
    }
  ]
});

console.log('Signing URL:', signingRequest.signingUrl);`,
    python: `from docusign_alternative_sdk import DocuSignAlternativeClient

# Initialize the client
client = DocuSignAlternativeClient(
    api_key='your_api_key_here',
    base_url='https://api.docusign-alternative.com'
)

# Upload a document
with open('contract.pdf', 'rb') as file:
    document = client.documents.upload(
        file=file,
        name='Contract Agreement'
    )

# Create a signing request
signing_request = client.signing.create_request(
    document_id=document.id,
    recipients=[
        {
            'email': 'signer@example.com',
            'name': 'John Doe',
            'role': 'signer'
        }
    ]
)

print(f"Signing URL: {signing_request.signing_url}")`,
    php: `<?php
require_once 'vendor/autoload.php';

use DocuSignAlternative\\SDK\\DocuSignAlternativeSDK;

// Initialize the SDK
$client = new DocuSignAlternativeSDK([
    'apiKey' => 'your_api_key_here',
    'baseURL' => 'https://api.docusign-alternative.com'
]);

// Upload a document
$document = $client->documents->upload([
    'file' => file_get_contents('contract.pdf'),
    'name' => 'Contract Agreement'
]);

// Create a signing request
$signingRequest = $client->signing->createRequest([
    'documentId' => $document->id,
    'recipients' => [
        [
            'email' => 'signer@example.com',
            'name' => 'John Doe',
            'role' => 'signer'
        ]
    ]
]);

echo "Signing URL: " . $signingRequest->signingUrl;`
};

export function QuickStart() {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const copyToClipboard = async (code: string, language: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(language);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <section className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Quick Start</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Get started with Signtusk API in minutes. Choose your preferred language and follow the examples below.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Your First API Call
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="javascript" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                            <TabsTrigger value="python">Python</TabsTrigger>
                            <TabsTrigger value="php">PHP</TabsTrigger>
                        </TabsList>

                        {Object.entries(quickStartExamples).map(([language, code]) => (
                            <TabsContent key={language} value={language} className="mt-4">
                                <div className="relative">
                                    <CodeBlock
                                        language={language === 'curl' ? 'bash' : language}
                                        code={code}
                                    />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute top-2 right-2"
                                        onClick={() => copyToClipboard(code, language)}
                                    >
                                        {copiedCode === language ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Next Steps:</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <a href="/guides/authentication" className="text-primary hover:underline">Set up authentication</a></li>
                            <li>• <a href="/guides/webhooks" className="text-primary hover:underline">Configure webhooks for real-time updates</a></li>
                            <li>• <a href="/api-reference/documents" className="text-primary hover:underline">Explore document management endpoints</a></li>
                            <li>• <a href="/playground" className="text-primary hover:underline">Test APIs in the interactive playground</a></li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}