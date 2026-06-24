const fs = require('fs');
const path = require('path');
const dirs = ['c:/Users/jayas/Videos/SIS/dashboard/app', 'c:/Users/jayas/Videos/SIS/dashboard/components'];
function walk(dir) {
  if(!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    let p = path.join(dir, file);
    if(fs.statSync(p).isDirectory()) walk(p);
    else if(p.endsWith('.tsx') || p.endsWith('.ts')) {
      let content = fs.readFileSync(p, 'utf8');
      
      let newContent = content.replace(/background:\s*"#E5A800",\s*color:\s*"#030617"/g, 'background: "#1B73BA", color: "white"');
      
      if(content !== newContent) {
        fs.writeFileSync(p, newContent, 'utf8');
        console.log('Fixed Buttons in:', p);
      }
    }
  });
}
dirs.forEach(walk);
console.log('Done.');
