import type { NextRequest } from 'next/server'
import { signup } from '@/lib/controllers/auth.controller'

export const POST = (request: NextRequest) => signup(request)
