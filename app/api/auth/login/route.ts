import type { NextRequest } from 'next/server'
import { login } from '@/lib/controllers/auth.controller'

export const POST = (request: NextRequest) => login(request)
