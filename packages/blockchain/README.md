# @signtusk/blockchain

Comprehensive blockchain integration package for the Signtusk platform, providing immutable document storage, audit trails, smart contract automation, and cryptocurrency payment processing.

## Features

- **Document Hash Storage**: Store document hashes on blockchain for immutability verification
- **Immutable Audit Trail**: Cryptographically secured audit records with chain integrity
- **Smart Contract Integration**: Automated workflow execution using blockchain smart contracts
- **Multi-Currency Payments**: Support for Bitcoin, Ethereum, Solana, and other cryptocurrencies
- **Multi-Network Support**: Ethereum, Polygon, Solana, Bitcoin, BSC, and Avalanche networks
- **Enterprise Security**: Hardware security module integration and zero-trust architecture

## Installation

```bash
npm install @signtusk/blockchain
```

## Quick Start

```typescript
import { 
  createBlockchainManager, 
  initializeBlockchainProviders,
  BlockchainNetwork 
} from '@signtusk/blockchain';

// Create and initialize blockchain manager
const manager = createBlockchainManager();
await initializeBlockchainProviders(manager);

// Store document hash on blockchain
const documentHash = await manager.storeDocumentHash(
  'doc-123',
  'a1b2c3d4e5f6...' // SHA-256 hash
);

// Create immutable audit event
const auditEvent = await manager.createImmutableAuditEvent({
  id: 'audit-456',
  eventType: 'DOCUMENT_SIGNED',
  documentId: 'doc-123',
  userId: 'user-789',
  organizationId: 'org-101',
  eventData: { signedBy: 'John Doe', timestamp: new Date() },
  blockchainNetwork: BlockchainNetwork.ETHEREUM,
  timestamp: new Date()
});

// Process cryptocurrency payment
const payment = await manager.processPayment({
  paymentId: 'pay-123',
  currency: 'ETH',
  amount: '0.1',
  fromAddress: '0x...',
  toAddress: '0x...',
  network: BlockchainNetwork.ETHEREUM,
  requiredConfirmations: 6
});
```

## Configuration

Configure blockchain networks using environment variables:

```bash
# Ethereum Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_PRIVATE_KEY=0x...
ETHEREUM_CONTRACT_ADDRESS=0x...
ETHEREUM_GAS_LIMIT=21000
ETHEREUM_GAS_PRICE=20

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=...
SOLANA_PROGRAM_ID=...

# General Configuration
BLOCKCHAIN_DEFAULT_NETWORK=ethereum
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_CONFIRMATIONS=6
```

## Document Hash Storage

Store document hashes on blockchain for immutability verification:

```typescript
import { generateDocumentHash } from '@signtusk/blockchain';

// Generate hash from document content
const documentContent = Buffer.from('PDF content...');
const hash = generateDocumentHash(documentContent, 'sha256');

// Store on blockchain
const result = await manager.storeDocumentHash(
  'document-id-123',
  hash,
  BlockchainNetwork.ETHEREUM
);

console.log('Transaction Hash:', result.transactionHash);
console.log('Block Number:', result.blockNumber);
```

## Immutable Audit Trail

Create cryptographically secured audit records:

```typescript
// Create audit event
const auditEvent = await manager.createImmutableAuditEvent({
  id: crypto.randomUUID(),
  eventType: 'DOCUMENT_CREATED',
  documentId: 'doc-123',
  userId: 'user-456',
  organizationId: 'org-789',
  eventData: {
    action: 'document_upload',
    filename: 'contract.pdf',
    size: 1024000,
    metadata: { department: 'legal' }
  },
  blockchainNetwork: BlockchainNetwork.ETHEREUM,
  timestamp: new Date()
});

// Verify audit trail integrity
const isValid = await manager.verifyAuditTrail('doc-123');
console.log('Audit trail valid:', isValid);
```

## Smart Contract Workflows

Deploy and execute smart contracts for automated workflows:

```typescript
// Deploy workflow smart contract
const contract = await manager.deployWorkflowContract({
  id: 'workflow-123',
  name: 'Document Approval Workflow',
  steps: [
    { name: 'review', approvers: ['user1', 'user2'] },
    { name: 'approve', threshold: 2 },
    { name: 'finalize', automated: true }
  ]
}, BlockchainNetwork.ETHEREUM);

// Execute workflow step
const result = await manager.executeWorkflowStep(
  contract.contractAddress,
  'approve',
  { approver: 'user1', decision: 'approved' }
);
```

## Cryptocurrency Payments

Process payments in multiple cryptocurrencies:

```typescript
// Process ETH payment
const ethPayment = await manager.processPayment({
  paymentId: 'payment-123',
  currency: 'ETH',
  amount: '0.05',
  fromAddress: '0x...',
  toAddress: '0x...',
  network: BlockchainNetwork.ETHEREUM,
  requiredConfirmations: 12
});

// Process SOL payment
const solPayment = await manager.processPayment({
  paymentId: 'payment-456',
  currency: 'SOL',
  amount: '1.0',
  fromAddress: '...',
  toAddress: '...',
  network: BlockchainNetwork.SOLANA,
  requiredConfirmations: 1
});

// Get payment history
const payments = await manager.getPaymentHistory('org-123');
```

## Multi-Network Support

The package supports multiple blockchain networks:

```typescript
import { BlockchainNetwork } from '@signtusk/blockchain';

// Supported networks
const networks = [
  BlockchainNetwork.ETHEREUM,      // Ethereum mainnet
  BlockchainNetwork.POLYGON,       // Polygon (Matic)
  BlockchainNetwork.SOLANA,        // Solana
  BlockchainNetwork.BITCOIN,       // Bitcoin
  BlockchainNetwork.BINANCE_SMART_CHAIN, // BSC
  BlockchainNetwork.AVALANCHE      // Avalanche C-Chain
];

// Check network status
const status = await manager.getNetworkStatus();
console.log('Connected networks:', status);
```

## Error Handling

The package provides comprehensive error handling:

```typescript
import { 
  BlockchainError, 
  SmartContractError, 
  PaymentError 
} from '@signtusk/blockchain';

try {
  await manager.storeDocumentHash('doc-123', 'invalid-hash');
} catch (error) {
  if (error instanceof BlockchainError) {
    console.error('Blockchain error:', error.code, error.message);
    console.error('Network:', error.network);
    console.error('Transaction:', error.transactionHash);
  }
}
```

## Testing

The package includes comprehensive test utilities:

```typescript
import { BlockchainConfigManager } from '@signtusk/blockchain';

// Create test configuration
const testConfig = BlockchainConfigManager.createTestConfig(
  BlockchainNetwork.ETHEREUM
);

// Use with local blockchain (Ganache, Hardhat, etc.)
const manager = createBlockchainManager({
  ETHEREUM_RPC_URL: 'http://localhost:8545',
  ETHEREUM_PRIVATE_KEY: '0x...',
  BLOCKCHAIN_ENABLED: 'true'
});
```

## Security Considerations

- **Private Key Management**: Never expose private keys in code or logs
- **Network Security**: Use secure RPC endpoints and consider rate limiting
- **Transaction Monitoring**: Monitor for failed transactions and implement retry logic
- **Gas Management**: Set appropriate gas limits and prices to prevent stuck transactions
- **Audit Trail Integrity**: Regularly verify audit trail integrity using `verifyAuditTrail()`

## Performance Optimization

- **Connection Pooling**: Reuse blockchain connections when possible
- **Batch Operations**: Group multiple operations to reduce transaction costs
- **Network Selection**: Choose appropriate networks based on cost and speed requirements
- **Caching**: Cache frequently accessed blockchain data

## Compliance Features

- **Immutable Records**: All blockchain records are immutable and tamper-evident
- **Audit Trail**: Complete audit trail with cryptographic integrity
- **Legal Compliance**: Supports eIDAS, ESIGN Act, and 21 CFR Part 11 requirements
- **Data Integrity**: Cryptographic hashing ensures data integrity verification

## API Reference

### BlockchainManager

Main interface for blockchain operations:

- `storeDocumentHash(documentId, hash, network?)`: Store document hash
- `createImmutableAuditEvent(event)`: Create audit event
- `verifyAuditTrail(documentId)`: Verify audit trail integrity
- `deployWorkflowContract(workflow, network?)`: Deploy smart contract
- `executeWorkflowStep(address, step, data)`: Execute contract method
- `processPayment(payment)`: Process cryptocurrency payment
- `getPaymentHistory(organizationId)`: Get payment history

### Configuration

- `BlockchainConfigManager`: Manages blockchain network configurations
- `createBlockchainManager()`: Factory function for manager creation
- `initializeBlockchainProviders()`: Initialize and connect providers

### Utilities

- `generateDocumentHash()`: Generate cryptographic hash from content
- `validateCryptoAddress()`: Validate cryptocurrency addresses
- `formatCryptoAmount()`: Format cryptocurrency amounts
- `convertCryptoUnits()`: Convert between different units
- `estimateTransactionFee()`: Estimate transaction fees
- `getExplorerUrl()`: Get blockchain explorer URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This package is part of the Signtusk platform and is licensed under the same terms as the main project.

## Support

For support and questions:
- Check the main project documentation
- Review the test files for usage examples
- Open an issue in the main repository