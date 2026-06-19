'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'

type Txn = {
  id: number
  from_account: string
  to_account: string
  amount: string | number
  description: string | null
  created_at: string
}

type Account = {
  account_number: string
  account_name: string
  balance: string | number
  full_name?: string
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB')
  } catch {
    return iso
  }
}

export default function EStatementPage() {
  const [accountNumber, setAccountNumber] = useState('')
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const acct = accountNumber.trim()
    if (!acct) {
      setError('Enter an account number.')
      return
    }

    setLoading(true)
    try {
      // Resolve the account from the caller's own accounts.
      const accountsRes = await fetch('/api/accounts')
      const accountsData = await accountsRes.json()
      const match: Account | undefined = (accountsData.accounts || []).find(
        (a: Account) => a.account_number === acct
      )
      if (!match) {
        setAccount(null)
        setTransactions([])
        setError('Account not found among your accounts.')
        return
      }
      setAccount(match)

      const txRes = await fetch(
        `/api/transactions?account=${encodeURIComponent(acct)}`
      )
      const txData = await txRes.json()
      if (txData.ok) {
        setTransactions(txData.transactions || [])
      } else {
        setError(txData.message || 'Could not load transactions.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Running balance is reconstructed forward from oldest to newest.
  const closing = account ? Number(account.balance) : 0
  let totalCredits = 0
  let totalDebits = 0
  for (const t of transactions) {
    if (t.to_account === accountNumber.trim()) totalCredits += Number(t.amount)
    if (t.from_account === accountNumber.trim()) totalDebits += Number(t.amount)
  }
  const opening = closing - totalCredits + totalDebits

  return (
    <div className="min-h-screen bg-bg-light font-geist p-0">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 p-12 text-black">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">E-Statement</h2>
            <div className="flex items-center gap-3">
              <button className="topbar-icon" aria-label="search">
                <img src="/search.png" alt="search" />
              </button>
              <button className="topbar-icon" aria-label="notifications">
                <img src="/notification.png" alt="notifications" />
              </button>
              <div className="size-12 overflow-hidden rounded-full border-2 border-gray-200">
                <img
                  src="/avatar.png"
                  alt="avatar"
                  className="size-full bg-white object-cover"
                />
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[32px] bg-white px-10 py-8 text-black shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)]"
          >
            <label
              htmlFor="statement-account-number"
              className="grid items-end gap-6 text-xl md:grid-cols-[auto_1fr_auto]"
            >
              <span>Enter account number:</span>
              <input
                id="statement-account-number"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="min-w-0 border-0 border-b border-black bg-transparent px-2 py-1 text-xl text-black outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#9a5c97] px-6 py-2 text-base font-semibold text-white"
              >
                {loading ? 'Loading…' : 'View'}
              </button>
            </label>
            {error && (
              <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
            )}
          </form>

          <section
            aria-label="Bank statement preview"
            className="mt-6 min-h-[560px] bg-[#e7e7e7] px-7 py-9 text-black"
          >
            <div className="max-w-full">
              <img
                src="/loginlogo.png"
                alt="Nova Bank"
                className="size-[86px] rounded-full object-cover"
              />

              <div className="mt-5 text-sm leading-tight">
                <h2 className="font-bold">Bank Statement</h2>
                <dl>
                  <div>
                    <dt className="inline">Account Holder: </dt>
                    <dd className="inline">{account?.account_name || ''}</dd>
                  </div>
                  <div>
                    <dt className="inline">Account Number: </dt>
                    <dd className="inline">{account?.account_number || ''}</dd>
                  </div>
                  <div>
                    <dt className="inline">Branch: </dt>
                    <dd className="inline">Nova Bank</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-9 text-sm">
                <h3 className="font-bold">Account Summary</h3>
                <table className="mt-5 w-full table-fixed border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pr-4 font-normal">Opening Balance</th>
                      <th className="pr-4 font-normal">Total Credits</th>
                      <th className="pr-4 font-normal">Total Debits</th>
                      <th className="font-normal">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pr-4">
                        {account ? `Rs. ${opening.toLocaleString()}` : ''}
                      </td>
                      <td className="pr-4">
                        {account ? `Rs. ${totalCredits.toLocaleString()}` : ''}
                      </td>
                      <td className="pr-4">
                        {account ? `Rs. ${totalDebits.toLocaleString()}` : ''}
                      </td>
                      <td>
                        {account ? `Rs. ${closing.toLocaleString()}` : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-10 border-t border-black pt-9">
                <h3 className="text-sm font-bold">Transaction Details</h3>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="w-[15%] pb-3 font-normal">Date</th>
                        <th className="w-[30%] pb-3 font-normal">
                          Description
                        </th>
                        <th className="w-[20%] pb-3 font-normal">Reference</th>
                        <th className="w-[17%] pb-3 font-normal">Debit</th>
                        <th className="w-[18%] pb-3 font-normal">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 && (
                        <tr>
                          <td className="h-10 pt-3" colSpan={5}>
                            {account ? 'No transactions for this account.' : ''}
                          </td>
                        </tr>
                      )}
                      {transactions.map((t) => {
                        const debit = t.from_account === accountNumber.trim()
                        return (
                          <tr key={t.id} className="border-b border-black/20">
                            <td className="py-2">{formatDate(t.created_at)}</td>
                            <td className="py-2">{t.description || '—'}</td>
                            <td className="py-2">#{t.id}</td>
                            <td className="py-2">
                              {debit
                                ? `Rs. ${Number(t.amount).toLocaleString()}`
                                : ''}
                            </td>
                            <td className="py-2">
                              {!debit
                                ? `Rs. ${Number(t.amount).toLocaleString()}`
                                : ''}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
