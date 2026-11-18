/** Stationary-pointer regression for header-logo replay in Chromium and WebKit. */
import assert from 'node:assert/strict'
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const origin=process.env.SITE_URL||'http://127.0.0.1:4383'
for(const engine of (process.env.ENGINE||'chromium,webkit').split(',')) {
 const browser=await playwright[engine].launch(engine==='chromium'?{...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{headless:true})
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}})
  await page.goto(origin)
  await page.waitForFunction(()=>document.querySelector('#brand-intro')?.dataset.state==='idle')
  await page.evaluate(()=>scrollTo({top:400,behavior:'instant'}))
  const logo=await page.locator('.nav .brand').boundingBox()
  const x=logo.x+logo.width/2,y=logo.y+logo.height/2
  await page.mouse.move(x,y)
  await page.waitForFunction(()=>document.querySelector('.cursor')?.dataset.visible==='true')
  const clicked=await page.evaluate(({x,y})=>{
   document.querySelector('.nav .brand').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y}))
   const cursor=document.querySelector('.cursor')
   return {intro:document.documentElement.dataset.introActive,custom:document.documentElement.classList.contains('has-custom-cursor'),visible:cursor.dataset.visible,opacity:getComputedStyle(cursor).opacity}
  },{x,y})
  assert.equal(clicked.intro,'true')
  assert.equal(clicked.custom,false,`${engine}: logo click restores the native pointer in the same event`)
  assert.equal(clicked.visible,'false')
  assert.equal(clicked.opacity,'0',`${engine}: no fading ghost cursor during the replay`)
  const restored=await page.evaluate(async()=>{
   window.dispatchEvent(new Event('wheel'))
   await Promise.resolve()
   const cursor=document.querySelector('.cursor'),dot=cursor.querySelector('.cursor__dot')
   return {custom:document.documentElement.classList.contains('has-custom-cursor'),visible:cursor.dataset.visible,mode:cursor.dataset.mode,opacity:getComputedStyle(cursor).opacity,dotTransition:getComputedStyle(dot).transitionProperty}
  })
  assert.equal(restored.custom,true,`${engine}: the stationary mouse returns without another animation frame`)
  assert.equal(restored.visible,'true')
  assert.equal(restored.mode,'action')
  assert.equal(restored.opacity,'1')
  assert.ok(!restored.dotTransition.split(',').some(property=>property.trim()==='transform'),'the pointer hotspot must not tween from its old position')
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.waitForFunction(()=>!document.documentElement.classList.contains('has-custom-cursor'))
  assert.deepEqual(errors,[])
  console.log(`PASS ${engine}: same-event logo click, stationary-pointer return and reduced motion`)
 }finally{await browser.close()}
}
