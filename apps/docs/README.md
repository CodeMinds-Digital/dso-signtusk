# Signtusk API Documentation

Interactive API documentation and developer portal for Signtusk - a comprehensive, enterprise-grade e-signature platform.

## Features

### 🚀 Interactive API Documentation
- **OpenAPI 3.0 Specification**: Complete API reference with interactive examples
- **API Playground**: Test endpoints directly in the browser with authentication
- **Real-time Response Viewer**: See actual API responses with syntax highlighting
- **Code Generation**: Generate code snippets in multiple languages (cURL, JavaScript, Python, PHP)

### 📚 Comprehensive SDK Documentation
- **Multi-language SDKs**: JavaScript/TypeScript, Python, PHP, C# (.NET)
- **Installation Guides**: Step-by-step setup instructions for each SDK
- **Code Examples**: Basic and advanced usage examples
- **Framework Integrations**: React, Vue, Angular, Laravel, Django, ASP.NET Core

### 🛠 Developer Tools
- **Authentication Testing**: Test API keys and JWT tokens
- **Webhook Simulator**: Test webhook endpoints and signature verification
- **Error Code Reference**: Complete error handling documentation
- **Rate Limiting Guide**: Understanding and handling API limits

### 📖 Integration Guides
- **Quick Start Tutorial**: Get up and running in minutes
- **Best Practices**: Security, performance, and reliability guidelines
- **Framework-specific Guides**: Integration with popular frameworks
- **Compliance Documentation**: Legal requirements and audit trails

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom styling
- **Code Highlighting**: Prism.js with custom themes
- **API Testing**: Axios with request/response interceptors
- **Theme Support**: Light/dark mode with system preference detection

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Access to Signtusk API (for testing)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   ```env
   API_BASE_URL=https://api.docusign-alternative.com
   NEXT_PUBLIC_API_BASE_URL=https://api.docusign-alternative.com
   NEXT_PUBLIC_DEMO_API_KEY=your_demo_api_key
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3003](http://localhost:3003)

## Project Structure

```
apps/docs/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with theme provider
│   │   ├── page.tsx           # Homepage with hero and quick start
│   │   ├── playground/        # Interactive API testing
│   │   ├── sdks/              # SDK documentation
│   │   └── guides/            # Integration guides
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components (Radix UI)
│   │   ├── header.tsx         # Navigation header
│   │   ├── sidebar.tsx        # Documentation sidebar
│   │   ├── api-playground.tsx # Interactive API tester
│   │   ├── code-block.tsx     # Syntax highlighted code
│   │   └── ...                # Feature-specific components
│   ├── lib/                   # Utility functions
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── next.config.js            # Next.js configuration
```

## Key Components

### API Playground (`/playground`)
Interactive API testing interface with:
- Endpoint selection and configuration
- Parameter input with validation
- Request body editor with JSON syntax highlighting
- Real-time response viewer
- Code generation for multiple languages
- Authentication testing with API keys

### SDK Documentation (`/sdks`)
Comprehensive SDK documentation featuring:
- Installation instructions for each language
- Basic and advanced code examples
- Framework-specific integration guides
- API reference with type definitions
- Error handling examples

### Integration Guides (`/guides`)
Step-by-step tutorials covering:
- Authentication and security setup
- Webhook configuration and testing
- Document workflow implementation
- Error handling and retry logic
- Performance optimization
- Compliance and legal requirements

## Development

### Adding New Documentation

1. **Create a new page**:
   ```bash
   # Create new guide
   mkdir -p src/app/guides/new-guide
   touch src/app/guides/new-guide/page.tsx
   ```

2. **Add to navigation**:
   Update `src/components/sidebar.tsx` to include the new page.

3. **Follow the pattern**:
   Use existing pages as templates for consistent structure.

### Customizing the Theme

The documentation uses a custom design system built on Tailwind CSS:

- **Colors**: Defined in `tailwind.config.js` and `globals.css`
- **Components**: Base components in `src/components/ui/`
- **Dark Mode**: Automatic system preference detection with manual toggle

### API Integration

The playground integrates with the actual Signtusk API:

- **Proxy Configuration**: `next.config.js` proxies API calls to avoid CORS
- **Authentication**: Supports API keys and JWT tokens
- **Error Handling**: Comprehensive error display and debugging

## Deployment

### Netlify (Recommended)

1. **Connect your repository** to Netlify
2. **Set environment variables** in the Netlify dashboard
3. **Deploy** - automatic deployments on push to main

### Docker

```bash
# Build the Docker image
docker build -t docusign-alternative-docs .

# Run the container
docker run -p 3003:3003 docusign-alternative-docs
```

### Static Export

```bash
# Generate static files
npm run build
npm run export

# Serve static files
npx serve out
```

## Contributing

### Guidelines

1. **Follow the existing code style** and component patterns
2. **Add TypeScript types** for all new components and functions
3. **Include comprehensive examples** in documentation
4. **Test interactive features** in the playground
5. **Update navigation** when adding new pages

### Code Quality

- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict mode enabled for type safety
- **Accessibility**: WCAG 2.1 AA compliance with Radix UI

## API Reference

The documentation automatically generates API reference from OpenAPI specifications:

- **Source**: `packages/api/src/openapi/spec.ts`
- **Generation**: Automatic during build process
- **Updates**: Sync with API changes automatically

## Support

- **Documentation Issues**: [GitHub Issues](https://github.com/docusign-alternative/docs/issues)
- **API Support**: [API Documentation](https://docs.docusign-alternative.com)
- **Community**: [Discord Server](https://discord.gg/docusign-alternative)

## License

MIT License - see [LICENSE](LICENSE) for details.