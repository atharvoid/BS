/** Built-site motion regression. Set PLAYWRIGHT_MODULE / BROWSER_EXECUTABLE if needed.
 * SITE_URL defaults to the local production preview; EVIDENCE_DIR holds captures.
 * DEEP_SCROLL=1 additionally samples actual Three draws against the Vite dev server.
 */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {}),
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
})
const origin = process.env.SITE_URL || 'http://127.0.0.1:4383'
const out = process.env.EVIDENCE_DIR || 'output/motion-review'
await mkdir(out,{recursive:true})
const results=[],errors=[]
async function pageAt(width,height,options={}) {
  const page = await browser.newPage({viewport:{width,height},...options})
  page.on('pageerror',e=>{ if(!process.env.DEEP_SCROLL || !e.message.includes('WebSocket closed')) errors.push(e.message) })
  await page.goto(origin)
  await page.keyboard.press('Escape')
  return page
}
async function scroll(page,y,wait=180) {
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y)
  await page.waitForTimeout(wait)
}
async function chapter(page,p) {
  const y=await page.locator('#product-tour').evaluate((el,p)=>scrollY+el.getBoundingClientRect().top+(el.querySelector('.journey__runway').offsetHeight-innerHeight)*p/6,p)
  await scroll(page,y)
}
async function angles(page) {
  return page.locator('[data-journey-index]').evaluateAll(els=>els.map(el=>({motif:el.dataset.motif,yaw:Number(el.dataset.presentedYaw)})))
}
async function assertOneTurns(page,index) {
  await page.waitForTimeout(160)
  const before=await angles(page)
  await page.waitForTimeout(650)
  const after=await angles(page)
  after.forEach((p,i)=>assert.ok(i===index?p.yaw>before[i].yaw:Math.abs(p.yaw-before[i].yaw)<.00001,`${p.motif}: rotation owner ${index}`))
  return {before,after}
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal page overflow')
}
try {
 if(!process.env.MOTION_FLOW || process.env.MOTION_FLOW==='desktop') {
 const desktop=await pageAt(1440,900)
 for(const action of ['wheel','Escape','Tab','touchstart','resize']) {
  const state=await desktop.evaluate(action=>{
   document.querySelector('.nav .brand').click()
   const started=document.documentElement.dataset.introActive==='true'
   if(action==='Escape'||action==='Tab') window.dispatchEvent(new KeyboardEvent('keydown',{key:action,bubbles:true}))
   else window.dispatchEvent(new Event(action))
   return {started,hidden:document.querySelector('#brand-intro').hidden,active:document.documentElement.dataset.introActive}
  },action)
  assert.equal(state.started,true);assert.equal(state.hidden,true);assert.equal(state.active,undefined)
 }
 await chapter(desktop,.3)
 await desktop.locator('.gallery--journey[data-ready="true"]').waitFor({timeout:60000})
 if(process.env.DEEP_SCROLL) {
  await desktop.evaluate(async()=>{
   const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js?v='))?.name
   if(!url) throw Error('DEEP_SCROLL requires the Vite dev server')
   const {_roots}=await import(url)
   const canvas=document.querySelector('.gallery--journey canvas'),state=_roots.get(canvas).store.getState(),render=state.gl.render.bind(state.gl)
   window.motionDraws=[]
   state.gl.render=(scene,camera)=>{
    render(scene,camera)
    const rect=canvas.getBoundingClientRect(),poses=[]
    scene.traverse(g=>{
     if(!g.name.startsWith('category-spin-')||!g.parent.visible) return
     const el=document.querySelector(`[data-journey-index][data-motif="${g.name.slice(14)}"]`)
     if(!el) return // A route cleanup can flush the retiring scene after its DOM is removed.
     const r=el.getBoundingClientRect(),p=g.parent.position.clone().project(camera)
     poses.push({motif:el.dataset.motif,miss:Math.hypot(rect.left+(p.x+1)*rect.width/2-r.left-r.width/2,rect.top+(1-p.y)*rect.height/2-r.top-r.height/2)})
    })
    window.motionDraws.push({scrollY,poses})
   }
  })
 }
 for(let i=0;i<6;i++) {
  await chapter(desktop,i+.3)
  await desktop.waitForFunction(index => {
   const chapter = document.querySelector(`[data-chapter="${index}"]`)
   return chapter && !chapter.inert && !chapter.querySelector('.journey__detail').inert
  }, i, { timeout: 5000 })
 }
 await chapter(desktop,6)
 await desktop.mouse.move(700,350)
 assert.equal(await desktop.locator('[data-dock][data-filled="true"]').count(),6)
 await assertOneTurns(desktop,-1)
 const hover=[]
 for(const i of [0,1,2,3,4,5]) {
  await desktop.locator(`[data-dock="${i}"]`).hover()
  hover.push(await assertOneTurns(desktop,i))
 }
 await desktop.mouse.move(700,350)
 await assertOneTurns(desktop,-1)
 await desktop.locator('[data-dock="2"]').focus()
 await assertOneTurns(desktop,2)
 await desktop.locator('[data-dock="2"]').evaluate(el=>el.blur())
 await assertOneTurns(desktop,-1)
 await desktop.locator('[data-dock="0"]').hover()
 await desktop.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))})
 await desktop.waitForTimeout(200)
 const suspended=await angles(desktop)
 const frozen=await desktop.locator('.gallery--journey canvas').screenshot()
 await desktop.waitForTimeout(250)
 assert.deepEqual(await angles(desktop),suspended,'hidden tab holds every phase')
 assert.deepEqual(await desktop.locator('.gallery--journey canvas').screenshot(),frozen,'hidden canvas retains its pixels')
 await desktop.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))})
 await assertOneTurns(desktop,0)
 await desktop.mouse.move(700,350)
 await desktop.screenshot({path:`${out}/desktop-shelf.png`})
 const dimsBefore=await desktop.locator('.gallery--journey canvas').evaluate(el=>({w:el.width,h:el.height,css:el.getBoundingClientRect().toJSON()}))
 await desktop.evaluate(async()=>{
  const el=document.querySelector('#product-tour'),y=scrollY+el.getBoundingClientRect().top,range=el.querySelector('.journey__runway').offsetHeight-innerHeight
  for(const dir of [1,-1]) for(let i=0;i<=120;i++) {
   scrollTo({top:y+range*(dir===1?i/120:1-i/120),behavior:'instant'})
   await new Promise(requestAnimationFrame)
  }
 })
 await chapter(desktop,.3)
 await desktop.waitForTimeout(250)
 await desktop.screenshot({path:`${out}/desktop-chapter.png`})
 const dimsAfter=await desktop.locator('.gallery--journey canvas').evaluate(el=>({w:el.width,h:el.height,css:el.getBoundingClientRect().toJSON()}))
 assert.equal(dimsAfter.css.width,dimsBefore.css.width)
 assert.equal(dimsAfter.css.height,dimsBefore.css.height,'scroll never resizes the canvas surface')
 if(process.env.DEEP_SCROLL) {
  const draws=await desktop.evaluate(()=>window.motionDraws)
  const maxMiss=Math.max(...draws.flatMap(s=>s.poses.map(p=>p.miss)))
  await writeFile(`${out}/rendered-position-samples.json`,JSON.stringify(draws))
  assert.ok(maxMiss<2,`all actual draws stay aligned: ${maxMiss}px`)
  results.push({flow:'continuous actual draw alignment',draws:draws.length,maxMiss})
 }
 const previous=await desktop.evaluate(()=>scrollY)
 await desktop.locator('.nav a[href="/textiles"]').click()
 await desktop.locator('.page-hero--textile').waitFor()
 assert.equal(await desktop.evaluate(()=>scrollY),0)
 await desktop.goBack()
 await desktop.locator('.sourcing--journey').waitFor()
 await desktop.waitForTimeout(200)
 assert.ok(Math.abs(await desktop.evaluate(()=>scrollY)-previous)<2)
 assert.equal(await desktop.locator('#brand-intro').evaluate(el=>el.hidden),true,'Back must not replay the opening')
 await chapter(desktop,6)
 await desktop.waitForFunction(()=>document.querySelectorAll('[data-dock][data-filled="true"]').length===6)
 const end=await desktop.locator('#product-tour').evaluate(el=>scrollY+el.getBoundingClientRect().bottom)
 await scroll(desktop,end-500)
  await desktop.locator('#product-tour[data-begun="false"]').waitFor({timeout:5000})
 assert.equal(await desktop.locator('.journey__shelf').evaluate(el=>el.inert),true)
 assert.equal(await desktop.locator('.journey__visuals').evaluate(el=>getComputedStyle(el).visibility),'hidden')
 await desktop.screenshot({path:`${out}/below-products.png`})
 await desktop.locator('#category-directory').evaluate(el=>el.scrollIntoView({behavior:'instant'}))
 await desktop.waitForFunction(()=>document.querySelector('#product-tour')?.dataset.begun==='false')
 assert.equal(await desktop.locator('#product-tour').count(),1,'scrolling up leaves the tour in the page flow')
 await noOverflow(desktop)
 results.push({flow:'desktop intro, six chapters, hover, focus, reverse, routes and Back',hover,dimsBefore,dimsAfter})
 await desktop.close()
 console.log('PASS desktop scrolling, shelf ownership, routes and Back')
 }

 if(process.env.DEEP_SCROLL) {
  const slow=await browser.newPage({viewport:{width:1440,height:900}})
  await slow.route('**/src/three/performance.ts*',async route=>{
   const response=await route.fetch(),body=await response.text()
   assert.ok(body.includes('let sustained = initialQuality();'),'adaptive-still fixture targets the actual quality module')
   await route.fulfill({response,body:body.replace('let sustained = initialQuality();','let sustained = "still";')})
  })
  await slow.goto(new URL('/#product-tour',origin).href);await chapter(slow,6)
  await slow.locator('.gallery[data-ready="true"]').waitFor({timeout:60000})
  await slow.locator('[data-dock="0"]').hover()
  await assertOneTurns(slow,0)
  await slow.mouse.move(700,350);await assertOneTurns(slow,-1)
  results.push({flow:'explicit shelf hover in the forced adaptive-still fixture'})
  await slow.close()
 }

 if(!process.env.MOTION_FLOW || process.env.MOTION_FLOW==='phone') {
 for(const [width,height] of [[390,844],[320,568],[844,390],[768,1024]]) {
  const phone=await pageAt(width,height,{isMobile:true,hasTouch:true,deviceScaleFactor:2})
  const cards=phone.locator('.product-card')
  assert.equal(await cards.count(),6)
  let readyResets=0
  for(const index of [0,2,4,5,3,1,0]) {
   await cards.nth(index).scrollIntoViewIfNeeded()
   await phone.locator('.gallery[data-ready="true"]').waitFor({timeout:60000})
   await phone.waitForFunction(()=>[...document.querySelectorAll('.product-card__stage')].filter(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}).every(el=>el.dataset.presentedYaw!==undefined&&getComputedStyle(el.querySelector('img')).opacity==='0'),{},{timeout:10000})
   const visible=await phone.locator('.product-card__stage').evaluateAll(els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}).map(el=>({motif:el.dataset.motif,yaw:el.dataset.presentedYaw,poster:getComputedStyle(el.querySelector('img')).opacity})))
   for(const card of visible) {assert.ok(Number.isFinite(Number(card.yaw)),`${width}: ${card.motif} has a presented model`);assert.equal(card.poster,'0')}
   readyResets+=await phone.locator('.gallery[data-ready="false"]').count()
   await noOverflow(phone)
  }
  if(width===390) {
   await phone.locator('#products').evaluate(el=>el.scrollIntoView({behavior:'instant'}))
   await phone.waitForFunction(()=>document.querySelector('.gallery--cards')?.dataset.motion==='running')
   const stage=phone.locator('.product-card__stage').first()
   const first=Number(await stage.getAttribute('data-presented-yaw'))
   await phone.waitForTimeout(4700)
   const later=Number(await stage.getAttribute('data-presented-yaw'))
   assert.ok(later>first,'phone cards keep turning through the former time limit')
   await phone.waitForFunction(last=>Number(document.querySelector('.product-card__stage').dataset.presentedYaw)>last,later)
  }
  await cards.first().scrollIntoViewIfNeeded()
  await phone.waitForTimeout(250)
  await phone.screenshot({path:`${out}/phone-${width}.png`})
  await phone.locator('.nav__toggle').click()
  assert.equal(await phone.locator('main').evaluate(el=>el.inert),true)
  await phone.keyboard.press('Escape')
  assert.equal(await phone.locator('main').evaluate(el=>el.inert),false)
  await phone.locator('.nav__toggle').click()
  await phone.locator('.drawer a[href="/textiles"]').click()
  await phone.locator('.page-hero--textile').waitFor()
  assert.equal(await phone.evaluate(()=>scrollY),0)
  assert.equal(await phone.locator('main').evaluate(el=>el.inert),false)
  await phone.goBack()
  await phone.locator('.product-directory').waitFor()
  assert.equal(await phone.locator('#brand-intro').evaluate(el=>el.hidden),true)
  await phone.locator('.nav__toggle').click()
  await phone.setViewportSize({width:1200,height:800})
  await phone.locator('#product-tour').waitFor()
  assert.equal(await phone.locator('main').evaluate(el=>el.inert),false,'desktop breakpoint releases the drawer scroll lock')
  assert.equal(await phone.locator('.nav__toggle').getAttribute('aria-expanded'),'false')
  await chapter(phone,.3)
  await phone.locator('.gallery--journey[data-ready="true"]').waitFor({timeout:60000})
  await phone.setViewportSize({width,height})
  await phone.locator('.product-directory').waitFor()
  await phone.locator('.product-card').first().scrollIntoViewIfNeeded()
  await phone.locator('.gallery[data-ready="true"]').waitFor({timeout:60000})
  assert.equal(await phone.locator('.gallery canvas').count(),1)
  await noOverflow(phone)
  results.push({flow:'phone cards, continuous rotation, drawer, routes, Back and breakpoint return',width,height,readyResets})
  await phone.close()
  console.log(`PASS phone/tablet ${width}x${height}`)
 }
 }
 if(!process.env.MOTION_FLOW || process.env.MOTION_FLOW==='preferences') {
 for(const width of [1440,390]) {
  const page=await pageAt(width,844,{reducedMotion:'reduce'})
  await page.locator('#products').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  assert.equal(await page.locator('.gallery canvas').count(),0,'reduced motion keeps the static category view')
  assert.equal(await page.locator('#brand-intro').evaluate(el=>el.hidden),true)
  await noOverflow(page)
  results.push({flow:'reduced motion',width})
  await page.close()
 }
 const fallback=await browser.newPage({viewport:{width:1440,height:900}})
 await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}})
 await fallback.goto(origin);await fallback.keyboard.press('Escape')
 assert.equal(await fallback.locator('#product-tour').count(),0)
 assert.equal(await fallback.locator('.product-card').count(),6)
 await fallback.locator('#category-directory').scrollIntoViewIfNeeded()
 await fallback.screenshot({path:`${out}/fallback.png`})
 await fallback.close()
 results.push({flow:'unavailable WebGL keeps the directory'})
 for(const width of [1440,390]) {
  const page=await browser.newPage({viewport:{width,height:844}}),requests=[]
  page.on('request',r=>requests.push(r.url()))
  await page.addInitScript(()=>{const connection=new EventTarget();connection.saveData=true;Object.defineProperty(navigator,'connection',{configurable:true,value:connection})})
  await page.goto(origin);await page.keyboard.press('Escape')
  await page.locator('#products').scrollIntoViewIfNeeded();await page.waitForTimeout(600)
  assert.equal(await page.locator('canvas').count(),0,'Save Data retains posters')
  assert.equal(requests.some(url=>/\/three-[\w-]+\.js/.test(url)),false,'Save Data never fetches Three')
  results.push({flow:'Save Data',width})
  await page.close()
 }
 }
 assert.deepEqual(errors,[],'no application runtime errors')
 await writeFile(`${out}/motion-results.json`,JSON.stringify({origin,results,errors},null,2))
 console.log(`PASS ${results.length} selected motion journeys (${process.env.MOTION_FLOW || 'all'})`)
} finally {await browser.close()}
