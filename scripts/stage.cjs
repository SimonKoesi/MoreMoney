const fs=require('node:fs');const path=require('node:path');
const base=path.resolve(__dirname,'..'), target=path.join(base,'desktop-server');
fs.mkdirSync(target,{recursive:true});
fs.cpSync(path.join(base,'.next/standalone'),target,{recursive:true});
fs.mkdirSync(path.join(target,'.next'),{recursive:true});
fs.cpSync(path.join(base,'.next/static'),path.join(target,'.next/static'),{recursive:true});
fs.cpSync(path.join(base,'prisma'),path.join(target,'prisma'),{recursive:true});
if(fs.existsSync(path.join(base,'public')))fs.cpSync(path.join(base,'public'),path.join(target,'public'),{recursive:true});
console.log('Desktop-Server vorbereitet.');
const project=JSON.parse(fs.readFileSync(path.join(base,'package.json'),'utf8'));
const desktop=path.join(base,'desktop-app');
fs.mkdirSync(path.join(desktop,'desktop'),{recursive:true});
fs.copyFileSync(path.join(base,'desktop/main.cjs'),path.join(desktop,'desktop/main.cjs'));
project.build.electronVersion=JSON.parse(fs.readFileSync(path.join(base,'node_modules/electron/package.json'),'utf8')).version;
project.build.directories.output=path.join(base,'release',project.version);
// electron-builder deliberately skips a root node_modules directory in generic
// file matchers. Map it separately so the standalone runtime is self-contained.
project.build.extraResources=[{from:target,to:'server'},{from:path.join(target,'node_modules'),to:'server/node_modules'}];
for(const name of ['@libsql/win32-x64-msvc','@img/sharp-win32-x64','@img/sharp-libvips-win32-x64']){
  const source=path.join(base,'node_modules',name);
  if(fs.existsSync(source))fs.cpSync(source,path.join(target,'node_modules',name),{recursive:true});
}
async function finish(){
  await require('./icons.cjs')(base);
  project.build.win.icon=path.join(base,'build/icon.ico');
  delete project.build.win.signAndEditExecutable;
  project.build.win.signExecutable=false;
  fs.writeFileSync(path.join(desktop,'package.json'),JSON.stringify({name:project.name,version:project.version,description:project.description,author:project.author,main:project.main,build:project.build},null,2));
}
finish().catch(error=>{console.error(error.message);process.exitCode=1;});
