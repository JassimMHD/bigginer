import type { NextRequest } from 'next/server'
import { list, create } from '@/lib/controllers/account.controller'

export const GET = (request: NextRequest) => list(request)
export const POST = (request: NextRequest) => create(request)
