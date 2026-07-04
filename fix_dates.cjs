const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('grep -rl "toISOString" src/').toString().trim().split('\n');

for (const file of files) {
  if (!file) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('new Date().toISOString()')) {
    // Add import { format } from 'date-fns' if not exists
    if (!content.includes("from 'date-fns'") && !content.includes('from "date-fns"')) {
        content = "import { format } from 'date-fns';\n" + content;
    }
    
    // Replace new Date().toISOString().split('T')[0] with format(new Date(), 'yyyy-MM-dd')
    content = content.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, "format(new Date(), 'yyyy-MM-dd')");
    
    // Replace remaining new Date().toISOString() with format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    content = content.replace(/new Date\(\)\.toISOString\(\)/g, "format(new Date(), \"yyyy-MM-dd'T'HH:mm:ssXXX\")");
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
