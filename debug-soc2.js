const { SOC2ComplianceManager, SOC2ControlStatus } = require('./packages/compliance/src/soc2.ts');

async function debug() {
    const manager = new SOC2ComplianceManager();

    // Test the failing case
    await manager.assessControl('CC6.1', 'implemented', [], 'a@a.aa');

    const isValid = manager.validateControlImplementation('CC6.1');
    const shouldBeValid = 'implemented' === 'implemented' && [].length > 0;

    console.log('isValid:', isValid);
    console.log('shouldBeValid:', shouldBeValid);
    console.log('Evidence length:', [].length);
    console.log('Status check:', 'implemented' === 'implemented');
}

debug().catch(console.error);