const fs = require('fs');

const stepNum = process.argv[2];
const outFile = process.argv[3];

if (!stepNum || !outFile) {
  console.error('Usage: node extract_screenshot.cjs <stepNum> <outFile>');
  process.exit(1);
}

const srcPath = `C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\59e69bcf-1918-4aab-a64a-e0f14e94a0ea\\.system_generated\\steps\\${stepNum}\\output.txt`;
const raw = fs.readFileSync(srcPath, 'utf8');
const data = JSON.parse(raw);

const step = data.normalized_result.steps.find(s => s.artifacts && s.artifacts.screenshot && s.artifacts.screenshot.value && s.artifacts.screenshot.value.data_base64);

if (step) {
  const base64 = step.artifacts.screenshot.value.data_base64;
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(outFile, buffer);
  console.log(`Saved ${outFile}, size: ${buffer.length} bytes`);
} else {
  console.error('Screenshot not found in output');
  process.exit(1);
}
