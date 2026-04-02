const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /fiverr-container/g, to: 'skillbridge-container' },
    { from: /fiverr-green/g, to: 'skillbridge-green' },
    { from: /fiverr-dark/g, to: 'skillbridge-dark' },
    { from: /fiverr-gray/g, to: 'skillbridge-gray' },
    { from: /fiverr-light/g, to: 'skillbridge-light' },
    { from: /fiverr-border/g, to: 'skillbridge-border' },
    { from: /fiverr-hover/g, to: 'skillbridge-hover' },
    { from: /Join Fiverr/g, to: 'Join SkillBridge' },
    { from: /Fiverr Clone/g, to: 'SkillBridge' },
    { from: /Fiver Clone/g, to: 'SkillBridge' },
    { from: /Fiverr International Ltd\./g, to: 'SkillBridge International Ltd.' },
    { from: /Selling on Fiverr/g, to: 'Selling on SkillBridge' },
    { from: /Buying on Fiverr/g, to: 'Buying on SkillBridge' },
    { from: /Explore Fiverr Business/g, to: 'Explore SkillBridge Business' },
    { from: /Everything on Fiverr/g, to: 'Everything on SkillBridge' },
    { from: /Fiverr Business/g, to: 'SkillBridge Business' },
    { from: /Fiverr Pro/g, to: 'SkillBridge Pro' },
    { from: /Fiverr Logo Maker/g, to: 'SkillBridge Logo Maker' },
    { from: /Fiverr Guides/g, to: 'SkillBridge Guides' },
    { from: /Fiverr Select/g, to: 'SkillBridge Select' },
    { from: /Fiverr Workspace/g, to: 'SkillBridge Workspace' },
    { from: /"Fiverr"/g, to: '"SkillBridge"' },
    { from: />Fiverr</g, to: '>SkillBridge<' },
    { from: /Welcome to Fiverr Clone/g, to: 'Welcome to SkillBridge' },
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
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
                console.log(`Updated: ${filePath}`);
            }
        }
    });
}

const targetDir = process.argv[2] || '.';
console.log(`Starting rebranding in: ${path.resolve(targetDir)}`);
processDirectory(targetDir);
console.log('Rebranding complete!');
