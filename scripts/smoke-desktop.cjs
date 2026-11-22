const {spawn}=require('node:child_process');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const version=require('../package.json').version;
const executable=path.resolve('release',version,'win-unpacked/FINOVA.exe');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'finova-desktop-test-'));
async function run(index){
  const resultFile=path.join(directory,`result-${index}.json`);
  const env={...process.env,FINOVA_TEST_DATA:path.join(directory,'data'),FINOVA_SMOKE:'1',FINOVA_SMOKE_RESULT:resultFile};
  delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(executable,[],{windowsHide:true,env,stdio:['ignore','pipe','pipe']});
  let diagnostics='';child.stdout.on('data',chunk=>{diagnostics+=chunk;});child.stderr.on('data',chunk=>{diagnostics+=chunk;});
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{child.kill();reject(new Error('Desktop-Start dauerte länger als 90 Sekunden.'));},90000);
    child.once('error',e=>{clearTimeout(timeout);reject(e);});child.once('exit',()=>{clearTimeout(timeout);resolve();});
  });
  if(!fs.existsSync(resultFile))throw new Error('Desktop lieferte kein Prüfergebnis. '+diagnostics.slice(-3000));
  const result=JSON.parse(fs.readFileSync(resultFile,'utf8'));
  if(result.accounts!==1||result.name!=='Desktop-Persistenztest'||result.unauthorizedStatus!==403)throw new Error(JSON.stringify(result));
  console.log(`Desktop-Start ${index}: UI geladen, SQLite persistent, fremder Zugriff gesperrt.`);
}
(async()=>{await run(1);await run(2);console.log('Desktop-Neustartprüfung bestanden.');})().catch(e=>{console.error(e);process.exitCode=1;});
