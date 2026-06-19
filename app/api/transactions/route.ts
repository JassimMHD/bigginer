import type { NextRequest } from 'next/server'
import { getStatement } from '@/lib/controllers/transaction.controller'

export const GET = (request: NextRequest) => getStatement(request)
