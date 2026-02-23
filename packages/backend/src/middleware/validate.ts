import type { Context } from 'hono';
import type { ZodSchema, z } from 'zod';

export async function parseBody<T extends ZodSchema>(
  c: Context,
  schema: T
): Promise<{ data: z.infer<T> } | { error: Response }> {
  const body = await c.req.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: c.json(
        {
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        400
      ),
    };
  }
  return { data: result.data };
}
