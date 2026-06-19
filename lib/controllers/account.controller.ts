import type { NextRequest } from 'next/server'
import { asText, serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'
import { extractClientInfo } from '@/lib/activity'
import * as AccountService from '@/lib/services/account.service'
import * as ActivityService from '@/lib/services/activity.service'

export async function list(request: NextRequest) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }
    const accounts = await AccountService.listAccounts(session.userId)
    return Response.json({ ok: true, note: 'Account list prepared.', accounts })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function create(request: NextRequest) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const accountNumber = asText(body.accountNumber).trim()
    const accountName = asText(body.accountName).trim()
    const pin = asText(body.pin).trim() || '0000'

    const account = await AccountService.createAccount(session.userId, accountNumber, accountName, pin)
    await ActivityService.log(
      session.userId,
      'ADD_ACCOUNT',
      `Added account "${accountName}" (${accountNumber})`,
      { accountNumber, accountName },
      extractClientInfo(request)
    )
    return Response.json({ ok: true, account })
  } catch (err) {
    if (err instanceof AccountService.AccountError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}

export async function update(request: NextRequest, id: string) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const accountId = Number(id)
    if (!Number.isInteger(accountId)) {
      return Response.json({ ok: false, message: 'Invalid account id.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const accountName = asText(body.accountName).trim()

    const account = await AccountService.renameAccount(accountId, session.userId, accountName)
    return Response.json({ ok: true, account })
  } catch (err) {
    if (err instanceof AccountService.AccountError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}

export async function remove(request: NextRequest, id: string) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const accountId = Number(id)
    if (!Number.isInteger(accountId)) {
      return Response.json({ ok: false, message: 'Invalid account id.' }, { status: 400 })
    }

    const deleted = await AccountService.deleteAccount(accountId, session.userId)
    await ActivityService.log(
      session.userId,
      'DELETE_ACCOUNT',
      `Deleted account "${deleted.account_name}" (${deleted.account_number})`,
      { accountId, accountNumber: deleted.account_number, accountName: deleted.account_name },
      extractClientInfo(request)
    )
    return Response.json({ ok: true, message: 'Account deleted.' })
  } catch (err) {
    if (err instanceof AccountService.AccountError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}
