import type { NextRequest } from 'next/server'
import { asText, serviceFailure } from '@/lib/platform-db'
import { getSession } from '@/lib/auth'
import { extractClientInfo } from '@/lib/activity'
import * as TransactionService from '@/lib/services/transaction.service'
import * as ActivityService from '@/lib/services/activity.service'

export async function getStatement(request: NextRequest) {
  try {
    const session = getSession(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const account = asText(searchParams.get('account'))

    const transactions = await TransactionService.getStatement(session.userId, account)
    await ActivityService.log(
      session.userId,
      'VIEW_STATEMENT',
      `Viewed statement for account ${account}`,
      { account },
      extractClientInfo(request)
    )
    return Response.json({ ok: true, account, transactions })
  } catch (err) {
    if (err instanceof TransactionService.TransactionError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}

export async function transfer(request: NextRequest) {
  try {
    const session = getSession(request)
    const clientInfo = extractClientInfo(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const fromAccount = asText(body.fromAccount || body.from)
    const toAccount = asText(body.toAccount || body.to)
    const description = asText(body.description)
    const amount = Number(body.amount)

    const transaction = await TransactionService.transfer(
      session.userId,
      fromAccount,
      toAccount,
      amount,
      description
    )
    await ActivityService.log(
      session.userId,
      'TRANSFER',
      `Transferred Rs. ${amount} from ${fromAccount} to ${toAccount}`,
      { fromAccount, toAccount, amount, description },
      clientInfo
    )
    return Response.json({ ok: true, message: 'Transfer accepted.', transaction })
  } catch (err) {
    if (err instanceof TransactionService.TransactionError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}

export async function payBill(request: NextRequest) {
  try {
    const session = getSession(request)
    const clientInfo = extractClientInfo(request)
    if (!session) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const fromAccount = asText(body.fromAccount).trim()
    const biller = asText(body.biller).trim()
    const billId = asText(body.billId).trim()
    const amount = Number(body.amount)

    const transaction = await TransactionService.payBill(
      session.userId,
      fromAccount,
      biller,
      billId,
      amount
    )
    await ActivityService.log(
      session.userId,
      'PAY_BILL',
      `Paid ${biller} bill${billId ? ` (${billId})` : ''} Rs. ${amount}`,
      { fromAccount, biller, billId, amount },
      clientInfo
    )
    return Response.json({ ok: true, message: 'Payment accepted.', transaction })
  } catch (err) {
    if (err instanceof TransactionService.TransactionError) {
      return Response.json({ ok: false, message: err.message }, { status: err.status })
    }
    return serviceFailure(err)
  }
}
