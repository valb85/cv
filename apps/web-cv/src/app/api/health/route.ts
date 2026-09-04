import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const h = await headers();

  return Response.json({
    status: 'ok',
    forwardedProto: h.get('x-forwarded-proto'),
    forwardedHost: h.get('x-forwarded-host') ?? h.get('host'),
    ts: new Date().toISOString(),
  });
}
