import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const {chromium,webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8788/';const results=[];await fs.mkdir('screenshots',{recursive:true});await fs.mkdir('test-results',{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})){
 if(process.env.ENGINE&&process.env.ENGINE!==engine)continue;
 const b=await type.launch(engine==='chromium'?{channel:'msedge'}:{});
 try{for(const [width,height] of [[320,740],[390,844],[820,1180],[1194,820],[1440,900]]){
 if(process.env.WIDTH&&Number(process.env.WIDTH)!==width)continue;
 const c=await b.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width<1440});
 // Any accidental access fails the test before browser data can be touched.
 await c.addInitScript(()=>{window.forbiddenCalls=[];for(const key of ['localStorage','sessionStorage','indexedDB','caches'])Object.defineProperty(window,key,{get(){forbiddenCalls.push(key);throw Error('Forbidden API: '+key);}});if(navigator.serviceWorker)navigator.serviceWorker.register=()=>{forbiddenCalls.push('serviceWorker.register');throw Error('No worker registration');};});
 const p=await c.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
 for(const option of ['a','b','c']){
  await p.goto(base+option+'.html');
  assert.equal(await p.locator('.destination').count(),6);assert.equal(await p.locator('link[rel=manifest]').count(),0);
  assert.deepEqual(await p.locator('.destination strong').allTextContents(),['All Music','Children’s Songbook','Hymns for Home and Church','Hymns (1985)','Lists','Files']);
  assert.deepEqual(await p.locator('.app-footer button span').allTextContents(),['Home','Lists','Files','Notes','Keyboard','Settings']);
  for(const theme of ['light','dark']){
   if(theme==='dark')await p.locator('.theme-toggle').click();
   const geometry=await p.evaluate(()=>{
    const controls=[...document.querySelectorAll('button,a,input')].filter(e=>e.getClientRects().length&&!e.matches('.skip-link'));
    const bad=controls.filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44||r.left<-.1||r.right>innerWidth+.1;}).map(e=>e.outerHTML.slice(0,160));
    const clipped=[...document.querySelectorAll('.destination,.app-footer button')].filter(e=>e.scrollWidth>e.clientWidth).map(e=>e.textContent);
    const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number),lum=c=>c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
    const checks=[...document.querySelectorAll('.destination strong,.destination small,.app-footer button,.prototype-note')].map(e=>{let bg=e;while(bg&&getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)')bg=bg.parentElement;const a=lum(rgb(getComputedStyle(e).color)),b=lum(rgb(getComputedStyle(bg||document.body).backgroundColor));return {text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    return {overflow:document.documentElement.scrollWidth>innerWidth,bad,clipped,contrast:Math.min(...checks.map(c=>c.ratio)),checks};
   });
   assert(!geometry.overflow);assert.deepEqual(geometry.bad,[]);assert.deepEqual(geometry.clipped,[]);assert(geometry.contrast>=4.5,JSON.stringify(geometry.checks));
   await p.screenshot({path:`${engine==='chromium'?'screenshots':'test-results'}/${option}-${theme}-${width}.png`});
   await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));const note=await p.locator('.prototype-note').boundingBox(),footer=await p.locator('.app-footer').boundingBox();assert(note.y+note.height<=footer.y,'last content clears fixed footer');await p.evaluate(()=>scrollTo(0,0));
   await p.locator('.music-search button').focus();await p.keyboard.press('Tab');assert(await p.locator('.destination').first().evaluate(e=>e===document.activeElement));assert.equal(await p.locator('.destination').first().evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
   for(const target of await p.locator('[data-preview]').all()){await target.click();assert(await p.locator('#preview-dialog').isVisible());assert.match(await p.locator('#preview-dialog').textContent(),/PROTOTYPE ONLY/);await p.keyboard.press('Escape');assert(await p.locator('#preview-dialog').isHidden());}
   await p.locator('#search').fill('Example search');await p.locator('.music-search button').click();assert.equal(await p.locator('#preview-title').textContent(),'Search music');await p.locator('#close-preview').click();await p.locator('#search').fill('');
   await p.locator('input[value=lyrics]').check();assert(await p.locator('input[value=lyrics]').isChecked());await p.locator('input[value=score]').check();await p.evaluate(()=>scrollTo(0,0));
   assert.deepEqual(await p.evaluate(()=>forbiddenCalls),[]);results.push({engine,width,height,option,theme,minContrast:geometry.contrast});
  }
  await p.reload();assert.equal(await p.locator('html').getAttribute('data-theme'),null);assert(await p.locator('input[value=score]').isChecked());
 }
 await p.goto(base+'index.html');assert.equal(await p.locator('.option-card').count(),4);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(engine==='chromium'&&width===1440)await p.screenshot({path:'screenshots/comparison.png',fullPage:true});await p.locator('.option-card').nth(1).click();assert(p.url().endsWith('b.html'));await p.locator('.lab-home').click();assert(p.url().endsWith('index.html'));
 assert.deepEqual(errors,[]);assert(requests.every(url=>url.startsWith(base)&&!url.includes('/MusicTranspose/')),JSON.stringify(requests));
 console.log('PASS',engine,width,'A/B/C, both themes, contrast, geometry, interactions, isolation');await c.close();
 }}finally{await b.close();}
}
await fs.writeFile('test-results/validation.json',JSON.stringify(results,null,2));
