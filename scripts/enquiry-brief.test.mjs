import test from 'node:test'
import assert from 'node:assert/strict'
import { enquiryBrief } from '../src/components/enquiry-brief.ts'
test('email preparation preserves the full requirement without implying delivery', () => {
  const brief = enquiryBrief({role:'Overseas buyer',requirement:'Cotton & silk — 200 m',location:'Pune',name:'A buyer',email:'buyer@example.com'}, 'Textiles & fabrics', 'business@example.com')
  const url = new URL(brief.href)
  assert.equal(url.protocol, 'mailto:')
  assert.match(url.searchParams.get('body'), /Cotton & silk — 200 m/)
  assert.equal(brief.copyRequired, false)
  assert.match(brief.text, /buyer@example.com/)
})
test('a long brief remains copyable instead of truncating data into an unreliable email URI', () => {
  const brief = enquiryBrief({role:'Supplier',requirement:'A'.repeat(2000),location:'India',name:'A supplier',email:'a@example.com'}, 'Other', 'business@example.com')
  assert.ok(brief.text.includes('A'.repeat(2000)))
  assert.equal(brief.copyRequired, true)
  assert.equal(new URL(brief.href).searchParams.has('body'), false)
})
