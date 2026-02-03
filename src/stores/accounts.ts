import { defineStore } from 'pinia'

export type AccountType = 'LDAP' | 'LOCAL'

export interface LabelItem {
  text: string
}

export interface Account {
  id: string
  label: LabelItem[]
  type: AccountType
  login: string
  password: string | null
}

const LS_KEY = 'accounts-v1'

function load(): Account[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Account[]) : []
  } catch {
    return []
  }
}
function persist(accounts: Account[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(accounts))
}

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    accounts: load() as Account[],
  }),
  actions: {
    addEmpty() {
      const id = crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`
      this.accounts.push({
        id,
        label: [],
        type: 'LOCAL',
        login: '',
        password: '',
      })
      persist(this.accounts)
    },
    remove(id: string) {
      this.accounts = this.accounts.filter(a => a.id !== id)
      persist(this.accounts)
    },
    upsert(account: Account) {
      const idx = this.accounts.findIndex(a => a.id === account.id)
      if (idx >= 0) this.accounts[idx] = account
      else this.accounts.push(account)
      persist(this.accounts)
    },
  },
})
