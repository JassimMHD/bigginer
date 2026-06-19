import { hashPassword } from '@/lib/auth'
import * as AccountModel from '@/lib/models/account.model'

export class AccountError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'AccountError'
  }
}

export async function listAccounts(userId: number) {
  return AccountModel.findByUserId(userId)
}

export async function createAccount(
  userId: number,
  accountNumber: string,
  accountName: string,
  pin: string
) {
  if (!/^\d{8,20}$/.test(accountNumber)) {
    throw new AccountError('Account number must be 8 to 20 digits.', 400)
  }
  if (accountName.length < 2) {
    throw new AccountError('Account name must be at least 2 characters.', 400)
  }

  if (await AccountModel.accountNumberExists(accountNumber)) {
    throw new AccountError('That account number is already in use.', 409)
  }

  const pinHash = await hashPassword(pin)
  return AccountModel.create(userId, accountNumber, accountName, pinHash)
}

export async function renameAccount(id: number, userId: number, accountName: string) {
  if (accountName.length < 2) {
    throw new AccountError('Account name must be at least 2 characters.', 400)
  }
  const account = await AccountModel.updateName(id, userId, accountName)
  if (!account) throw new AccountError('Account not found.', 404)
  return account
}

export async function deleteAccount(id: number, userId: number) {
  const account = await AccountModel.deleteById(id, userId)
  if (!account) throw new AccountError('Account not found.', 404)
  return account
}
