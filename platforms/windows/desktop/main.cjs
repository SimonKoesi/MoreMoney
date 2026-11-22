const { app, BrowserWindow, dialog, utilityProcess, session, shell } = require('electron');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
let window, server;
if(process.env.FINOVA_TEST_DATA)app.setPath('userData',path.dirname(process.env.FINOVA_TEST_DATA));
else app.setPath('userData',path.join(app.getPath('appData'),'finova'));
const lock=app.requestSingleInstanceLock();
if(!lock) app.quit();
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
async function port(){return new Promise((resolve,reject)=>{const socket=net.createServer();socket.on('error',reject);socket.listen(0,'127.0.0.1',()=>{const p=socket.address().port;socket.close(()=>resolve(p));});});}
async function start(){
  const dataDir=process.env.FINOVA_TEST_DATA || path.join(app.getPath('userData'),'data');
  const base=app.isPackaged?path.join(process.resourcesPath,'server'):path.join(app.getAppPath(),'desktop-server');
  const p=await port();
  const token=crypto.randomBytes(32).toString('hex');
  server=utilityProcess.fork(path.join(base,'server.js'),[],{cwd:base,env:{...process.env,NODE_ENV:'production',PORT:String(p),HOSTNAME:'127.0.0.1',FINOVA_DATA_DIR:dataDir,FINOVA_SESSION_TOKEN:token,DATABASE_URL:`file:${path.join(dataDir,'finova.db').replaceAll('\\','/')}`},stdio:'pipe'});
  // Only attach diagnostics to memory, never log finance data or tokens.
  let failed=false, diagnostics=''; server.on('exit',()=>{failed=true;});
  server.stderr.on('data',chunk=>{diagnostics=(diagnostics+chunk.toString()).slice(-4000);});
  const address=`http://127.0.0.1:${p}`;
  session.defaultSession.webRequest.onBeforeSendHeaders((details,callback)=>{if(details.url.startsWith(address+'/'))details.requestHeaders['X-Finova-Token']=token;callback({requestHeaders:details.requestHeaders});});
  let ready=false;
  for(let i=0;i<160;i++){if(failed)throw new Error('Lokaler MoreMoney-Dienst konnte nicht gestartet werden.'+(process.env.FINOVA_SMOKE==='1'?diagnostics:''));try{const response=await fetch(address+'/api/state',{headers:{'X-Finova-Token':token}});if(response.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}
  if(!ready)throw new Error('Der lokale Dienst antwortet nicht.');
  window=new BrowserWindow({width:1440,height:960,minWidth:380,minHeight:620,title:'MoreMoney',icon:path.join(base,'public/app-icon.png'),backgroundColor:'#0e1119',show:false,autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  window.webContents.setWindowOpenHandler(({url})=>{const target=new URL(url);if(target.origin===address)return {action:'allow',overrideBrowserWindowOptions:{webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}}};if(['https:','http:'].includes(target.protocol))void shell.openExternal(url);return {action:'deny'};});
  window.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==address)event.preventDefault();});
  window.once('ready-to-show',()=>{if(process.env.FINOVA_SMOKE!=='1')window.show();});
  await window.loadURL(address);
  if(process.env.FINOVA_SMOKE==='1'){
    const result=await window.webContents.executeJavaScript(`(async()=>{let d=await(await fetch('/api/state')).json();if(!d.accounts.length){const r=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'account',name:'Desktop-Persistenztest',type:'Girokonto',openingCents:12345})});if(!r.ok)throw new Error('Desktop-Buchung fehlgeschlagen');d=await r.json();}return {accounts:d.accounts.length,name:d.accounts[0].name,title:document.title,watchlistReady:Array.isArray(d.stocks)};})()`);
    result.unauthorizedStatus=(await fetch(address+'/api/state')).status;
    require('node:fs').writeFileSync(process.env.FINOVA_SMOKE_RESULT,JSON.stringify(result));
    app.quit();
  }
}
if(lock)app.whenReady().then(start).catch(error=>{if(process.env.FINOVA_SMOKE==='1')require('node:fs').writeFileSync(process.env.FINOVA_SMOKE_RESULT,JSON.stringify({error:error.message}));else dialog.showErrorBox('MoreMoney konnte nicht starten',error.message);app.quit();});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{if(server)server.kill();});
