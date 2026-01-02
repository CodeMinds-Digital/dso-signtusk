import { z } from 'zod';

/////////////////////////////////////////
// COUNTER SCHEMA
/////////////////////////////////////////

export const CounterSchema = z.object({
  id: z.string(),
  value: z.number(),
})

export type Counter = z.infer<typeof CounterSchema>

export default CounterSchema;
