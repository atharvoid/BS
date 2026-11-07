import test from 'node:test'
import assert from 'node:assert/strict'
import { createReceiptStore } from '../src/components/receipt-store.ts'
const valid = value => value && typeof value.id === 'string' ? { id: value.id } : null

test('accepted submission is readable when all browser storage access is blocked', () => {
  const store = createReceiptStore('receipt', () => { throw Error('blocked') }, valid)
  assert.equal(store.read(), null)
  store.write({ id: 'accepted' })
  assert.deepEqual(store.read(), { id: 'accepted' })
})
test('latest acceptance takes precedence over stale storage when quota blocks writes', () => {
  const store = createReceiptStore('receipt', () => ({ getItem: () => '{"id":"old"}', setItem: () => { throw Error('quota') } }), valid)
  assert.deepEqual(store.read(), { id: 'old' })
  store.write({ id: 'new' })
  assert.deepEqual(store.read(), { id: 'new' })
})
test('valid persistent receipt survives a new store/document', () => {
  const values = new Map()
  const storage = () => ({ getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) })
  createReceiptStore('receipt', storage, valid).write({ id: 'accepted' })
  assert.deepEqual(createReceiptStore('receipt', storage, valid).read(), { id: 'accepted' })
})
test('missing, malformed and structurally invalid storage never fake acceptance', () => {
  for (const raw of [null, '{', '{"id":4}', 'null']) {
    const store = createReceiptStore('receipt', () => ({ getItem: () => raw, setItem() {} }), valid)
    assert.equal(store.read(), null)
  }
})
test('in-memory acceptance is not manufactured in a fresh document with blocked storage', () => {
  const storage = () => { throw Error('blocked') }
  createReceiptStore('receipt', storage, valid).write({ id: 'accepted' })
  assert.equal(createReceiptStore('receipt', storage, valid).read(), null)
})
