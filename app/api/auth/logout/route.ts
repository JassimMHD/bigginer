import type { NextRequest } from 'next/server'
import { logout } from '@/lib/controllers/auth.controller'

export const POST = (request: NextRequest) => logout(request)
