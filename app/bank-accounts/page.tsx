'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Sidebar from '@/components/sidebar'
import { Search, Bell } from '@/components/Icons'
import styles from './accounts.module.css'

type Screen = 'list' | 'add' | 'edit'

type Account = {
  id: number
  account_number: string
  account_name: string
  balance: string | number
}

export default function AccountsPage() {
  const [screen, setScreen] = useState<Screen>('list')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState('')

  // Add-form state
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: ''
  })
  const [errors, setErrors] = useState({
    accountNumber: '',
    accountName: ''
  })
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editing, setEditing] = useState<Account | null>(null)
  const [nickname, setNickname] = useState('')

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accounts')
      const data = await res.json()
      if (data.ok) setAccounts(data.accounts || [])
    } catch {
      // leave list empty on failure
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  // ===== VALIDATION =====
  const validateAdd = () => {
    const newErrors = { accountNumber: '', accountName: '' }
    if (!/^\d{8,20}$/.test(formData.accountNumber.trim())) {
      newErrors.accountNumber = 'Account number must be 8 to 20 digits'
    }
    if (formData.accountName.trim().length < 2) {
      newErrors.accountName = 'Account name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.accountName.trim())) {
      newErrors.accountName =
        'Account name must contain only letters and spaces'
    }
    setErrors(newErrors)
    return !newErrors.accountNumber && !newErrors.accountName
  }

  const resetForm = () => {
    setFormData({ accountNumber: '', accountName: '' })
    setErrors({ accountNumber: '', accountName: '' })
  }

  // ===== NAVIGATION =====
  const goToList = () => {
    resetForm()
    setEditing(null)
    setScreen('list')
  }
  const goToAdd = () => {
    resetForm()
    setScreen('add')
  }
  const goToEdit = (account: Account) => {
    setEditing(account)
    setNickname(account.account_name)
    setScreen('edit')
  }

  // ===== HANDLERS =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAdd()) return
    setSaving(true)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: formData.accountNumber.trim(),
          accountName: formData.accountName.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setBanner('Account added successfully.')
        await loadAccounts()
        goToList()
      } else {
        setErrors((prev) => ({
          ...prev,
          accountNumber: data.message || 'Could not add account.'
        }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, accountNumber: 'Network error.' }))
    } finally {
      setSaving(false)
    }
  }

  const handleEditNickname = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (nickname.trim().length < 2) {
      setBanner('Nickname must be at least 2 characters.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/accounts/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName: nickname.trim() })
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setBanner('Account updated.')
        await loadAccounts()
        goToList()
      } else {
        setBanner(data.message || 'Could not update account.')
      }
    } catch {
      setBanner('Network error.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (account: Account) => {
    if (!confirm(`Delete account ${account.account_number}?`)) return
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setBanner('Account deleted.')
        await loadAccounts()
      } else {
        setBanner(data.message || 'Could not delete account.')
      }
    } catch {
      setBanner('Network error.')
    }
  }

  const Header = () => (
    <header className={styles.contentHeader}>
      <h1 className={styles.pageTitle}>Accounts</h1>
      <div className={styles.headerActions}>
        <Search size={22} />
        <Bell size={22} />
        <Link href="/profile" className={styles.avatarPlaceholder} aria-label="Profile" title="View profile">
          <Image
            src="/person-logo.png"
            alt="Profile"
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: '12px' }}
          />
        </Link>
      </div>
    </header>
  )

  return (
    <main className={styles.accountsPage}>
      <Sidebar />
      <section className={styles.content}>
        {/* ===== LIST SCREEN ===== */}
        {screen === 'list' && (
          <>
            <Header />
            {banner && <p className={styles.fieldError}>{banner}</p>}

            <div className={styles.cardsContainer}>
              {loading && <p>Loading accounts…</p>}
              {!loading && accounts.length === 0 && (
                <p>No accounts yet. Add one below.</p>
              )}
              {accounts.map((account) => (
                <div className={styles.accountCard} key={account.id}>
                  <div
                    className={styles.iconEdit}
                    onClick={() => goToEdit(account)}
                  >
                    ✏️
                  </div>
                  <div
                    className={styles.iconDelete}
                    onClick={() => handleDelete(account)}
                  >
                    🗑️
                  </div>
                  <div className={styles.accountCardContent}>
                    <h2 className={styles.accountName}>
                      {account.account_name}
                    </h2>
                    <div className={styles.accountAvatar}>
                      <Image
                        src="/account-logo.png"
                        alt="profile"
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <p className={styles.accountDetails}>
                      {account.account_number} <br />
                      Rs. {Number(account.balance).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              <button className={styles.addAccountCard} onClick={goToAdd}>
                <h2 className={styles.addAccountTitle}>Add a Bank Account</h2>
                <div className={styles.addAccountIcon}>+</div>
              </button>
            </div>
          </>
        )}

        {/* ===== ADD SCREEN ===== */}
        {screen === 'add' && (
          <>
            <Header />
            <div className={styles.formContainer}>
              <div className={styles.formCard}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Add Another Bank Account</h2>
                </div>

                <form className={styles.formFields} onSubmit={handleAddAccount}>
                  <div className={styles.formGroup}>
                    <label htmlFor="accountNumber">Bank Account Number:</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="Enter account number"
                      className={errors.accountNumber ? styles.inputError : ''}
                    />
                    {errors.accountNumber && (
                      <span className={styles.fieldError}>
                        {errors.accountNumber}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="accountName">Bank Account Name:</label>
                    <input
                      type="text"
                      id="accountName"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleChange}
                      placeholder="Enter account holder name"
                      className={errors.accountName ? styles.inputError : ''}
                    />
                    {errors.accountName && (
                      <span className={styles.fieldError}>
                        {errors.accountName}
                      </span>
                    )}
                  </div>

                  <div className={styles.formActionsBottom}>
                    <button
                      type="button"
                      className={styles.btnCancel}
                      onClick={goToList}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.btnAdd}
                      disabled={saving}
                    >
                      {saving ? 'Adding…' : 'Add Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ===== EDIT SCREEN ===== */}
        {screen === 'edit' && editing && (
          <>
            <Header />
            <div className={styles.formContainer}>
              <div className={styles.formCard}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Edit the account name</h2>
                </div>

                <form
                  onSubmit={handleEditNickname}
                  className={styles.formFields}
                >
                  <div className={styles.formGroup}>
                    <label htmlFor="editAccountNumber">
                      Bank Account Number:
                    </label>
                    <input
                      type="text"
                      id="editAccountNumber"
                      value={editing.account_number}
                      disabled
                      className={styles.inputDisabled}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="nickname">Account Name:</label>
                    <input
                      type="text"
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter new name"
                      required
                    />
                  </div>

                  <div className={styles.formActionsBottom}>
                    <button
                      type="button"
                      className={styles.btnCancel}
                      onClick={goToList}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.btnUpdate}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'UPDATE'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
