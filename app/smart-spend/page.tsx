'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/sidebar'
import { Search, Bell } from '@/components/Icons'

type Account = {
  account_number: string
  account_name: string
  balance: string | number
}

type Txn = {
  id: number
  from_account: string
  to_account: string
  amount: string | number
  description: string | null
  created_at: string
}

export default function SmartSpendPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/accounts')
        const data = await res.json()
        if (!active || !data.ok) return
        const list: Account[] = data.accounts || []
        setAccounts(list)

        // Pull transactions for every owned account, then dedupe by id.
        const all: Txn[] = []
        for (const a of list) {
          const txRes = await fetch(
            `/api/transactions?account=${encodeURIComponent(a.account_number)}`
          )
          const txData = await txRes.json()
          if (txData.ok) all.push(...(txData.transactions || []))
        }
        if (!active) return
        const byId = new Map<number, Txn>()
        for (const t of all) byId.set(t.id, t)
        setTransactions([...byId.values()])
      } catch {
        // leave empty on failure
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const ownNumbers = useMemo(
    () => new Set(accounts.map((a) => a.account_number)),
    [accounts]
  )

  const { totalSpent, totalReceived, byCategory } = useMemo(() => {
    let spent = 0
    let received = 0
    const cats = new Map<string, number>()
    for (const t of transactions) {
      const amount = Number(t.amount)
      const outgoing = ownNumbers.has(t.from_account)
      const incoming = ownNumbers.has(t.to_account)
      // Internal transfers between own accounts net to zero — skip them.
      if (outgoing && incoming) continue
      if (outgoing) {
        spent += amount
        const label = t.description?.trim() || 'Other'
        cats.set(label, (cats.get(label) || 0) + amount)
      } else if (incoming) {
        received += amount
      }
    }
    const byCategory = [...cats.entries()].sort((a, b) => b[1] - a[1])
    return { totalSpent: spent, totalReceived: received, byCategory }
  }, [transactions, ownNumbers])

  const maxCat = byCategory.length > 0 ? byCategory[0][1] : 0

  return (
    <div className="min-h-screen bg-bg-light font-geist p-0">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 p-12 text-black">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Smart Spend</h2>
            <div className="flex items-center gap-4 text-gray-600">
              <Search size={22} />
              <Bell size={22} />
            </div>
          </div>

          {loading ? (
            <p>Loading your spending…</p>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    Rs. {totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow">
                  <p className="text-sm text-gray-500">Total Received</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    Rs. {totalReceived.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow">
                  <p className="text-sm text-gray-500">Net Flow</p>
                  <p className="mt-2 text-2xl font-bold">
                    Rs. {(totalReceived - totalSpent).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold">
                  Spending by Category
                </h3>
                {byCategory.length === 0 && (
                  <p className="text-gray-500">No spending yet.</p>
                )}
                <ul className="space-y-4">
                  {byCategory.map(([label, value]) => (
                    <li key={label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="font-semibold">
                          Rs. {value.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#9a5c97]"
                          style={{
                            width: `${maxCat ? (value / maxCat) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
