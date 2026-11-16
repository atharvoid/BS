/** Actual pointer/touch and section-navigation checks against the built site. */
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const browser=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const origin=process.env.SITE_URL||'http://127.0.0.1:4383',out=process.env.EVIDENCE_DIR||'output/motion-review/scenes',results=[],errors=[]
await mkdir(out,{recursive:true})
async function trackedPage(options) {
 const page=await browser.newPage(options)
 page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{window.sceneEvents=[];window.addEventListener('bs:scene-pointer',e=>window.sceneEvents.push(e.detail))})
 return page
}
async function touch(page,dx,dy) {
 const cdp=await page.context().newCDPSession(page)
 const box=await page.locator('.hero canvas').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]})
 for(let i=1;i<=10;i++) {
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/10,y:y+dy*i/10,id:1}]})
  await page.waitForTimeout(25)
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
 await page.waitForTimeout(350)
 await cdp.detach()
}
try {
 const phone=await trackedPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true})
 await phone.goto(origin);await phone.keyboard.press('Escape')
 await phone.locator('.hero__stage').scrollIntoViewIfNeeded()
 await phone.locator('.hero [data-scene-ready="true"]').waitFor({timeout:60000})
 await phone.waitForTimeout(4900)
 assert.equal(await phone.locator('.hero [data-scene-ready]').getAttribute('data-motion'),'frozen')
 const beforeY=await phone.evaluate(()=>scrollY),before=await phone.locator('.hero canvas').screenshot()
 await touch(phone,95,0)
 assert.ok(Math.abs(await phone.evaluate(()=>scrollY)-beforeY)<2,'horizontal rotation does not scroll the document')
 const events=await phone.evaluate(()=>window.sceneEvents)
 assert.ok(events.some(e=>e.phase==='drag'&&e.pointerType==='touch'),'horizontal intent reaches the actual globe drag')
 assert.notDeepEqual(await phone.locator('.hero canvas').screenshot(),before,'a settled globe still responds with changed pixels')
 await phone.screenshot({path:`${out}/phone-globe.png`})
 await touch(phone,0,-170)
 const afterY=await phone.evaluate(()=>scrollY)
 assert.ok(afterY>beforeY+40,`vertical touch scroll remains native (${beforeY} -> ${afterY})`)
 const url=phone.url()
 assert.equal(url,new URL(origin).href,'touching a scene never navigates')
 results.push({flow:'settled globe horizontal rotation and native vertical touch scroll',beforeY,afterY,events})
 await phone.close()

 const desktop=await trackedPage({viewport:{width:1440,height:900}})
 await desktop.goto(origin);await desktop.keyboard.press('Escape')
 await desktop.locator('.hero [data-scene-ready="true"]').waitFor({timeout:60000})
 const box=await desktop.locator('.hero canvas').boundingBox(),x=box.x+box.width*.85,y=box.y+box.height*.5
 await desktop.mouse.move(x,y);await desktop.mouse.down();await desktop.mouse.move(x-100,y+15,{steps:12});await desktop.mouse.up()
 assert.ok(await desktop.evaluate(()=>window.sceneEvents.some(e=>e.phase==='drag')),'desktop globe accepts actual pointer drag')
 await desktop.locator('.hero__secondary').click()
 await desktop.waitForFunction(()=>Math.abs(document.querySelector('#products').getBoundingClientRect().top-88)<4,{},{timeout:15000})
 await desktop.locator('.nav a[href="/textiles"]').click()
 await desktop.locator('.page-hero--textile').waitFor()
 await desktop.locator('.page-hero--textile [data-scene-ready="true"]').waitFor({timeout:60000})
 await desktop.locator('.page-hero--textile .btn').click()
 await desktop.waitForFunction(()=>{const r=document.querySelector('#textile-enquiry').getBoundingClientRect();return r.top>=0&&r.top<180},{},{timeout:15000})
 assert.ok(await desktop.locator('#textile-enquiry').isVisible())
 await desktop.locator('.skip-link').evaluate(el=>el.click())
 assert.equal(await desktop.evaluate(()=>document.activeElement.id),'main','skip link moves focus to content')
 await desktop.goto(`${origin}/privacy`)
 await desktop.locator('.privacy__toc a[href="/privacy#storage"]').click()
 await desktop.waitForFunction(()=>{const r=document.querySelector('#storage').getBoundingClientRect();return r.top>=0&&r.top<250},{},{timeout:15000})
 await desktop.waitForFunction(()=>[...document.querySelectorAll('main h1,main h2,main p')].every(el=>{const r=el.getBoundingClientRect();return r.bottom<=100||r.top>=innerHeight||getComputedStyle(el).opacity!=='0'}),{},{timeout:5000})
 const invisible=await desktop.locator('main h1,main h2,main p').evaluateAll(els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.bottom>100&&r.top<innerHeight&&getComputedStyle(el).opacity==='0'}).map(el=>el.textContent))
 assert.deepEqual(invisible,[],'visible reading content is not stranded behind a reveal')
 await desktop.screenshot({path:`${out}/privacy-anchor.png`})
 results.push({flow:'desktop globe, home section, textile enquiry section, content skip and privacy anchors'})
 await desktop.close()
 assert.deepEqual(errors,[])
 await writeFile(`${out}/scene-results.json`,JSON.stringify({results,errors},null,2))
 console.log('PASS settled globe touch/drag, native scroll, desktop pointer and all section link families')
} finally {await browser.close()}
