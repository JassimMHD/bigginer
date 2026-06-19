import { ensureDatabase, pool, serviceFailure } from '@/lib/platform-db'

export async function GET() {
  try {
    await ensureDatabase()
    await pool.query('SELECT 1')

    return Response.json({
      ok: true,
      service: 'bank-api'
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
