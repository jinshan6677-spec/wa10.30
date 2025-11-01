// 调试脚本 - 启动 Electron 并捕获控制台输出
const { spawn } = require('child_process');
const path = require('path');

console.log('启动 Electron 应用进行调试...\n');

const electronPath = require('electron');
const mainPath = path.join(__dirname, 'build', 'main', 'main.js');

const electronProcess = spawn(electronPath, [mainPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    ELECTRON_ENABLE_LOGGING: '1'
  }
});

electronProcess.on('error', (err) => {
  console.error('启动失败:', err);
});

electronProcess.on('exit', (code) => {
  console.log(`\nElectron 进程退出，代码: ${code}`);
  process.exit(code);
});
