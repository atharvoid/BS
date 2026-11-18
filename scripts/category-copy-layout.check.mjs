import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const browser=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const out=process.env.EVIDENCE_DIR||'output/category-copy-layout'
await mkdir(out,{recursive:true})
try {
 for(const [width,height] of [[1920,690],[1440,900],[1280,720],[1024,640]]) {
  const page=await browser.newPage({viewport:{width,height}})
  await page.goto(new URL('/#product-tour',process.env.SITE_URL||'http://127.0.0.1:4383/').href)
  await page.keyboard.press('Escape')
  const rows=[]
  for(let i=0;i<6;i++) {
   await page.locator('#product-tour').evaluate((el,i)=>scrollTo({top:scrollY+el.getBoundingClientRect().top+(el.querySelector('.journey__runway').offsetHeight-innerHeight)*(i+.3)/6,behavior:'instant'}),i)
   await page.waitForFunction(i=>Math.abs(Number(document.querySelector('#product-tour').style.getPropertyValue('--journey-progress'))-(i+.3)/6)<.003,i)
   const row=await page.locator(`[data-chapter="${i}"]`).evaluate(el=>{
    const action=el.querySelector('.tlink').getBoundingClientRect(),detail=el.querySelector('.journey__detail').getBoundingClientRect(),shelf=document.querySelector('.journey__shelf').getBoundingClientRect()
    const header=el.closest('.journey__sticky').querySelector('.journey__header').getBoundingClientRect()
    return {top:action.top,bottom:detail.bottom,shelf:shelf.top,headerGap:el.getBoundingClientRect().top-header.bottom}
   })
   assert.ok(row.headerGap>=16,`${width}x${height}: category ${i} clears the tour header: ${JSON.stringify(row)}`)
   assert.ok(row.bottom<row.shelf-12,`${width}: category ${i} clears the shelf: ${JSON.stringify(row)}`)
   rows.push(row)
   if(i===1) {
    await page.locator('.gallery--journey[data-ready="true"]').waitFor({timeout:60000})
    await page.waitForTimeout(250)
    await page.screenshot({path:`${out}/${width}-crafts.png`})
   }
  }
  assert.ok(Math.max(...rows.map(r=>r.top))-Math.min(...rows.map(r=>r.top))<2,`${width}: all six actions share a baseline`)
  await page.locator('.nav a[href="/textiles"]').hover()
  await page.waitForTimeout(250)
  assert.equal(await page.locator('.cursor').getAttribute('data-mode'),'action')
  assert.equal(await page.locator('.cursor__label').textContent(),'')
  assert.equal(await page.locator('.cursor__label').evaluate(el=>getComputedStyle(el).opacity),'0')
  await page.close();console.log(`PASS ${width}x${height}: six aligned chapters and quiet navigation hover`)
 }
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
 await phone.goto(process.env.SITE_URL||'http://127.0.0.1:4383/');await phone.keyboard.press('Escape')
 await phone.locator('.product-card').first().scrollIntoViewIfNeeded()
 assert.equal(await phone.locator('.product-card').count(),6)
 assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 assert.doesNotMatch(await phone.locator('main').innerText(),/[—–]/)
 await phone.screenshot({path:`${out}/phone.png`})
 await phone.close()
}finally{await browser.close()}
