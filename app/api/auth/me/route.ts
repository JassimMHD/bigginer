import type { NextRequest } from 'next/server'
import { me } from '@/lib/controllers/auth.controller'

export const GET = (request: NextRequest) => me(request)
