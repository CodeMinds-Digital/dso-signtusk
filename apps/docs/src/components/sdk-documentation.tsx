import { CodeBlock } from '@/components/code-block';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Code, Download, ExternalLink, Github, Package } from 'lucide-react';
import Link from 'next/link';

const sdks = [
    {
        language: 'JavaScript/TypeScript',
        packageName: '@signtusk/sdk',
        version: '1.0.0',
        description: 'Official JavaScript/TypeScript SDK with full TypeScript support',
        installation: 'npm install @signtusk/sdk',
        repository: 'https://github.com/docusign-alternative/sdk-js',
        documentation: 'https://docs.docusign-alternative.com/sdk/javascript',
        examples: {
            basic: `import { DocuSignAlternativeSDK } from '@signtusk/sdk';

const client = new DocuSignAlternativeSDK({
  apiKey: 'your_api_key_here',
  baseURL: 'https://api.docusign-alternative.com'
});

// Upload and send for signature
const document = await client.documents.upload({
  file: fileBuffer,
  name: 'Contract Agreement'
});

const signingRequest = await client.signing.createRequest({
  documentId: document.id,
  recipients: [{
    email: 'signer@example.com',
    name: 'John Doe',
    role: 'signer'
  }]
});`,
            advanced: `// Advanced usage with webhooks and templates
const template = await client.templates.create({
  name: 'Employment Contract',
  documentId: document.id,
  fields: [{
    type: 'signature',
    page: 1,
    x: 100,
    y: 200,
    width: 150,
    height: 50,
    recipientRole: 'employee'
  }]
});

// Set up webhook for real-time updates
await client.webhooks.create({
  url: 'https://your-app.com/webhooks/docusign-alternative',
  events: ['document.signed', 'document.completed']
});`
        }
    },
    {
        language: 'Python',
        packageName: 'docusign-alternative-sdk',
        version: '1.0.0',
        description: 'Official Python SDK with async/await support',
        installation: 'pip install docusign-alternative-sdk',
        repository: 'https://github.com/docusign-alternative/sdk-python',
        documentation: 'https://docs.docusign-alternative.com/sdk/python',
        examples: {
            basic: `from docusign_alternative_sdk import DocuSignAlternativeClient

client = DocuSignAlternativeClient(
    api_key='your_api_key_here',
    base_url='https://api.docusign-alternative.com'
)

# Upload and send for signature
with open('contract.pdf', 'rb') as file:
    document = client.documents.upload(
        file=file,
        name='Contract Agreement'
    )

signing_request = client.signing.create_request(
    document_id=document.id,
    recipients=[{
        'email': 'signer@example.com',
        'name': 'John Doe',
        'role': 'signer'
    }]
)`,
            advanced: `# Async usage
import asyncio
from docusign_alternative_sdk import AsyncDocuSignAlternativeClient

async def main():
    async with AsyncDocuSignAlternativeClient(
        api_key='your_api_key_here'
    ) as client:
        # Batch operations
        documents = await asyncio.gather(*[
            client.documents.upload(file=f, name=f'Document {i}')
            for i, f in enumerate(files)
        ])
        
        # Create signing requests for all documents
        requests = await asyncio.gather(*[
            client.signing.create_request(
                document_id=doc.id,
                recipients=recipients
            )
            for doc in documents
        ])

asyncio.run(main())`
        }
    },
    {
        language: 'PHP',
        packageName: 'docusign-alternative/sdk',
        version: '1.0.0',
        description: 'Official PHP SDK with PSR-4 autoloading',
        installation: 'composer require docusign-alternative/sdk',
        repository: 'https://github.com/docusign-alternative/sdk-php',
        documentation: 'https://docs.docusign-alternative.com/sdk/php',
        examples: {
            basic: `<?php
require_once 'vendor/autoload.php';

use DocuSignAlternative\\SDK\\DocuSignAlternativeSDK;

$client = new DocuSignAlternativeSDK([
    'apiKey' => 'your_api_key_here',
    'baseURL' => 'https://api.docusign-alternative.com'
]);

// Upload and send for signature
$document = $client->documents->upload([
    'file' => file_get_contents('contract.pdf'),
    'name' => 'Contract Agreement'
]);

$signingRequest = $client->signing->createRequest([
    'documentId' => $document->id,
    'recipients' => [[
        'email' => 'signer@example.com',
        'name' => 'John Doe',
        'role' => 'signer'
    ]]
]);`,
            advanced: `// Using Laravel integration
use DocuSignAlternative\\Laravel\\Facades\\DocuSignAlternative;

class ContractController extends Controller
{
    public function sendContract(Request $request)
    {
        $document = DocuSignAlternative::documents()->upload([
            'file' => $request->file('contract'),
            'name' => $request->input('name')
        ]);

        $signingRequest = DocuSignAlternative::signing()->createRequest([
            'documentId' => $document->id,
            'recipients' => $request->input('recipients'),
            'callbackUrl' => route('contract.callback')
        ]);

        return response()->json($signingRequest);
    }
}`
        }
    },
    {
        language: 'C# (.NET)',
        packageName: 'DocuSignAlternative.SDK',
        version: '1.0.0',
        description: 'Official .NET SDK with async/await and dependency injection support',
        installation: 'dotnet add package DocuSignAlternative.SDK',
        repository: 'https://github.com/docusign-alternative/sdk-dotnet',
        documentation: 'https://docs.docusign-alternative.com/sdk/dotnet',
        examples: {
            basic: `using DocuSignAlternative.SDK;

var client = new DocuSignAlternativeClient(new DocuSignAlternativeOptions
{
    ApiKey = "your_api_key_here",
    BaseUrl = "https://api.docusign-alternative.com"
});

// Upload and send for signature
var document = await client.Documents.UploadAsync(new DocumentUploadRequest
{
    File = fileBytes,
    Name = "Contract Agreement"
});

var signingRequest = await client.Signing.CreateRequestAsync(new SigningRequestCreate
{
    DocumentId = document.Id,
    Recipients = new[]
    {
        new Recipient
        {
            Email = "signer@example.com",
            Name = "John Doe",
            Role = "signer"
        }
    }
});`,
            advanced: `// Dependency injection setup (Program.cs)
builder.Services.AddDocuSignAlternative(options =>
{
    options.ApiKey = builder.Configuration["DocuSignAlternative:ApiKey"];
    options.BaseUrl = builder.Configuration["DocuSignAlternative:BaseUrl"];
});

// Controller usage
[ApiController]
public class DocumentsController : ControllerBase
{
    private readonly IDocuSignAlternativeClient _client;

    public DocumentsController(IDocuSignAlternativeClient client)
    {
        _client = client;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        var document = await _client.Documents.UploadAsync(new DocumentUploadRequest
        {
            File = await file.GetBytesAsync(),
            Name = file.FileName
        });

        return Ok(document);
    }
}`
        }
    }
];

export function SDKDocumentation() {
    return (
        <div className="space-y-8">
            {/* Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Official SDKs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Signtusk provides official SDKs for popular programming languages,
                        making it easy to integrate e-signature functionality into your applications.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sdks.map((sdk) => (
                            <Card key={sdk.language} className="p-4">
                                <div className="space-y-2">
                                    <h3 className="font-semibold">{sdk.language}</h3>
                                    <Badge variant="secondary">{sdk.version}</Badge>
                                    <p className="text-sm text-muted-foreground">
                                        {sdk.description}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={sdk.repository} target="_blank">
                                                <Github className="h-3 w-3 mr-1" />
                                                GitHub
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={sdk.documentation} target="_blank">
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                Docs
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Detailed SDK Documentation */}
            {sdks.map((sdk) => (
                <Card key={sdk.language}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{sdk.language} SDK</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{sdk.version}</Badge>
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={sdk.repository} target="_blank">
                                        <Github className="h-4 w-4 mr-2" />
                                        View on GitHub
                                    </Link>
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Installation */}
                            <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Installation
                                </h3>
                                <CodeBlock
                                    language="bash"
                                    code={sdk.installation}
                                />
                            </div>

                            {/* Examples */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Code className="h-4 w-4" />
                                    Examples
                                </h3>
                                <Tabs defaultValue="basic">
                                    <TabsList>
                                        <TabsTrigger value="basic">Basic Usage</TabsTrigger>
                                        <TabsTrigger value="advanced">Advanced Usage</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="basic" className="mt-4">
                                        <CodeBlock
                                            language={sdk.language.toLowerCase().includes('javascript') ? 'javascript' :
                                                sdk.language.toLowerCase().includes('python') ? 'python' :
                                                    sdk.language.toLowerCase().includes('php') ? 'php' : 'csharp'}
                                            code={sdk.examples.basic}
                                        />
                                    </TabsContent>
                                    <TabsContent value="advanced" className="mt-4">
                                        <CodeBlock
                                            language={sdk.language.toLowerCase().includes('javascript') ? 'javascript' :
                                                sdk.language.toLowerCase().includes('python') ? 'python' :
                                                    sdk.language.toLowerCase().includes('php') ? 'php' : 'csharp'}
                                            code={sdk.examples.advanced}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Links */}
                            <div className="flex gap-4 pt-4 border-t">
                                <Button variant="outline" asChild>
                                    <Link href={sdk.documentation} target="_blank">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Full Documentation
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={sdk.repository} target="_blank">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Examples Repository
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Integration Guides */}
            <Card>
                <CardHeader>
                    <CardTitle>Integration Guides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">Framework Integrations</h3>
                            <ul className="space-y-1 text-sm">
                                <li>• <Link href="/guides/react" className="text-primary hover:underline">React Integration Guide</Link></li>
                                <li>• <Link href="/guides/nextjs" className="text-primary hover:underline">Next.js Integration Guide</Link></li>
                                <li>• <Link href="/guides/laravel" className="text-primary hover:underline">Laravel Integration Guide</Link></li>
                                <li>• <Link href="/guides/django" className="text-primary hover:underline">Django Integration Guide</Link></li>
                                <li>• <Link href="/guides/aspnet" className="text-primary hover:underline">ASP.NET Core Integration Guide</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">Platform Guides</h3>
                            <ul className="space-y-1 text-sm">
                                <li>• <Link href="/guides/aws" className="text-primary hover:underline">AWS Lambda Integration</Link></li>
                                <li>• <Link href="/guides/netlify" className="text-primary hover:underline">Netlify Functions Integration</Link></li>
                                <li>• <Link href="/guides/docker" className="text-primary hover:underline">Docker Deployment Guide</Link></li>
                                <li>• <Link href="/guides/kubernetes" className="text-primary hover:underline">Kubernetes Deployment Guide</Link></li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}