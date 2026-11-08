import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const artifactDir=path.join(root,'.artifacts');
await mkdir(artifactDir,{recursive:true});
const baseURL=process.env.ASTRIA_TEST_URL||'http://127.0.0.1:3110';
let server;
let serverLog='';
let browser;
const failures=[];
const checks=[];
const consoleErrors=[];
async function check(name,fn){try{await fn();checks.push(name);console.log(`PASS ${name}`);}catch(error){failures.push({name,error:String(error)});console.error(`FAIL ${name}: ${error}`);}}
try {
  if(!process.env.ASTRIA_TEST_URL){
    server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','--port','3110'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
    server.stdout.on('data',data=>{serverLog+=data;});server.stderr.on('data',data=>{serverLog+=data;});
    let ready=false;
    for(let i=0;i<80;i++){try{const r=await fetch(baseURL,{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch{}if(server.exitCode!==null)throw new Error(`Preview exited: ${serverLog}`);await new Promise(resolve=>setTimeout(resolve,250));}
    if(!ready)throw new Error(`Preview did not start: ${serverLog}`);
  }
  browser=await chromium.launch({headless:true,...(process.env.ASTRIA_BROWSER_PATH?{executablePath:process.env.ASTRIA_BROWSER_PATH}:process.platform==='win32'?{channel:'msedge'}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',error=>consoleErrors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
  await page.goto(`${baseURL}/components`);await page.getByRole('heading',{name:'Pustaka komponen',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
  await check('desktop tokens and typography',async()=>{
    const style=await page.locator('.a-desktop-sidebar .a-sidebar').evaluate(node=>({width:node.getBoundingClientRect().width,bg:getComputedStyle(node).backgroundColor,font:getComputedStyle(node).fontFamily}));
    expect(style.width).toBe(248);expect(style.bg).toBe('rgb(17, 44, 59)');expect(style.font).toContain('IBM Plex Sans');
    await page.screenshot({path:path.join(artifactDir,'components-desktop.png'),fullPage:true});
  });
  for(const tab of ['Dasar','Formulir','Data & triase','Panel','Status & memuat','Identitas & chat']){
    await check(`axe WCAG A/AA: ${tab}`,async()=>{await page.getByRole('tab',{name:tab,exact:true}).click();await page.locator('[role=tabpanel][data-state=active]').waitFor();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);});
  }
  await check('dialog keyboard focus and return',async()=>{await page.getByRole('tab',{name:'Dasar',exact:true}).click();const trigger=page.getByRole('button',{name:'Cabut akses',exact:true});await trigger.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Tab');expect(await page.getByRole('dialog').evaluate(node=>node.contains(document.activeElement))).toBe(true);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(trigger).toBeFocused();});
  await check('form validation and save result',async()=>{await page.getByRole('tab',{name:'Formulir',exact:true}).click();const form=page.locator('section.a-card').filter({has:page.getByRole('heading',{name:'Pengaturan umum',exact:true})});await form.getByRole('button',{name:'Simpan perubahan',exact:true}).click();await expect(form.getByRole('button')).toBeDisabled();await expect(form.getByText('Perubahan tersimpan.')).toBeVisible();});
  await check('upload selection and simulated completion',async()=>{await page.getByRole('tab',{name:'Panel',exact:true}).click();await page.getByLabel('Pilih berkas alert').setInputFiles({name:'sample.json',mimeType:'application/json',buffer:Buffer.from('[{"EventID":4625}]')});await page.getByRole('button',{name:'Mulai triase',exact:true}).click();await expect(page.getByText('Triase selesai',{exact:true})).toBeVisible();});
  await check('chat local interaction',async()=>{await page.getByRole('tab',{name:'Identitas & chat',exact:true}).click();await page.getByRole('textbox',{name:'Pesan',exact:true}).fill('Periksa kartu contoh');await page.getByRole('button',{name:'Kirim',exact:true}).click();await expect(page.getByText('Periksa kartu contoh',{exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:'Pesan',exact:true})).toHaveValue('');});
  await check('queue search, filters, reset and detail navigation',async()=>{await page.goto(`${baseURL}/cards`);await page.getByRole('searchbox',{name:'Cari kartu',exact:true}).fill('svc-backup');await expect(page.getByRole('status')).toHaveText('Menampilkan 1 dari 8 kartu contoh');await page.getByLabel('Band',{exact:true}).selectOption('low');await expect(page.getByText('Tidak ada kartu yang cocok').first()).toBeVisible();await page.getByRole('button',{name:'Reset filter'}).click();await expect(page.getByRole('status')).toHaveText('Menampilkan 8 dari 8 kartu contoh');await page.getByRole('link',{name:'Dugaan pengambilalihan akun layanan svc-backup',exact:true}).click();await expect(page.getByRole('heading',{name:'IC-20261110-003',exact:true})).toBeVisible();await page.getByRole('link',{name:'EV-004217',exact:true}).first().click();expect(page.url()).toContain('#EV-004217');});
  for(const width of [1440,768,390]){
    await check(`queue layout and accessibility at ${width}px`,async()=>{await page.setViewportSize({width,height:900});await page.goto(`${baseURL}/cards`);await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>v.id)).toEqual([]);await page.screenshot({path:path.join(artifactDir,`queue-${width}.png`),fullPage:true});});
  }
  await check('mobile navigation focus, close and route',async()=>{await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('dialog').getByRole('link',{name:'Digest',exact:true}).click();await expect(page).toHaveURL(/digests$/);await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:path.join(artifactDir,'digests-mobile.png'),fullPage:true});});
  await check('all mascot assets resolve',async()=>{await page.goto(`${baseURL}/components`);await page.getByRole('tab',{name:'Identitas & chat',exact:true}).click();const images=page.locator('img.a-mascot');for(const img of await images.all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(node=>node.complete&&node.naturalWidth>0)).toBe(true);}});
  await check('every screen renders and passes axe at 1440px',async()=>{
    await page.setViewportSize({width:1440,height:900});
    const routes=['/login','/','/cards','/cards/IC-20261110-003','/digests','/digests/DG-20261109','/handover','/upload','/metrics','/cases','/cases/CS-20261110-001','/users','/configuration','/channels','/identities','/deliveries','/settings','/audit','/components'];
    for(const route of routes){const response=await page.goto(`${baseURL}${route}`);expect(response.status(),route).toBe(200);await page.evaluate(()=>document.fonts.ready);await expect(page.getByRole('heading',{level:1}).first(),route).toBeVisible();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({route,id:v.id,nodes:v.nodes.map(n=>n.target)})),route).toEqual([]);}
  });
  await check('login form signs in to the home page',async()=>{await page.goto(`${baseURL}/login`);await page.getByLabel('Nama pengguna').fill('rizky');await page.getByLabel('Kata sandi').fill('x');await page.getByRole('button',{name:'Masuk',exact:true}).click();await expect(page).toHaveURL(`${baseURL}/`,{timeout:10000});await expect(page.getByRole('heading',{name:'Beranda',exact:true})).toBeVisible();});
  await check('preview role changes the sidebar menu',async()=>{await page.goto(`${baseURL}/`);const nav=page.locator('.a-desktop-sidebar');await expect(nav.getByRole('link',{name:'Audit',exact:true})).toHaveCount(0);await page.getByLabel('Peran pratinjau').selectOption('admin');await expect(nav.getByRole('link',{name:'Audit',exact:true})).toBeVisible();await page.getByLabel('Peran pratinjau').selectOption('analis');});
  await check('handover form saves with a toast',async()=>{await page.goto(`${baseURL}/handover`);await page.getByLabel('Ringkasan').fill('Dua kartu masih terbuka di antrean');await page.getByRole('button',{name:'Kirim serah terima',exact:true}).click();await expect(page.getByText('Serah terima tercatat',{exact:true})).toBeVisible({timeout:10000});});
  await check('upload screen accepts JSONL and completes',async()=>{await page.goto(`${baseURL}/upload`);await page.getByLabel('Pilih berkas alert').setInputFiles({name:'hayabusa.jsonl',mimeType:'application/json',buffer:Buffer.from('{"EventID":4625}\n')});await page.getByRole('button',{name:'Mulai triase',exact:true}).click();await expect(page.getByText('Triase selesai',{exact:true})).toBeVisible({timeout:10000});});
  await check('metrics range switches data',async()=>{await page.goto(`${baseURL}/metrics`);await expect(page.getByText('142',{exact:true})).toBeVisible();await page.getByLabel('Rentang waktu').selectOption('30');await expect(page.getByText('611',{exact:true})).toBeVisible();});
  await check('audit verification reports an intact chain',async()=>{await page.goto(`${baseURL}/audit`);await page.getByRole('button',{name:'Verifikasi rantai'}).click();await expect(page.getByText('Rantai audit utuh',{exact:true})).toBeVisible({timeout:10000});});
  await check('channel test reports success and failure',async()=>{await page.goto(`${baseURL}/channels`);await page.getByRole('button',{name:'Tes Telegram tim',exact:true}).click();await expect(page.getByText('Tes kanal berhasil',{exact:true})).toBeVisible({timeout:10000});await page.getByRole('button',{name:'Tes Email piket',exact:true}).click();await expect(page.getByText('Tes kanal gagal',{exact:true})).toBeVisible({timeout:10000});});
  await check('unknown ids return 404',async()=>{for(const route of ['/cards/not-a-card','/digests/not-a-digest','/cases/not-a-case','/tidak-ada']){const response=await page.goto(`${baseURL}${route}`);expect(response.status(),route).toBe(404);await expect(page.getByRole('heading',{name:'404 · Halaman tidak ditemukan',exact:true}),route).toBeVisible();}});
  await check('no runtime errors',async()=>{expect(consoleErrors.filter(error=>!error.includes('404 (Not Found)'))).toEqual([]);});
}catch(error){failures.push({name:'browser setup',error:String(error)});console.error(error);}
finally{await browser?.close();if(server){server.kill();await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}await writeFile(path.join(artifactDir,'browser-results.json'),JSON.stringify({checks,failures,consoleErrors},null,2));await writeFile(path.join(artifactDir,'preview.log'),serverLog);}
if(failures.length)process.exitCode=1;else console.log(`All ${checks.length} browser checks passed.`);
