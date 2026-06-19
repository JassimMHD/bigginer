import type { NextRequest } from 'next/server'
import { getActivity } from '@/lib/controllers/activity.controller'

export const GET = (request: NextRequest) => getActivity(request)
