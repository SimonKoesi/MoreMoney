const fs=require('node:fs');const path=require('node:path');const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
  const assets=path.join(root,'platforms/ios/Resources/Assets.xcassets');
  const icon=path.join(assets,'AppIcon.appiconset');fs.mkdirSync(icon,{recursive:true});
  await sharp(path.join(root,'public/app-icon.png')).resize(1024,1024).flatten({background:'#0e1119'}).png().toFile(path.join(icon,'AppIcon.png'));
  fs.writeFileSync(path.join(icon,'Contents.json'),JSON.stringify({images:[{filename:'AppIcon.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2));
  fs.writeFileSync(path.join(assets,'Contents.json'),JSON.stringify({info:{author:'xcode',version:1}},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
