import * as AccountModel from '@/lib/models/account.model'
import * as TransactionModel from '@/lib/models/transaction.model'
import { pool, ensureDatabase } from '@/lib/platform-db'

const MAX_AMOUNT = 1_000_000

export class TransactionError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}

function validateAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    throw new TransactionError('Enter a valid positive amount.', 400)
  }
  if (Math.round(amount * 100) !== amount * 100) {
    throw new TransactionError('Amount can have at most 2 decimal places.', 400)
  }
}

export async function getStatement(userId: number, accountNumber: string) {
  if (!accountNumber) {
    throw new TransactionError('account is required.', 400)
  }
  const owned = await AccountModel.isOwnedByUser(accountNumber, userId)
  if (!owned) throw new TransactionError('Forbidden', 403)
  return TransactionModel.findByAccount(accountNumber)
}

export async function transfer(
  userId: number,
  fromAccount: string,
  toAccount: string,
  amount: number,
  description: string
) {
  if (!fromAccount || !toAccount) {
    throw new TransactionError('Source and destination accounts are required.', 400)
  }
  if (fromAccount === toAccount) {
    throw new TransactionError('Cannot transfer to the same account.', 400)
  }
  validateAmount(amount)

  await ensureDatabase()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const debited = await AccountModel.debit(fromAccount, userId, amount, client)
    if (!debited) {
      await client.query('ROLLBACK')
      throw new TransactionError('Insufficient funds or account not owned.', 400)
    }

    const credited = await AccountModel.credit(toAccount, amount, client)
    if (!credited) {
      await client.query('ROLLBACK')
      throw new TransactionError('Destination account not found.', 400)
    }

    const transaction = await TransactionModel.create(
      fromAccount,
      toAccount,
      amount,
      description,
      userId,
      client
    )

    await client.query('COMMIT')
    return transaction
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function payBill(
  userId: number,
  fromAccount: string,
  biller: string,
  billId: string,
  amount: number
) {
  if (!fromAccount) {
    throw new TransactionError('Source account is required.', 400)
  }
  if (!biller) {
    throw new TransactionError('Biller is required.', 400)
  }
  validateAmount(amount)

  await ensureDatabase()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const debited = await AccountModel.debit(fromAccount, userId, amount, client)
    if (!debited) {
      await client.query('ROLLBACK')
      throw new TransactionError('Insufficient funds or account not owned.', 400)
    }

    const description = billId ? `${biller} bill ${billId}` : `${biller} bill`
    const transaction = await TransactionModel.create(
      fromAccount,
      biller,
      amount,
      description,
      userId,
      client
    )

    await client.query('COMMIT')
    return transaction
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
