import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

/* The Content-Security-Policy in vercel.json allows exactly one inline script:
   the theme script in index.html, by its hash. Any edit to that script changes
   the hash, the browser then refuses to run it, and visitors who chose dark
   mode get light mode with no error anywhere visible. This keeps them in step.

   Browsers hash the script text after turning CRLF into LF, so this does too. */

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))

test('the CSP allows the inline theme script by its current hash', () => {
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  assert.equal(inline.length, 1, 'index.html should have exactly one executable inline script')
  const hash = createHash('sha256').update(inline[0].replace(/\r\n/g, '\n')).digest('base64')
  const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value
  assert.ok(csp, 'vercel.json sets a Content-Security-Policy')
  assert.ok(csp.includes(`'sha256-${hash}'`), `script-src must include 'sha256-${hash}'`)
})

test('the CSP lets the enquiry form reach Web3Forms', () => {
  const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value
  const endpoint = readFileSync(new URL('../src/components/EnquiryForm.tsx', import.meta.url), 'utf8').match(/https:\/\/[a-z0-9.-]+/)[0]
  assert.match(csp, new RegExp(`connect-src [^;]*${endpoint.replace(/[.]/g, '\\.')}`))
})
