import type { NextRequest } from 'next/server'
import { update, remove } from '@/lib/controllers/account.controller'

type Params = { params: Promise<{ id: string }> }

export const PUT = async (request: NextRequest, { params }: Params) => {
  const { id } = await params
  return update(request, id)
}

export const DELETE = async (request: NextRequest, { params }: Params) => {
  const { id } = await params
  return remove(request, id)
}
