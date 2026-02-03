<template>
  <div class="max-w-[1000px] px-3 py-2">
    <!-- Header -->
    <div class="mb-3 flex items-center gap-2">
      <h2 class="text-[20px] font-bold text-slate-900">Учетные записи</h2>

      <Button
        outlined
        size="small"
        severity="secondary"
        icon="pi pi-plus"
        aria-label="Добавить учетную запись"
        @click="onAdd"
      />
    </div>

    <!-- Hint -->
    <div class="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-200 px-4 py-3 text-[13px] text-slate-800">
      <i class="pi pi-question-circle text-slate-500" />
      <span>Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;</span>
    </div>

    <!-- Head row -->
    <div class="mb-2 grid grid-cols-[1.6fr_1.1fr_1.5fr_1.6fr_44px] gap-x-3">
      <div class="pl-0.5 text-[12px] text-slate-500">Метки</div>
      <div class="pl-0.5 text-[12px] text-slate-500">Тип записи</div>
      <div class="pl-0.5 text-[12px] text-slate-500">Логин</div>
      <div class="pl-0.5 text-[12px] text-slate-500">Пароль</div>
      <div />
    </div>

    <!-- Rows -->
    <div
      v-for="row in rows"
      :key="row.id"
      class="mb-2 grid items-center gap-x-3"
      :class="{
        'grid-cols-[1.6fr_1.1fr_1.5fr_1.6fr_44px]': row.type === 'LOCAL',
        'grid-cols-[1.6fr_1.1fr_3.2fr_44px]': row.type === 'LDAP',
      }"
    >
      <!-- Labels -->
      <div>
        <InputText
          v-model="row.labelInput"
          class="w-full"
          :pt="inputPT"
          :maxlength="50"
          @blur="commit(row.id)"
          :invalid="!!row.errors.labelInput"
        />
      </div>

      <!-- Type -->
      <div>
        <Dropdown
          v-model="row.type"
          class="w-full"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          :pt="dropdownPT"
          @change="onTypeChange(row.id)"
        />
      </div>

      <!-- Login -->
      <div>
        <InputText
          v-model="row.login"
          class="w-full"
          :pt="inputPT"
          :maxlength="100"
          @blur="commit(row.id)"
          :invalid="!!row.errors.login"
        />
      </div>

      <!-- Password -->
      <div v-if="row.type === 'LOCAL'">
        <Password
          v-model="row.passwordInput"
          class="w-full"
          inputClass="w-full"
          toggleMask
          :feedback="false"
          :pt="passwordPT"
          :maxlength="100"
          @blur="commit(row.id)"
          :invalid="!!row.errors.passwordInput"
        />
      </div>

      <!-- Delete -->
      <div class="flex justify-center">
        <Button
          class="!h-10 !w-10"
          text
          severity="secondary"
          icon="pi pi-trash"
          aria-label="Удалить"
          @click="onRemove(row.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useAccountsStore, type Account, type AccountType, type LabelItem } from '@/stores/accounts'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Password from 'primevue/password'

type RowErrors = Partial<Record<'labelInput' | 'login' | 'passwordInput', true>>

type RowVM = {
  id: string
  labelInput: string
  type: AccountType
  login: string
  passwordInput: string
  errors: RowErrors
}

const store = useAccountsStore()

const typeOptions = [
  { label: 'Локальная', value: 'LOCAL' as const },
  { label: 'LDAP', value: 'LDAP' as const },
]

function labelsToInput(v: LabelItem[]) {
  return v.map(x => x.text).join('; ')
}
function inputToLabels(s: string): LabelItem[] {
  return s
    .split(';')
    .map(x => x.trim())
    .filter(Boolean)
    .map(text => ({ text }))
}

const rows = reactive<RowVM[]>([])

function syncFromStore() {
  rows.splice(
    0,
    rows.length,
    ...store.accounts.map(a => ({
      id: a.id,
      labelInput: labelsToInput(a.label),
      type: a.type,
      login: a.login,
      passwordInput: a.password ?? '',
      errors: {},
    }))
  )
}
syncFromStore()

watch(
  () => store.accounts,
  () => syncFromStore(),
  { deep: true }
)

function validate(row: RowVM): RowErrors {
  const e: RowErrors = {}

  if (row.labelInput.length > 50) e.labelInput = true

  const login = row.login.trim()
  if (!login || login.length > 100) e.login = true

  if (row.type === 'LOCAL') {
    if (!row.passwordInput || row.passwordInput.length > 100) e.passwordInput = true
  }

  return e
}

function toAccount(row: RowVM): Account {
  return {
    id: row.id,
    label: inputToLabels(row.labelInput),
    type: row.type,
    login: row.login,
    password: row.type === 'LDAP' ? null : row.passwordInput,
  }
}

function onAdd() {
  store.addEmpty()
}

function onRemove(id: string) {
  store.remove(id)
}

function onTypeChange(id: string) {
  const row = rows.find(r => r.id === id)
  if (!row) return

  // LDAP => пароль null + скрываем поле Password
  if (row.type === 'LDAP') row.passwordInput = ''

  commit(id)
}

function commit(id: string) {
  const row = rows.find(r => r.id === id)
  if (!row) return

  row.errors = validate(row)
  if (Object.keys(row.errors).length === 0) {
    store.upsert(toAccount(row))
  }
}

const baseInputClass =
  'h-10 rounded-md'

const inputPT = {
  root: { class: baseInputClass },
}

const dropdownPT = {
  root: { class: 'h-10 rounded-md' },
  input: { class: 'h-10' },
}

const passwordPT = {
  root: { class: 'w-full' },
  input: { class: baseInputClass + ' w-full' },
}
</script>


<style>

</style>
