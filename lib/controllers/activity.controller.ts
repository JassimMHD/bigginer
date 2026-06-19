import type { NextRequest } from 'next/server'
import { serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'
import * as ActivityService from '@/lib/services/activity.service'

export async function getActivity(request: NextRequest) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    const { activities, total } = await ActivityService.getActivity(session.userId, limit, offset)
    return Response.json({ ok: true, activities, total })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
