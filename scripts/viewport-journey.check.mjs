/** Geometric/keyboard acceptance: all six reading states, five viewports.
 * SITE_URL=http://localhost:4173 PLAYWRIGHT_MODULE=playwright node scripts/viewport-journey.check.mjs
 * Optional BROWSER_EXECUTABLE for custom Chromium installations. */
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch({
 ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE}:{}),
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']
})
const results=[]
try {
for(const [w,h] of [[320,568],[390,844],[768,1024],[844,390],[1440,900]]){
 const page=await browser.newPage({viewport:{width:w,height:h}})
 await page.goto(process.env.SITE_URL || 'http://localhost:4173/',{waitUntil:'commit'});await page.waitForTimeout(7000)
 if(h<480){
  assert.equal(await page.locator('.journey__runway').evaluate(e=>e.offsetHeight),0);assert.equal(await page.locator('.journey__directory a').count(),6);console.log('PASS short viewport directory bypass',w,h);await page.close();continue
 }
 const top=await page.locator('#products').evaluate(e=>e.getBoundingClientRect().top+scrollY)
 const runway=await page.locator('.journey__runway').evaluate(e=>e.offsetHeight-innerHeight)
 for(let i=0;i<6;i++){
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+runway*(i+.3)/6)
  await page.waitForFunction(i=>!document.querySelector(`[data-chapter="${i}"]`).inert,i)
  const check=await page.locator(`[data-chapter="${i}"]`).evaluate(e=>{
   const box=n=>n.getBoundingClientRect()
   const link=e.querySelector('a'),shelf=document.querySelector('.journey__shelf'),header=document.querySelector('.journey__header')
   const cta=box(link),safe=box(shelf),head=box(header)
   return {label:e.querySelector('h3').textContent,ctaBottom:Math.round(cta.bottom),shelfTop:Math.round(safe.top),chapterTop:Math.round(box(e).top),headerBottom:Math.round(head.bottom),ctaCovered:cta.bottom>safe.top+1,headerOverlap:box(e).top<head.bottom-1,overflow:document.documentElement.scrollWidth>innerWidth}
  })
  results.push({w,h,i,...check});assert.equal(check.ctaCovered,false,JSON.stringify(results.at(-1)));assert.equal(check.headerOverlap,false,JSON.stringify(results.at(-1)));assert.equal(check.overflow,false,JSON.stringify(results.at(-1)))
 }
 if(w===390){
  await page.locator('.nav__toggle').click();assert.equal(await page.locator('main').evaluate(e=>e.inert),true);await page.keyboard.press('Escape');assert.equal(await page.locator('main').evaluate(e=>e.inert),false);assert.equal(await page.locator('.nav__toggle').evaluate(e=>document.activeElement===e),true)
 }
 console.log('PASS all chapter bounds',w,h);await page.close()
}
} finally { await browser.close() }
