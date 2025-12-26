# @signtusk/ai

AI-powered features package providing intelligent document processing and analysis capabilities.

## Features

### 🔍 Automatic Field Detection
- Computer vision-based form field detection
- OCR text recognition and analysis
- Intelligent field type classification (signature, date, text, checkbox, etc.)
- Contextual field labeling and property suggestions

### 📊 Document Classification
- Machine learning-based document categorization
- Multi-algorithm ensemble classification (Naive Bayes, keyword matching, structure analysis)
- Support for contracts, invoices, legal documents, and more
- Confidence scoring and category hierarchies

### 👥 Smart Recipient Suggestions
- Usage pattern analysis for recipient recommendations
- Document content analysis for role-based suggestions
- Organization directory integration
- Historical data and email pattern analysis

### 📝 Content Analysis & NLP
- Natural language processing for document insights
- Text analysis (readability, complexity, structure)
- Language detection and sentiment analysis
- Entity extraction (persons, organizations, dates, amounts)
- Keyword and phrase extraction
- Automated content insights and recommendations

## Installation

```bash
npm install @signtusk/ai
```

## Usage

### Basic AI Analysis

```typescript
import { AIService } from '@signtusk/ai';

const aiService = new AIService(db, storageService, pdfService);

// Comprehensive document analysis
const results = await aiService.analyzeDocument(documentId, organizationId);

console.log('Field Detection:', results.fieldDetection);
console.log('Classification:', results.classification);
console.log('Recipient Suggestions:', results.recipientSuggestion);
console.log('Content Analysis:', results.contentAnalysis);
```

### Individual Services

```typescript
import {
  FieldDetectionService,
  DocumentClassificationService,
  RecipientSuggestionService,
  ContentAnalysisService
} from '@signtusk/ai';

// Field detection
const fieldService = new FieldDetectionService(db, storageService, pdfService);
const fields = await fieldService.detectFields(documentId, organizationId);

// Document classification
const classificationService = new DocumentClassificationService(db, storageService);
const classification = await classificationService.classifyDocument(documentId, organizationId);

// Recipient suggestions
const recipientService = new RecipientSuggestionService(db);
const suggestions = await recipientService.suggestRecipients(documentId, organizationId);

// Content analysis
const contentService = new ContentAnalysisService(db, storageService);
const analysis = await contentService.analyzeContent(documentId, organizationId);
```

## API Reference

### AIService

Main orchestrator for all AI features.

#### Methods

- `analyzeDocument(documentId, organizationId, options?)` - Comprehensive analysis
- `detectFields(documentId, organizationId)` - Field detection only
- `classifyDocument(documentId, organizationId)` - Classification only
- `suggestRecipients(documentId, organizationId)` - Recipient suggestions only
- `analyzeContent(documentId, organizationId)` - Content analysis only
- `getAnalysisHistory(documentId, organizationId, analysisType?)` - Get past analyses
- `getAIInsights(organizationId, options?)` - Get AI-generated insights

### FieldDetectionService

Computer vision-based field detection.

#### Features
- PDF to image conversion
- OCR text extraction
- Pattern recognition for different field types
- Coordinate mapping and field positioning
- Context analysis and semantic labeling

### DocumentClassificationService

Machine learning document classification.

#### Supported Categories
- Contracts (Service Agreement, Employment Contract, Lease Agreement, etc.)
- Legal Documents (Power of Attorney, Will/Testament, Affidavit, etc.)
- Financial Documents (Invoice, Receipt, Loan Agreement, etc.)
- HR Documents (Job Offer, Performance Review, etc.)
- Insurance Documents
- Real Estate Documents
- Business Documents (NDA, Terms of Service, etc.)

### RecipientSuggestionService

Intelligent recipient recommendations.

#### Data Sources
- Document content analysis
- Historical usage patterns
- Organization directory
- Email pattern analysis

### ContentAnalysisService

Natural language processing and content insights.

#### Analysis Types
- Text structure and readability
- Language detection
- Sentiment analysis
- Entity extraction
- Keyword extraction
- Content insights generation

## Configuration

### Dependencies

The AI package requires several external libraries:

```json
{
  "sharp": "Image processing",
  "tesseract.js": "OCR capabilities",
  "natural": "Natural language processing",
  "compromise": "Text analysis",
  "ml-matrix": "Machine learning utilities",
  "opencv4nodejs": "Computer vision (optional)"
}
```

### Environment Setup

For optimal performance, ensure you have:

1. **Image Processing**: Sharp for image manipulation
2. **OCR**: Tesseract.js for text recognition
3. **ML Libraries**: Natural and compromise for NLP
4. **Computer Vision**: OpenCV (optional, for advanced field detection)

## Performance Considerations

### Processing Times
- Field Detection: ~2-5 seconds per page
- Document Classification: ~0.5-1 second
- Recipient Suggestions: ~0.2-0.5 seconds
- Content Analysis: ~1-3 seconds

### Optimization Tips
1. **Parallel Processing**: Use the main `analyzeDocument` method for parallel analysis
2. **Caching**: Results are automatically cached in the database
3. **Image Quality**: Higher resolution images improve field detection accuracy
4. **Text Quality**: Clean, well-formatted text improves all analyses

## Testing

The package includes comprehensive property-based tests:

```bash
npm test
```

### Test Coverage
- Confidence score validation
- Deterministic result verification
- Edge case handling
- Data integrity checks
- Performance consistency

## Error Handling

All services include robust error handling:

```typescript
try {
  const result = await aiService.analyzeDocument(documentId, organizationId);
  // Handle success
} catch (error) {
  if (error.message === 'Document not found') {
    // Handle missing document
  } else {
    // Handle other errors
  }
}
```

## Contributing

1. Follow the existing code structure
2. Add comprehensive tests for new features
3. Update type definitions
4. Document new functionality

## License

Part of the Signtusk project.