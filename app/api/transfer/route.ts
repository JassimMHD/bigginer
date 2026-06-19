import type { NextRequest } from 'next/server'
import { transfer } from '@/lib/controllers/transaction.controller'

export const POST = (request: NextRequest) => transfer(request)
