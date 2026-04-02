const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /skillbridge-container/g, to: 'fiverr-container' },
    { from: /skillbridge-green/g, to: 'fiverr-green' },
    { from: /skillbridge-dark/g, to: 'fiverr-dark' },
    { from: /skillbridge-gray/g, to: 'fiverr-gray' },
    { from: /skillbridge-light/g, to: 'fiverr-light' },
    { from: /skillbridge-border/g, to: 'fiverr-border' },
    { from: /skillbridge-hover/g, to: 'fiverr-hover' },
    { from: /Join SkillBridge/g, to: 'Join Fiverr' },
    { from: /SkillBridge International Ltd\./g, to: 'Fiverr International Ltd.' },
    { from: /Selling on SkillBridge/g, to: 'Selling on Fiverr' },
    { from: /Buying on SkillBridge/g, to: 'Buying on Fiverr' },
    { from: /Explore SkillBridge Business/g, to: 'Explore Fiverr Business' },
    { from: /Everything on SkillBridge/g, to: 'Everything on Fiverr' },
    { from: /SkillBridge Business/g, to: 'Fiverr Business' },
    { from: /SkillBridge Pro/g, to: 'Fiverr Pro' },
    { from: /SkillBridge Logo Maker/g, to: 'Fiverr Logo Maker' },
    { from: /SkillBridge Guides/g, to: 'Fiverr Guides' },
    { from: /SkillBridge Select/g, to: 'Fiverr Select' },
    { from: /SkillBridge Workspace/g, to: 'Fiverr Workspace' },
    { from: /Welcome to SkillBridge/g, to: 'Welcome to Fiverr Clone' },
    { from: />SkillBridge</g, to: '>Fiverr<' },
    { from: /"SkillBridge"/g, to: '"Fiverr"' },
    { from: /SkillBridge/g, to: 'Fiverr' },
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    console.log(`Checking directory: ${dir}`);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                processDirectory(filePath);
            }
        } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;
            replacements.forEach(r => {
                content = content.replace(r.from, r.to);
            });
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`[UPDATED] ${filePath}`);
            }
        }
    });
}

const targetDir = process.argv[2] || '.';
console.log(`Starting REVERSE rebranding in: ${path.resolve(targetDir)}`);
processDirectory(targetDir);
console.log('REVERSE Rebranding complete!');
