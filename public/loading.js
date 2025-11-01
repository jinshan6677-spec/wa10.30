// 移除加载动画当页面加载完成
window.addEventListener('load', () => {
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 500);
});

// 错误处理
window.addEventListener('error', (e) => {
  console.error('应用加载错误:', e.error);
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', (e) => {
  console.error('未处理的Promise拒绝:', e.reason);
});
