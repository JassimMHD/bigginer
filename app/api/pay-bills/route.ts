import type { NextRequest } from 'next/server'
import { payBill } from '@/lib/controllers/transaction.controller'

export const POST = (request: NextRequest) => payBill(request)
