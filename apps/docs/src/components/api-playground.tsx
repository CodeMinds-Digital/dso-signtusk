'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Copy, Check, Settings, Key, Globe } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { useToast } from '@/hooks/use-toast';

interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    category: string;
    parameters?: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean';
        required: boolean;
        description: string;
        example?: string;
    }>;
    requestBody?: {
        type: string;
        example: string;
    };
}

const apiEndpoints: APIEndpoint[] = [
    {
        method: 'GET',
        path: '/v1/documents',
        description: 'List all documents',
        category: 'Documents',
        parameters: [
            { name: 'page', type: 'number', required: false, description: 'Page number', example: '1' },
            { name: 'limit', type: 'number', required: false, description: 'Items per page', example: '20' },
            { name: 'sort', type: 'string', required: false, description: 'Sort field', example: 'createdAt' }
        ]
    },
    {
        method: 'POST',
        path: '/v1/documents',
        description: 'Upload a new document',
        category: 'Documents',
        requestBody: {
            type: 'multipart/form-data',
            example: '{\n  "name": "Contract Agreement",\n  "file": "[File data]"\n}'
        }
    },
    {
        method: 'GET',
        path: '/v1/documents/{id}',
        description: 'Get document by ID',
        category: 'Documents',
        parameters: [
            { name: 'id', type: 'string', required: true, description: 'Document ID', example: 'doc_123' }
        ]
    },
    {
        method: 'POST',
        path: '/v1/signing/requests',
        description: 'Create a signing request',
        category: 'Signing',
        requestBody: {
            type: 'application/json',
            example: '{\n  "documentId": "doc_123",\n  "recipients": [\n    {\n      "email": "signer@example.com",\n      "name": "John Doe",\n      "role": "signer"\n    }\n  ]\n}'
        }
    },
    {
        method: 'GET',
        path: '/v1/signing/requests/{id}',
        description: 'Get signing request status',
        category: 'Signing',
        parameters: [
            { name: 'id', type: 'string', required: true, description: 'Signing request ID', example: 'req_123' }
        ]
    },
    {
        method: 'GET',
        path: '/v1/templates',
        description: 'List templates',
        category: 'Templates',
        parameters: [
            { name: 'page', type: 'number', required: false, description: 'Page number', example: '1' },
            { name: 'limit', type: 'number', required: false, description: 'Items per page', example: '20' }
        ]
    }
];

export function APIPlayground() {
    const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint>(apiEndpoints[0]);
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('https://api.docusign-alternative.com');
    const [parameters, setParameters] = useState<Record<string, string>>({});
    const [requestBody, setRequestBody] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const categories = Array.from(new Set(apiEndpoints.map(e => e.category)));

    const handleParameterChange = (name: string, value: string) => {
        setParameters(prev => ({ ...prev, [name]: value }));
    };

    const buildUrl = () => {
        let url = baseUrl + selectedEndpoint.path;

        // Replace path parameters
        Object.entries(parameters).forEach(([key, value]) => {
            if (url.includes(`{${key}}`)) {
                url = url.replace(`{${key}}`, value);
            }
        });

        // Add query parameters
        const queryParams = new URLSearchParams();
        selectedEndpoint.parameters?.forEach(param => {
            if (param.name in parameters && parameters[param.name] && !url.includes(`{${param.name}}`)) {
                queryParams.append(param.name, parameters[param.name]);
            }
        });

        if (queryParams.toString()) {
            url += '?' + queryParams.toString();
        }

        return url;
    };

    const executeRequest = async () => {
        if (!apiKey) {
            toast({
                title: 'API Key Required',
                description: 'Please enter your API key to test the endpoint.',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);
        setResponse(null);

        try {
            const url = buildUrl();
            const headers: Record<string, string> = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };

            const options: RequestInit = {
                method: selectedEndpoint.method,
                headers
            };

            if (selectedEndpoint.requestBody && requestBody) {
                options.body = requestBody;
            }

            // Simulate API call (in real implementation, this would make actual API calls)
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockResponse = {
                status: 200,
                data: {
                    message: 'This is a mock response. In production, this would be the actual API response.',
                    endpoint: selectedEndpoint.path,
                    method: selectedEndpoint.method,
                    timestamp: new Date().toISOString()
                }
            };

            setResponse(JSON.stringify(mockResponse, null, 2));

            toast({
                title: 'Request Successful',
                description: 'API request completed successfully.'
            });
        } catch (error) {
            const errorResponse = {
                error: 'Request failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            setResponse(JSON.stringify(errorResponse, null, 2));

            toast({
                title: 'Request Failed',
                description: 'There was an error executing the API request.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: 'Copied to clipboard',
            description: 'The code has been copied to your clipboard.'
        });
    };

    const generateCurlCommand = () => {
        const url = buildUrl();
        let curl = `curl -X ${selectedEndpoint.method} "${url}" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;

        if (selectedEndpoint.requestBody && requestBody) {
            curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody}'`;
        }

        return curl;
    };

    return (
        <div className="space-y-6">
            {/* Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey" className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                API Key
                            </Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="Enter your API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="baseUrl" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Base URL
                            </Label>
                            <Select value={baseUrl} onValueChange={setBaseUrl}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="https://api.docusign-alternative.com">Production</SelectItem>
                                    <SelectItem value="https://api-staging.docusign-alternative.com">Staging</SelectItem>
                                    <SelectItem value="http://localhost:8080">Local Development</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Request</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Endpoint Selection */}
                        <div className="space-y-2">
                            <Label>Endpoint</Label>
                            <Select
                                value={`${selectedEndpoint.method}:${selectedEndpoint.path}`}
                                onValueChange={(value) => {
                                    const [method, path] = value.split(':');
                                    const endpoint = apiEndpoints.find(e => e.method === method && e.path === path);
                                    if (endpoint) {
                                        setSelectedEndpoint(endpoint);
                                        setParameters({});
                                        setRequestBody(endpoint.requestBody?.example || '');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(category => (
                                        <div key={category}>
                                            <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                                                {category}
                                            </div>
                                            {apiEndpoints
                                                .filter(e => e.category === category)
                                                .map(endpoint => (
                                                    <SelectItem
                                                        key={`${endpoint.method}:${endpoint.path}`}
                                                        value={`${endpoint.method}:${endpoint.path}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={`method-badge ${endpoint.method.toLowerCase()}`}
                                                            >
                                                                {endpoint.method}
                                                            </Badge>
                                                            <span>{endpoint.path}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`method-badge ${selectedEndpoint.method.toLowerCase()}`}>
                                {selectedEndpoint.method}
                            </Badge>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                                {buildUrl()}
                            </code>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {selectedEndpoint.description}
                        </p>

                        {/* Parameters */}
                        {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                            <div className="space-y-3">
                                <Label>Parameters</Label>
                                {selectedEndpoint.parameters.map(param => (
                                    <div key={param.name} className="space-y-1">
                                        <Label htmlFor={param.name} className="text-sm">
                                            {param.name}
                                            {param.required && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                        <Input
                                            id={param.name}
                                            placeholder={param.example || `Enter ${param.name}`}
                                            value={parameters[param.name] || ''}
                                            onChange={(e) => handleParameterChange(param.name, e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {param.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Request Body */}
                        {selectedEndpoint.requestBody && (
                            <div className="space-y-2">
                                <Label>Request Body</Label>
                                <Textarea
                                    placeholder="Enter request body"
                                    value={requestBody}
                                    onChange={(e) => setRequestBody(e.target.value)}
                                    rows={8}
                                    className="font-mono text-sm"
                                />
                            </div>
                        )}

                        <Button
                            onClick={executeRequest}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                'Executing...'
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Execute Request
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Response */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Response
                            {response && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(response)}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {response ? (
                            <CodeBlock language="json" code={response} />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Execute a request to see the response here
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Code Generation */}
            <Card>
                <CardHeader>
                    <CardTitle>Generated Code</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="curl">
                        <TabsList>
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                            <TabsTrigger value="python">Python</TabsTrigger>
                        </TabsList>
                        <TabsContent value="curl" className="mt-4">
                            <div className="relative">
                                <CodeBlock language="bash" code={generateCurlCommand()} />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(generateCurlCommand())}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="javascript" className="mt-4">
                            <CodeBlock
                                language="javascript"
                                code={`// Using the Signtusk SDK
const response = await client.${selectedEndpoint.category.toLowerCase()}.${selectedEndpoint.method.toLowerCase()}('${selectedEndpoint.path}');`}
                            />
                        </TabsContent>
                        <TabsContent value="python" className="mt-4">
                            <CodeBlock
                                language="python"
                                code={`# Using the Signtusk Python SDK
response = client.${selectedEndpoint.category.toLowerCase()}.${selectedEndpoint.method.toLowerCase()}('${selectedEndpoint.path}')`}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}