import type { NextRequest } from 'next/server'
import { resetPassword } from '@/lib/controllers/auth.controller'

export const POST = (request: NextRequest) => resetPassword(request)
