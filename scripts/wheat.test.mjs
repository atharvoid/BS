import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'

// Changing a vertex, normal or triangle must fail: this silhouette is approved.
test('production wheat preserves the approved silhouette and carries linear gold on every part', async () => {
  assert.ok(existsSync('src/three/wheatGeometry.ts'), 'production wheat factory is missing')
  const { makeWheatHead } = await import('../src/three/wheatGeometry.ts')
  const g = makeWheatHead()
  for (const [attribute, hash] of [
    [g.attributes.position,'c36da2261ab9edaf013e9a4aeeacd0f709ceab9dc711fbb0ba931ab79856c279'],
    [g.attributes.normal,'208140c202035359693b717cd31071e0e23f447785c3baf3eb54f7a23df9b735'],
    [g.index,'4d2ba5ab162cf99997bf81b513462f54d4922ab8d914ac49f5843e1f3df438b1'],
  ]) assert.equal(createHash('sha256').update(Buffer.from(attribute.array.buffer)).digest('hex'),hash)
  const c=g.attributes.color
  assert.equal(c.count,g.attributes.position.count)
  for(let i=0;i<c.count;i++) assert.ok(c.getX(i)>c.getY(i) && c.getY(i)>c.getZ(i),'gold across both ranks, stem and awns')
  assert.ok(c.getX(50)<.65,'sRGB swatches must be converted to linear before interpolation')
  assert.equal(g.index.count/3,2912)
  g.dispose()
})

test('resume requires a matching still, asset version, motion policy and resolution', async () => {
  assert.ok(existsSync('src/three/wheat-presentation.ts'), 'wheat presentation state is missing')
  const { validWheatPair, WHEAT_VERSION } = await import('../src/three/wheat-presentation.ts')
  const pair={version:WHEAT_VERSION,phase:2,bounded:true,image:'data:image/png;base64,AAAA',height:135,dpr:2}
  assert.ok(validWheatPair(pair,135,2,true))
  for(const bad of [{...pair,image:''},{...pair,phase:NaN},{...pair,version:'old'},{...pair,height:100},{...pair,dpr:1},{...pair,bounded:false}]) {
    assert.equal(validWheatPair(bad,135,2,true),false)
  }
})
