const { spawn } = require('child_process');
const path = require('path');

const task = process.argv[2] || 'assembleRelease'; // assembleRelease | bundleRelease
const isWindows = process.platform === 'win32';
const androidDir = path.join(__dirname, '..', 'android');
const cmd = isWindows ? `gradlew.bat ${task}` : `./gradlew ${task}`;

const child = spawn(cmd, [], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: true,
  windowsHide: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
