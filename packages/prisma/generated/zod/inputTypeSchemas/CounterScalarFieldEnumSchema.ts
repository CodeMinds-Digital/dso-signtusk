import { z } from 'zod';

export const CounterScalarFieldEnumSchema = z.enum(['id','value']);

export default CounterScalarFieldEnumSchema;
