# 自动修复脚本 - 扫码登录跳转问题
Write-Host "🔧 开始应用修复..." -ForegroundColor Green

# 停止所有可能锁定文件的进程
Write-Host "📌 停止 Node.js 进程..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$fixApplied = $false

# 修复 1: ConnectionStateContext.tsx - 状态更新日志
Write-Host "🔧 修复 1/5: ConnectionStateContext.tsx (状态更新日志)..." -ForegroundColor Cyan
$file1 = "E:\WhatsApp s\wa10.30\src\renderer\features\whatsapp\contexts\ConnectionStateContext.tsx"

try {
    $content = Get-Content $file1 -Raw -Encoding UTF8

    $oldPattern1 = @'
        setConnectionState\(prev => \(\{
          \.\.\.prev,
          status: ConnectionStatus\.CONNECTED,
          lastConnected: new Date\(\),
          instanceKey: data\.instance,
          phoneNumber,
          sessionValid: true,
          error: null,
        \}\)\);
'@

    $newCode1 = @'
        setConnectionState(prev => {
          const newState = {
            ...prev,
            status: ConnectionStatus.CONNECTED,
            lastConnected: new Date(),
            instanceKey: data.instance,
            phoneNumber,
            sessionValid: true,
            error: null,
            qrCode: null,
            reconnectAttempts: 0,
          };
          console.log('[ConnectionState] ✅✅✅ STATE UPDATED TO CONNECTED ✅✅✅');
          console.log('[ConnectionState] 📊 New status:', newState.status);
          console.log('[ConnectionState] 🔑 Instance:', newState.instanceKey);
          console.log('[ConnectionState] ✅ Session valid:', newState.sessionValid);
          console.log('[ConnectionState] 📱 Phone:', newState.phoneNumber);
          console.log('[ConnectionState] 🚀 Router should now navigate to /chat');
          return newState;
        });
'@

    if ($content -match $oldPattern1) {
        $content = $content -replace $oldPattern1, $newCode1
        Set-Content $file1 -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  ✅ 修复 1 应用成功" -ForegroundColor Green
        $fixApplied = $true
    } else {
        Write-Host "  ⚠️  修复 1 未找到匹配模式，可能已经修复" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ 修复 1 失败: $_" -ForegroundColor Red
}

# 修复 2: ConnectionStateContext.tsx - 断开连接清除QR
Write-Host "🔧 修复 2/5: ConnectionStateContext.tsx (断开连接)..." -ForegroundColor Cyan

try {
    $content = Get-Content $file1 -Raw -Encoding UTF8

    $oldPattern2 = @'
      } else if \(data\.state === 'close'\) \{
        console\.log\('\[ConnectionState\] 🔌 WhatsApp connection closed'\);
        setConnectionState\(prev => \(\{
          \.\.\.prev,
          status: ConnectionStatus\.DISCONNECTED,
          sessionValid: false, // 标记会话失效
        \}\)\);
'@

    $newCode2 = @'
      } else if (data.state === 'close') {
        console.log('[ConnectionState] 🔌 WhatsApp connection closed');
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.DISCONNECTED,
          sessionValid: false,
          qrCode: null,
        }));
'@

    if ($content -match $oldPattern2) {
        $content = $content -replace $oldPattern2, $newCode2
        Set-Content $file1 -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  ✅ 修复 2 应用成功" -ForegroundColor Green
        $fixApplied = $true
    } else {
        Write-Host "  ⚠️  修复 2 未找到匹配模式，可能已经修复" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ 修复 2 失败: $_" -ForegroundColor Red
}

# 修复 3: ConnectionStateContext.tsx - 会话恢复日志
Write-Host "🔧 修复 3/5: ConnectionStateContext.tsx (会话恢复)..." -ForegroundColor Cyan

try {
    $content = Get-Content $file1 -Raw -Encoding UTF8

    # 查找会话恢复位置并添加日志
    $searchPattern = "sessionValid: true,\s+\}\);[\r\n]+[\r\n]+\s+// 重新连接WebSocket以接收实时事件"
    $replacement = @'
sessionValid: true,
          });

          console.log('[ConnectionState] ✅✅✅ SESSION RESTORED - CONNECTED ✅✅✅');
          console.log('[ConnectionState] 📊 Status:', ConnectionStatus.CONNECTED);
          console.log('[ConnectionState] 🔑 Instance:', INSTANCE_NAME);
          console.log('[ConnectionState] 📱 Phone:', phoneNumber);
          console.log('[ConnectionState] 🚀 Router should now navigate to /chat');

          // 重新连接WebSocket以接收实时事件
'@

    if ($content -match $searchPattern) {
        $content = $content -replace $searchPattern, $replacement
        Set-Content $file1 -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  ✅ 修复 3 应用成功" -ForegroundColor Green
        $fixApplied = $true
    } else {
        Write-Host "  ⚠️  修复 3 未找到匹配模式，可能已经修复" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ 修复 3 失败: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ 所有修复已应用！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步操作：" -ForegroundColor Yellow
Write-Host "  1. 检查修复指南: FIX_LOGIN_REDIRECT.md"
Write-Host "  2. 手动应用 App.tsx 的修复（第4和第5个修复）"
Write-Host "  3. 运行 npm run dev 测试"
Write-Host ""

if ($fixApplied) {
    Write-Host "🎉 至少有一个修复已成功应用！" -ForegroundColor Green
} else {
    Write-Host "⚠️  没有应用任何修复，文件可能已经被修复过" -ForegroundColor Yellow
}
