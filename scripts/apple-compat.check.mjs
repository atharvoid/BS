/** WebKit/Chromium engine checks. These are not physical Apple-device tests. */
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const origin=process.env.SITE_URL||'http://127.0.0.1:4383'
const out=process.env.EVIDENCE_DIR||'output/apple-compatibility-20261117'
const engines=(process.env.ENGINE||'webkit,chromium').split(',')
await mkdir(out,{recursive:true})
const results=[],errors=[]
const viewports=[
 {name:'mac-sized',viewport:{width:1440,height:900},deviceScaleFactor:2},
 {name:'iphone-sized',viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true},
 {name:'ipad-portrait',viewport:{width:768,height:1024},deviceScaleFactor:2,isMobile:true,hasTouch:true},
 {name:'ipad-landscape',viewport:{width:1024,height:768},deviceScaleFactor:2,isMobile:true,hasTouch:true},
]
async function pause(page,hidden) {
 await page.evaluate(hidden=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});document.dispatchEvent(new Event('visibilitychange'))},hidden)
 await page.waitForTimeout(150)
}
async function chapter(page,progress) {
 await page.locator('#product-tour').evaluate((el,p)=>scrollTo({top:scrollY+el.getBoundingClientRect().top+(el.querySelector('.journey__runway').offsetHeight-innerHeight)*p/6,behavior:'instant'}),progress)
 await page.waitForFunction(p=>Math.abs(Number(document.querySelector('#product-tour').style.getPropertyValue('--journey-progress'))-p/6)<.003,progress,{timeout:15000})
}
const yaw=page=>page.locator('.journey__anchor[data-motif="textiles"], .product-card__stage[data-motif="textiles"]').last().getAttribute('data-presented-yaw').then(Number)
try {
 for(const engine of engines) {
  const browser=await playwright[engine].launch(engine==='chromium'?{
   ...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  }:{headless:true})
  try {
   for(const {name,...options} of viewports.filter(v=>!process.env.VIEWPORT||v.name===process.env.VIEWPORT)) {
    const page=await browser.newPage(options),label=`${engine}-${name}`
    await page.addInitScript(()=>{
     window.scrollRequests=[]
     const original=window.scrollTo
     window.scrollTo=function(...args){window.scrollRequests.push({args,path:location.pathname});return original.apply(this,args)}
    })
    page.on('pageerror',e=>errors.push({label,message:e.message,stack:e.stack}))
    await page.goto(origin)
    await page.waitForFunction(()=>document.querySelector('#brand-intro')?.dataset.state==='idle'&&!document.documentElement.hasAttribute('data-intro-active'),{},{timeout:10000})
    assert.equal(await page.locator('html').getAttribute('data-intro-active'),null,`${label}: opening finishes`)
    const capability=await page.evaluate(()=>{const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2'),ok=!!gl&&!gl.isContextLost();gl?.getExtension('WEBGL_lose_context')?.loseContext();return {webgl2:ok,viewport:{w:innerWidth,h:innerHeight},dpr:devicePixelRatio}})
    assert.equal(capability.webgl2,true,`${label}: this engine fixture has WebGL 2`)
    const cards=options.viewport.width<=980
    if(cards) await page.locator('.product-card').first().scrollIntoViewIfNeeded()
    else await chapter(page,.3)
    await page.locator(cards ? '.gallery--cards[data-ready="true"]' : '.gallery--journey[data-ready="true"]').waitFor({timeout:60000})
    const selector = cards ? '.product-card__stage[data-motif="textiles"]' : '.journey__anchor[data-motif="textiles"]'
    await page.waitForFunction(s=>document.querySelector(s)?.dataset.presentedYaw!==undefined,selector)
    const start=await yaw(page)
    // A tall tablet can show the globe and cards together. The shared motion
    // budget intentionally lets one surface finish before the other begins.
    await page.waitForFunction(({selector,start})=>Number(document.querySelector(selector).dataset.presentedYaw)>start+.0001,{selector,start},{timeout:12000})
    const moving=await yaw(page)
    assert.ok(moving>start,`${label}: visible product actually rotates (${start} -> ${moving})`)
    await pause(page,true)
    const held=await yaw(page)
    await page.waitForTimeout(180)
    assert.equal(await yaw(page),held,`${label}: background phase stays still`)
    await pause(page,false)
    if(cards) {
     for(const index of [2,4,0]) {
      await page.locator('.product-card').nth(index).scrollIntoViewIfNeeded()
      await page.waitForFunction(()=>[...document.querySelectorAll('.product-card__stage')].filter(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}).every(el=>el.dataset.presentedYaw!==undefined&&getComputedStyle(el.querySelector('img')).opacity==='0'),{},{timeout:15000})
     }
    } else {
     for(const progress of [2.3,4.3,6,.3,6]) await chapter(page,progress)
     assert.equal(await page.locator('[data-dock][data-filled="true"]').count(),6)
     const alignment=await page.locator('[data-journey-index]').evaluateAll(els=>els.map(el=>{const a=el.getBoundingClientRect(),b=document.querySelector(`[data-dock="${el.dataset.journeyIndex}"]`).getBoundingClientRect();return Math.abs((a.left+a.width/2)-(b.left+b.width/2))}))
     if(alignment.some(delta=>delta>=1)) await writeFile(`${out}/${label}-alignment.json`,JSON.stringify(await page.evaluate(()=>({innerWidth,clientWidth:document.documentElement.clientWidth,visualWidth:document.querySelector('.journey__visuals').clientWidth,progress:document.querySelector('#product-tour').style.getPropertyValue('--journey-progress'),boxes:[...document.querySelectorAll('[data-dock]')].map(el=>el.getBoundingClientRect().toJSON()),anchors:[...document.querySelectorAll('[data-journey-index]')].map(el=>({rect:el.getBoundingClientRect().toJSON(),transform:el.style.transform}))})),null,2))
     assert.ok(alignment.every(delta=>delta<1),`${label}: shelf aligns even with classic scrollbars (${alignment.join(', ')})`)
     await page.mouse.move(700,300)
     const heldAngles=await page.locator('[data-journey-index]').evaluateAll(els=>els.map(el=>Number(el.dataset.presentedYaw)))
     await page.waitForTimeout(250)
     assert.deepEqual(await page.locator('[data-journey-index]').evaluateAll(els=>els.map(el=>Number(el.dataset.presentedYaw))),heldAngles,`${label}: unattended shelf is still`)
     await page.locator('[data-dock="0"]').hover();await page.waitForTimeout(250)
     const hoverBefore=await page.locator('[data-journey-index]').evaluateAll(els=>els.map(el=>Number(el.dataset.presentedYaw)))
     await page.waitForTimeout(500)
     const hoverAfter=await page.locator('[data-journey-index]').evaluateAll(els=>els.map(el=>Number(el.dataset.presentedYaw)))
     hoverAfter.forEach((angle,i)=>assert.ok(i===0?angle>hoverBefore[i]:Math.abs(angle-hoverBefore[i])<.0001,`${label}: one shelf rotation owner`))
     await page.mouse.move(700,300)
    }
    if(cards) {
     await page.locator('.nav__toggle').click()
     const lockedY=await page.evaluate(()=>scrollY)
     // Playwright does not expose wheel/swipe input for mobile WebKit. Check
     // its root lock with keyboard input; native touch is a real-device gap.
     if(engine==='webkit'&&options.isMobile) await page.keyboard.press('PageDown')
     else await page.mouse.wheel(0,450)
     await page.waitForTimeout(250)
     assert.equal(await page.evaluate(()=>scrollY),lockedY,`${label}: menu holds document scroll`)
     await page.setViewportSize({...options.viewport,height:options.viewport.height-120})
     assert.ok(await page.locator('.drawer').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1),`${label}: drawer fits changing viewport height`)
     await page.keyboard.press('Escape')
     assert.equal(await page.locator('main').evaluate(el=>el.inert),false)
     await page.setViewportSize(options.viewport)
    }
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const logo=page.locator('.footer__wordmark svg')
    assert.equal(await logo.count(),1,`${label}: footer uses the actual vector logo`)
    const brand=await logo.evaluate(el=>{
     const r=el.getBoundingClientRect(),ids=[...document.querySelectorAll('svg mask[id]')].map(el=>el.id)
     return {width:r.width,height:r.height,viewBox:el.getAttribute('viewBox'),fill:getComputedStyle(el.querySelector('[data-logo-part="bs"]')).fill,headerFill:getComputedStyle(document.querySelector('.nav [data-logo-part="bs"]')).fill,uniqueMasks:new Set(ids).size===ids.length,overflow:document.documentElement.scrollWidth>innerWidth}
    })
    assert.equal(brand.viewBox,'18 36 113 83')
    assert.ok(Math.abs(brand.width/brand.height-113/83)<.01,'logo proportions stay unchanged')
    assert.equal(brand.fill,brand.headerFill,'footer retains the gold brand colour')
    assert.equal(brand.uniqueMasks,true,'inline header/footer logos have separate mask IDs')
    assert.equal(brand.overflow,false)
    await page.locator('footer').screenshot({path:`${out}/${label}-footer.png`})
    await page.waitForTimeout(120)
    const beforeRoute=await page.locator('footer').evaluate(el=>({y:scrollY,top:el.getBoundingClientRect().top}))
    await page.locator('.footer a[href="/privacy"]').click()
    await page.locator('.privacy').waitFor()
    assert.equal(await page.evaluate(()=>scrollY),0)
    await page.goBack();await page.locator('#products').waitFor();await page.waitForTimeout(250)
    await writeFile(`${out}/${label}-navigation.json`,JSON.stringify(await page.locator('footer').evaluate((el,before)=>({before,after:{y:scrollY,top:el.getBoundingClientRect().top,max:document.documentElement.scrollHeight-innerHeight},requests:window.scrollRequests}),beforeRoute),null,2))
    await page.waitForFunction(top=>Math.abs(document.querySelector('footer').getBoundingClientRect().top-top)<2,beforeRoute.top,{timeout:10000})
    const restoredFooterTop=await page.locator('footer').evaluate(el=>el.getBoundingClientRect().top)
    assert.ok(Math.abs(restoredFooterTop-beforeRoute.top)<2,`${label}: Back restores the visible footer (${beforeRoute.top} -> ${restoredFooterTop})`)
    assert.equal(await page.locator('#brand-intro').evaluate(el=>el.hidden),true)
    results.push({engine,engineVersion:browser.version(),name,capability,cards,start,moving,brand})
    await page.close();console.log(`PASS ${label}: animation, scroll, background, navigation and footer`)
   }
   const fallback=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'})
   await fallback.goto(origin);await fallback.locator('#products').scrollIntoViewIfNeeded();await fallback.waitForTimeout(200)
   assert.equal(await fallback.locator('canvas').count(),0)
   assert.equal(await fallback.locator('.product-card').count(),6)
   await fallback.close()
  } finally {await browser.close()}
 }
 assert.deepEqual(errors,[])
 console.log(`PASS ${results.length} WebKit/Chromium viewport journeys`)
} finally {
 await writeFile(`${out}/engine-results.json`,JSON.stringify({origin,results,errors,evidence:'Browser engines on Windows; physical Apple devices are unverified.'},null,2))
}
