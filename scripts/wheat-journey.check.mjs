/** Run against npm run build + local preview. PLAYWRIGHT_MODULE may be an absolute file URL. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createCanvas, loadImage } from '@napi-rs/canvas'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {}),
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
})
const origin=process.env.SITE_URL || 'http://127.0.0.1:4383'
const out=process.env.EVIDENCE_DIR || '.poster-build/evidence'
await mkdir(out,{recursive:true})
const results=[]
const errors=[], requests=[]
async function pageAt(width,height,options={}) {
  const page=await browser.newPage({viewport:{width,height},...options})
  page.on('pageerror',e=>errors.push(e.message))
  page.on('request',r=>requests.push(r.url()))
  await page.goto(origin)
  await page.keyboard.press('Escape')
  return page
}
async function scroll(page,y) { await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y); await page.waitForTimeout(300) }
async function chapter(page,progress) {
  const y=await page.locator('#products').evaluate((el,p)=>el.getBoundingClientRect().top+scrollY+(el.querySelector('.journey__runway').offsetHeight-innerHeight)*p/6,progress)
  await scroll(page,y)
}
async function freeze(page) {
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))})
  await page.waitForTimeout(200)
}
async function thaw(page) {
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))})
}
const yaw=page=>page.locator('[data-motif="agriculture"]').getAttribute('data-presented-yaw').then(Number)
try {
 if(!process.env.PARITY_ONLY) {
 const desktop=await pageAt(1440,900)
 await chapter(desktop,2.3)
 await desktop.locator('#products[data-drawn="true"]').waitFor()
 await desktop.waitForTimeout(600)
 assert.equal(await desktop.locator('[data-chapter="2"]').evaluate(el=>el.inert),false)
 assert.equal(await desktop.locator('.gallery canvas').count(),1)
 const desktopSrc=await desktop.locator('.journey__anchor[data-motif="agriculture"] img').evaluate(el=>el.currentSrc)
 assert.ok(desktopSrc.includes('agriculture-mobile.webp?'),'large chapter must select the full poster')
 await freeze(desktop)
 const before=await yaw(desktop)
 await desktop.screenshot({path:`${out}/desktop-chapter.png`})
 const canvas=desktop.locator('.gallery canvas')
 const frame=await canvas.screenshot()
 await desktop.waitForTimeout(200)
 assert.deepEqual(await canvas.screenshot(),frame,'visible frozen canvas keeps its pixels')
 await thaw(desktop)
 await chapter(desktop,6)
 await desktop.waitForTimeout(500)
 assert.equal(await desktop.locator('[data-dock][data-filled="true"]').count(),6)
 assert.ok(await yaw(desktop)>=before,'forward docking must not rewind')
 await freeze(desktop)
 await desktop.screenshot({path:`${out}/desktop-dock.png`})
 const dockYaw=await yaw(desktop)
 await desktop.reload()
 await desktop.keyboard.press('Escape')
  await chapter(desktop,6)
 await desktop.locator('#products[data-drawn="true"]').waitFor()
 const restored=await yaw(desktop)
 assert.ok(Math.abs(restored-dockYaw)<.2,`reload must resume its paired pose: ${dockYaw} -> ${restored}`)
 await chapter(desktop,2.3)
 assert.ok(await yaw(desktop)>=dockYaw,'reverse scrolling must retain phase')
 assert.equal(await desktop.locator('.journey__directory li a').count(),6)
 const fit=await desktop.locator('.journey__anchor[data-motif="agriculture"]').evaluate(el=>{const r=el.getBoundingClientRect(),p=el.querySelector('img').getBoundingClientRect();return {slot:r.height,posterHeight:p.height,posterWidth:p.width}})
 assert.equal(fit.posterHeight,fit.slot)
 assert.ok(Math.abs(fit.posterWidth/fit.slot-1.25)<.001,'square anchor poster is fitted by height')
 results.push({view:'desktop',before,dockYaw,restored,fit})
 console.log('PASS desktop chapter/dock/reverse/reload/freeze/height fit')
 await desktop.close()

 const phone=await pageAt(390,844,{deviceScaleFactor:2,isMobile:true,hasTouch:true})
 const stage=phone.locator('.product-card__stage[data-motif="agriculture"]')
 await stage.scrollIntoViewIfNeeded()
  await scroll(phone,await stage.evaluate(el=>scrollY+el.getBoundingClientRect().top-140))
 await phone.locator('.gallery[data-ready="true"]').waitFor()
 await phone.waitForTimeout(5200)
 await freeze(phone)
 const phoneYaw=await yaw(phone)
 const first=await stage.screenshot()
 await phone.waitForTimeout(250)
 assert.deepEqual(await stage.screenshot(),first,'phone settles to pixel-identical frames')
 await phone.screenshot({path:`${out}/phone-390.png`})
 const box=await stage.boundingBox()
 assert.equal(await phone.locator('.product-card').count(),6)
 assert.equal(await phone.locator('.gallery canvas').count(),1)
 assert.equal(await phone.locator('.product-card').nth(2).getAttribute('href'),'/enquiry?category=agriculture-food')
 await thaw(phone)
 await scroll(phone,0)
 await stage.scrollIntoViewIfNeeded()
 await phone.waitForTimeout(400)
 assert.ok(Math.abs(await yaw(phone)-phoneYaw)<.02,'offscreen return keeps bounded phase')
 await freeze(phone)
 const reloadYaw=await yaw(phone)
 await phone.reload()
 await phone.keyboard.press('Escape')
 await stage.scrollIntoViewIfNeeded()
 await phone.locator('.gallery[data-ready="true"]').waitFor()
 assert.ok(Math.abs(await yaw(phone)-reloadYaw)<.04,'phone reload resumes the paired still')
 await freeze(phone)
 const pair=await phone.evaluate(()=>JSON.parse(sessionStorage.getItem('bs:agriculture:golden-wheat-v1')))
 assert.ok(pair?.image?.startsWith('data:image/png;base64,'),'lifecycle stores a matching still')
 const src=await stage.locator('img').evaluate(el=>el.currentSrc)
 assert.ok(src.startsWith('data:image/png'),'resume uses retained bitmap')
  await thaw(phone)
 await phone.locator('.product-card').nth(2).click()
 await phone.waitForURL('**/enquiry?category=agriculture-food')
 await phone.goBack()
 await phone.locator('.gallery[data-ready="true"]').waitFor()
 assert.ok(Math.abs(await yaw(phone)-reloadYaw)<.04,'Back retains pose')
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await freeze(phone)
  await phone.locator('.gallery canvas').evaluate(el=>el.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
  await phone.waitForTimeout(500)
  assert.equal(await phone.locator('.gallery canvas').count(),0,'context loss releases the failed renderer')
  assert.ok((await stage.locator('img').evaluate(el=>el.currentSrc)).startsWith('data:image/png'),'context loss uses retained specimen')
  await phone.screenshot({path:`${out}/context-loss.png`})
 results.push({view:'phone',box,phoneYaw,reloadYaw})
  console.log('PASS phone card/freeze/return/reload/Back/link/context loss')
 await phone.close()

 for(const [name,width,height] of [['reduced',320,568],['save-data',390,844],['no-webgl',1440,900]]) {
  const p=await browser.newPage({viewport:{width,height},...(name==='reduced'?{reducedMotion:'reduce'}:{})})
  p.on('pageerror',e=>errors.push(e.message))
  if(name==='save-data') await p.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:Object.assign(new EventTarget(),{saveData:true})}))
  if(name==='no-webgl') await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}})
  await p.goto(origin)
  await p.keyboard.press('Escape')
  const poster=p.locator(name==='no-webgl'?'.journey__directory-wheat':'.product-card__stage[data-motif="agriculture"] img')
  await poster.scrollIntoViewIfNeeded()
  await poster.evaluate(el=>el.decode())
  const src=await poster.evaluate(el=>el.currentSrc)
  assert.ok(src.includes('golden-wheat-v1'),'both agriculture sizes are versioned')
  assert.equal(await p.locator(name==='no-webgl'?'.journey__directory li a':'.product-card').count(),6)
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  if(name==='reduced') assert.equal(await p.locator('.mobile-products__grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1)
  await p.screenshot({path:`${out}/${name}.png`})
  results.push({view:name,currentSrc:src})
  await p.close()
 }
 console.log('PASS reduced-motion single column / Save-Data / no WebGL')
 }
 // Spend the existing phone motion window on row one. A late wheat card
 // legitimately starts still, letting the real registry be compared to its poster.
 const parity=await pageAt(390,844,{deviceScaleFactor:2,isMobile:true,hasTouch:true})
 const top=await parity.locator('#products').evaluate(el=>el.getBoundingClientRect().top+scrollY)
 await scroll(parity,top-220)
 await parity.locator('.gallery[data-ready="true"]').waitFor()
 await parity.waitForTimeout(5200)
 const wheat=parity.locator('.product-card__stage[data-motif="agriculture"]')
 await wheat.scrollIntoViewIfNeeded()
 await parity.waitForTimeout(500)
 await parity.locator('.gallery[data-ready="true"]').waitFor()
 await parity.waitForFunction(()=>document.querySelector('[data-motif="agriculture"]').dataset.presentedYaw!==undefined)
 await freeze(parity)
 assert.ok(Math.abs(await yaw(parity)-.7)<.001,'late card starts at canonical yaw')
 const retainedMask=await wheat.locator('img').getAttribute('src')
 const live=await wheat.screenshot()
 await parity.addStyleTag({content:'.gallery--cards{visibility:hidden!important}.product-card__stage[data-motif="agriculture"] .poster{visibility:visible!important;opacity:1!important}'})
 await wheat.locator('img').evaluate(el=>{
   el.src='/posters/agriculture-mobile.webp?v=golden-wheat-v1'
   el.srcset='/posters/agriculture-mobile-small.webp?v=golden-wheat-v1 375w, /posters/agriculture-mobile.webp?v=golden-wheat-v1 750w'
   return el.decode()
 })
 const still=await wheat.screenshot()
 await writeFile(`${out}/card-live.png`,live)
 await writeFile(`${out}/card-poster.png`,still)
 const a=await loadImage(live),b=await loadImage(still)
 const c=createCanvas(a.width,a.height),ctx=c.getContext('2d')
 ctx.drawImage(a,0,0);const aa=ctx.getImageData(0,0,a.width,a.height).data
 ctx.clearRect(0,0,a.width,a.height);ctx.drawImage(b,0,0);const bb=ctx.getImageData(0,0,a.width,a.height).data
 const mask=await loadImage(retainedMask)
 ctx.clearRect(0,0,a.width,a.height);ctx.drawImage(mask,0,0,a.width,a.height)
 const alpha=ctx.getImageData(0,0,a.width,a.height).data
 const edgeBand=Math.max(1,Math.ceil(a.width/mask.width))
 let pixels=0,error=0
 // Exclude one native renderer pixel at resampled alpha edges. A capped
 // canvas may span multiple screenshot pixels; thin outlines are reviewed too.
 for(let y=edgeBand;y<a.height-edgeBand;y++)for(let x=edgeBand;x<a.width-edgeBand;x++) {
   let opaque=true
   for(let dy=-edgeBand;dy<=edgeBand;dy++)for(let dx=-edgeBand;dx<=edgeBand;dx++)if(alpha[((y+dy)*a.width+x+dx)*4+3]<254)opaque=false
   if(!opaque)continue
   const i=(y*a.width+x)*4;pixels++
   for(let k=0;k<3;k++)error+=Math.abs(aa[i+k]-bb[i+k])
 }
 const mae=error/(pixels*3)
 assert.ok(pixels>200,'real specimen is present in both views')
 assert.ok(mae<=3,`phone object-only RGB difference: ${mae}`)
 results.push({view:'canonical phone parity',mae,objectPixels:pixels,nativePixelBand:edgeBand})
 await parity.close()
 assert.deepEqual(errors,[])
 assert.ok(!requests.some(url=>/PosterCapture|wheat-turn|SourcingIterations/.test(url)),'no authoring assets in production')
 await writeFile(`${out}/browser-results.json`,JSON.stringify({results,errors,requests:[...new Set(requests)]},null,2))
 console.log('PASS',JSON.stringify(results,null,2))
} catch(error) {
  for(const context of browser.contexts()) for(const page of context.pages()) {
    console.log('FAILED PAGE',page.url(),await page.evaluate(()=>({scrollY,hidden:document.hidden,products:document.querySelector('#products')?.outerHTML.slice(0,450),gallery:document.querySelector('.gallery')?.outerHTML.slice(0,300)})),errors)
    await page.screenshot({path:`${out}/failed.png`})
  }
  throw error
} finally {await browser.close()}
