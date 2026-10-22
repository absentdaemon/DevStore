const fs = require('fs');
const path = require('path');

const outFile = process.argv[2];
if (!outFile) {
  console.error('Usage: node extract_latest.cjs <outFile>');
  process.exit(1);
}

const stepsDir = 'C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\59e69bcf-1918-4aab-a64a-e0f14e94a0ea\\.system_generated\\steps';
const entries = fs.readdirSync(stepsDir)
  .filter(name => /^\d+$/.test(name))
  .map(name => parseInt(name, 10))
  .sort((a, b) => b - a);

let found = false;
for (const stepNum of entries) {
  const file = path.join(stepsDir, String(stepNum), 'output.txt');
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      if (raw.includes('data_base64')) {
        const data = JSON.parse(raw);
        const steps = data.normalized_result?.steps || [];
        const step = steps.find(s => s.artifacts?.screenshot?.value?.data_base64);
        if (step) {
          const base64 = step.artifacts.screenshot.value.data_base64;
          const buffer = Buffer.from(base64, 'base64');
          fs.writeFileSync(outFile, buffer);
          console.log(`Extracted screenshot from step ${stepNum} to ${outFile} (${buffer.length} bytes)`);
          found = true;
          break;
        }
      }
    } catch (e) {
      // ignore parse errors and continue
    }
  }
}

if (!found) {
  console.error('No screenshot found in recent steps');
  process.exit(1);
}
