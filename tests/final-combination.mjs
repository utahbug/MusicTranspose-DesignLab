import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs/promises';
const {chromium,webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8788/';const results=[];await fs.mkdir('screenshots',{recursive:true});await fs.mkdir('test-results',{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})){
 if(process.env.ENGINE&&process.env.ENGINE!==engine)continue;
 const b=await type.launch(engine==='chromium'?{channel:'msedge'}:{});
 try{for(const [width,height] of [[320,568],[390,844],[820,1180],[1194,834],[1440,900],[1920,1080]]){
 if(process.env.WIDTH&&Number(process.env.WIDTH)!==width)continue;
 const c=await b.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width<1440});
 // Any accidental access fails the test before browser data can be touched.
 await c.addInitScript(()=>{window.forbiddenCalls=[];for(const key of ['localStorage','sessionStorage','indexedDB','caches'])Object.defineProperty(window,key,{get(){forbiddenCalls.push(key);throw Error('Forbidden API: '+key);}});if(navigator.serviceWorker)navigator.serviceWorker.register=()=>{forbiddenCalls.push('serviceWorker.register');throw Error('No worker registration');};});
 const p=await c.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
 const dimensions={};for(const option of ['final-combination']){
  await p.goto(base+option+'.html');
  assert.equal(await p.locator('.destination').count(),6);assert.equal(await p.locator('.palette-choice,h1').count(),0);assert.deepEqual(await p.locator('.section-heading h2').allTextContents(),['Browse Music','Organize Music']);assert.equal(await p.locator('link[rel=manifest]').count(),0);
  assert.deepEqual(await p.locator('.destination strong').allTextContents(),['All Music','Children’s Songbook','Hymns for Home and Church','Hymns (1985)','Lists','Files']);
  assert.deepEqual(await p.locator('.app-footer button span').allTextContents(),['Home','Lists','Files','Notes','Keyboard','Settings']);
  for(const theme of ['light','dark']){
   if(theme==='dark')await p.locator('.theme-toggle').click();
   const geometry=await p.evaluate(()=>{
    const controls=[...document.querySelectorAll('button,a,input')].filter(e=>e.getClientRects().length&&!e.matches('.skip-link'));
    const bad=controls.filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44||r.left<-.1||r.right>innerWidth+.1;}).map(e=>e.outerHTML.slice(0,160));
    const clipped=[...document.querySelectorAll('.destination,.app-footer button')].filter(e=>e.scrollWidth>e.clientWidth).map(e=>e.textContent);
    const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number),lum=c=>c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
    const checks=[...document.querySelectorAll('.destination strong,.destination small,.app-footer button:not([aria-current]),.prototype-note')].map(e=>{let bg=e;while(bg&&getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(bg).backgroundImage==='none')bg=bg.parentElement;const a=lum(rgb(getComputedStyle(e).color)),style=getComputedStyle(bg||document.body),colors=style.backgroundImage.match(/rgba?\([^)]+\)/g)||[style.backgroundColor];return {text:e.textContent.trim(),ratio:Math.min(...colors.map(c=>{const b=lum(rgb(c));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}))};});
    return {overflow:document.documentElement.scrollWidth>innerWidth,bad,clipped,contrast:Math.min(...checks.map(c=>c.ratio)),checks};
   });
   const alignment=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {lefts:['.app-name','.opening-choice','.opening-choice>div','.music-search','#music-heading','#personal-heading','.music-destinations'].map(s=>r(s).left),headerRight:r('.info-button').right,gridRight:r('.music-destinations').right,searchWidth:r('.music-search').width,choiceBottom:r('.opening-choice').bottom,searchTop:r('.music-search').top,columns:getComputedStyle(document.querySelector('.music-destinations')).gridTemplateColumns.split(' ').length};});
   assert(Math.max(...alignment.lefts)-Math.min(...alignment.lefts)<1,JSON.stringify(alignment));assert(Math.abs(alignment.headerRight-alignment.gridRight)<1);assert(alignment.choiceBottom<=alignment.searchTop);assert(alignment.searchWidth<=820);if(width>=1440)assert(alignment.searchWidth>=750);assert.equal(alignment.columns,width<=700?1:2);
   const homeContrast=await p.evaluate(()=>{
 const button=document.querySelector('.app-footer button[aria-current]'),span=button.querySelector('span');if(!span.getClientRects().length)return null;
 const b=button.getBoundingClientRect(),r=span.getBoundingClientRect(),dx=Math.sin(110*Math.PI/180),dy=-Math.cos(110*Math.PI/180);
 const stops=[[0,[36,90,154]],[.34,[54,103,168]],[.61,[45,118,138]],[.82,[35,124,122]],[1,[47,139,97]]];
 const lum=c=>c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
 return Math.min(...[r.left,r.right].flatMap(x=>[r.top,r.bottom].map(y=>{const t=((x-b.left)*dx+(y-b.top)*dy)/(b.width*dx+b.height*dy);const i=Math.max(1,stops.findIndex(s=>s[0]>=t));const [a,c]=[stops[i-1],stops[i]],f=(t-a[0])/(c[0]-a[0]);return 1.05/(lum(a[1].map((v,j)=>v+(c[1][j]-v)*f))+.05)})));
 });assert(homeContrast===null||homeContrast>=4.5,'Home label contrast '+homeContrast);
 assert(!geometry.overflow);assert.deepEqual(geometry.bad,[]);assert.deepEqual(geometry.clipped,[]);assert(geometry.contrast>=4.5,JSON.stringify(geometry.checks));
   const rects=await p.locator('.destination').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}));const home=await p.locator('.app-footer button').first().evaluate(e=>({direction:getComputedStyle(e).flexDirection,bg:getComputedStyle(e).backgroundImage}));assert.equal(home.direction,'row');assert(home.bg.includes('linear-gradient'));await p.screenshot({path:`${engine==='chromium'?'screenshots':'test-results'}/${option}-${theme}-${width}-viewport.png`});const fullHeight=await p.evaluate(()=>document.documentElement.scrollHeight);await p.setViewportSize({width,height:fullHeight});await p.screenshot({fullPage:true,path:`${engine==='chromium'?'screenshots':'test-results'}/${option}-${theme}-${width}.png`});await p.setViewportSize({width,height});
   await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));const note=await p.locator('.prototype-note').boundingBox(),footer=await p.locator('.app-footer').boundingBox();assert(note.y+note.height<=footer.y,'last content clears fixed footer');await p.evaluate(()=>scrollTo(0,0));
   await p.locator('.music-search button').focus();await p.keyboard.press('Tab');assert(await p.locator('.destination').first().evaluate(e=>e===document.activeElement));assert.equal(await p.locator('.destination').first().evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
   for(const target of await p.locator('[data-preview]').all()){await target.click();assert(await p.locator('#preview-dialog').isVisible());assert.match(await p.locator('#preview-dialog').textContent(),/PROTOTYPE ONLY/);await p.keyboard.press('Escape');assert(await p.locator('#preview-dialog').isHidden());}
   await p.locator('#search').fill('Example search');await p.locator('.music-search button').click();assert.equal(await p.locator('#preview-title').textContent(),'Search music');await p.locator('#close-preview').click();await p.locator('#search').fill('');
   await p.locator('input[value=lyrics]').check();assert(await p.locator('input[value=lyrics]').isChecked());await p.locator('input[value=score]').check();await p.evaluate(()=>scrollTo(0,0));
   assert.deepEqual(await p.evaluate(()=>forbiddenCalls),[]);results.push({engine,width,height,option,theme,minContrast:geometry.contrast});
  }
  await p.reload();assert.equal(await p.locator('html').getAttribute('data-theme'),null);assert(await p.locator('input[value=score]').isChecked());
 }
 await p.goto(base+'index.html');assert.equal(await p.locator('.option-card').count(),7);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);assert(requests.every(url=>url.startsWith(base)&&!url.includes('/MusicTranspose/')),JSON.stringify(requests));
 console.log('PASS',engine,width,'Final Combination, both themes, contrast, geometry, interactions, isolation');await c.close();
 }}finally{await b.close();}
}
await fs.writeFile('test-results/final-combination-validation.json',JSON.stringify(results,null,2));
