import { z } from 'zod';

export const ApiTokenAlgorithmSchema = z.enum(['SHA512']);

export type ApiTokenAlgorithmType = `${z.infer<typeof ApiTokenAlgorithmSchema>}`

export default ApiTokenAlgorithmSchema;
