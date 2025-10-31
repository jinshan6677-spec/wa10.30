import { createRoot } from 'react-dom/client';

import { App } from './App';

// 标志位确保只渲染一次
let appRendered = false;

function renderApp() {
  if (appRendered) {
    console.log('[Renderer] App already rendered, skipping...');
    return;
  }

  const container = document.getElementById('root');
  if (container) {
    console.log('[Renderer] Rendering App...');
    const root = createRoot(container);
    root.render(<App />);
    appRendered = true;
  }
}

// 确保DOM加载完成
document.addEventListener('DOMContentLoaded', renderApp);

// 添加load事件监听作为后备
window.addEventListener('load', renderApp);

// 热模块替换支持
// if (import.meta.hot) {
//   import.meta.hot.accept('./App', () => {
//     const NextApp = require('./App').default;
//     const container = document.getElementById('root');
//     if (container) {
//       const root = createRoot(container);
//       root.render(<NextApp />);
//     }
//   });
// }
