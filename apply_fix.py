#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动修复脚本 - 扫码登录跳转问题
"""

import os
import sys
import time

def read_file(filepath):
    """读取文件内容"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    """写入文件内容"""
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        f.write(content)

def fix_connection_state_context():
    """修复 ConnectionStateContext.tsx"""
    filepath = r"E:\WhatsApp s\wa10.30\src\renderer\features\whatsapp\contexts\ConnectionStateContext.tsx"

    print("🔧 修复 ConnectionStateContext.tsx...")

    try:
        content = read_file(filepath)
        original_content = content
        fixes_applied = 0

        # 修复 1: 状态更新日志
        old_code_1 = """        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.CONNECTED,
          lastConnected: new Date(),
          instanceKey: data.instance,
          phoneNumber,
          sessionValid: true,
          error: null,
        }));"""

        new_code_1 = """        setConnectionState(prev => {
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
        });"""

        if old_code_1 in content:
            content = content.replace(old_code_1, new_code_1)
            fixes_applied += 1
            print("  ✅ 修复 1/3: 状态更新日志 - 已应用")
        else:
            print("  ⚠️  修复 1/3: 未找到匹配代码（可能已修复）")

        # 修复 2: 断开连接清除QR
        old_code_2 = """      } else if (data.state === 'close') {
        console.log('[ConnectionState] 🔌 WhatsApp connection closed');
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.DISCONNECTED,
          sessionValid: false, // 标记会话失效
        }));"""

        new_code_2 = """      } else if (data.state === 'close') {
        console.log('[ConnectionState] 🔌 WhatsApp connection closed');
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.DISCONNECTED,
          sessionValid: false,
          qrCode: null,
        }));"""

        if old_code_2 in content:
            content = content.replace(old_code_2, new_code_2)
            fixes_applied += 1
            print("  ✅ 修复 2/3: 断开连接清除QR - 已应用")
        else:
            print("  ⚠️  修复 2/3: 未找到匹配代码（可能已修复）")

        # 修复 3: 会话恢复日志
        old_code_3 = """          setConnectionState({
            status: ConnectionStatus.CONNECTED,
            instanceKey: INSTANCE_NAME,
            phoneNumber,
            qrCode: null,
            error: null,
            lastConnected: new Date(),
            reconnectAttempts: 0,
            sessionValid: true,
          });

          // 重新连接WebSocket以接收实时事件"""

        new_code_3 = """          setConnectionState({
            status: ConnectionStatus.CONNECTED,
            instanceKey: INSTANCE_NAME,
            phoneNumber,
            qrCode: null,
            error: null,
            lastConnected: new Date(),
            reconnectAttempts: 0,
            sessionValid: true,
          });

          console.log('[ConnectionState] ✅✅✅ SESSION RESTORED - CONNECTED ✅✅✅');
          console.log('[ConnectionState] 📊 Status:', ConnectionStatus.CONNECTED);
          console.log('[ConnectionState] 🔑 Instance:', INSTANCE_NAME);
          console.log('[ConnectionState] 📱 Phone:', phoneNumber);
          console.log('[ConnectionState] 🚀 Router should now navigate to /chat');

          // 重新连接WebSocket以接收实时事件"""

        if old_code_3 in content:
            content = content.replace(old_code_3, new_code_3)
            fixes_applied += 1
            print("  ✅ 修复 3/3: 会话恢复日志 - 已应用")
        else:
            print("  ⚠️  修复 3/3: 未找到匹配代码（可能已修复）")

        # 写入文件
        if content != original_content:
            write_file(filepath, content)
            print(f"\n✅ ConnectionStateContext.tsx 已更新 ({fixes_applied} 处修复)")
            return True
        else:
            print("\n⚠️  ConnectionStateContext.tsx 无需修改")
            return False

    except Exception as e:
        print(f"\n❌ 修复 ConnectionStateContext.tsx 失败: {e}")
        return False

def fix_app_tsx():
    """修复 App.tsx"""
    filepath = r"E:\WhatsApp s\wa10.30\src\renderer\App.tsx"

    print("\n🔧 修复 App.tsx...")

    try:
        content = read_file(filepath)
        original_content = content
        fixes_applied = 0

        # 修复 4: 删除 WhatsAppConnection 中的重复跳转逻辑
        # 查找并删除整个 useEffect
        import re
        pattern = r"  // 🔥 修复：登录成功后自动跳转到聊天页面.*?\n  }, \[connectionState\.status, location\.pathname\]\); // 🔥 添加 location\.pathname 依赖\n"
        matches = re.findall(pattern, content, re.DOTALL)

        if matches:
            content = re.sub(pattern, "", content, flags=re.DOTALL)
            fixes_applied += 1
            print("  ✅ 修复 4/5: 删除重复跳转逻辑 - 已应用")
        else:
            print("  ⚠️  修复 4/5: 未找到匹配代码（可能已修复）")

        # 修复 5: 增强 AppContent 路由守卫日志
        old_code_5 = """  // 🔥 全局路由守卫：如果已连接但在 /setup 页面，自动跳转到 /chat
  useEffect(() => {
    if (
      connectionState.status === ConnectionStatus.CONNECTED &&
      location.pathname === '/setup'
    ) {
      console.log('[AppContent] 🚀 Global redirect: CONNECTED on /setup → navigating to /chat');
      console.log('[AppContent] 📊 Status:', connectionState.status);
      console.log('[AppContent] 📍 Location:', location.pathname);
      navigate('/chat', { replace: true });
    }
  }, [connectionState.status, location.pathname, navigate]);"""

        new_code_5 = """  // 🔥 全局路由守卫：如果已连接但在 /setup 页面，自动跳转到 /chat
  useEffect(() => {
    console.log('[AppContent] 🔍 Route guard check - Status:', connectionState.status, 'Path:', location.pathname);

    if (
      connectionState.status === ConnectionStatus.CONNECTED &&
      location.pathname === '/setup'
    ) {
      console.log('[AppContent] 🚀🚀🚀 TRIGGERING NAVIGATION TO /chat 🚀🚀🚀');
      console.log('[AppContent] 📊 Status:', connectionState.status);
      console.log('[AppContent] 📍 Current path:', location.pathname);
      console.log('[AppContent] ➡️ Navigating to: /chat');
      navigate('/chat', { replace: true });
    } else if (connectionState.status === ConnectionStatus.CONNECTED) {
      console.log('[AppContent] ℹ️ Already connected but not on /setup, no navigation needed');
    } else {
      console.log('[AppContent] ⏸️ Not connected yet, status:', connectionState.status);
    }
  }, [connectionState.status, location.pathname, navigate]);"""

        if old_code_5 in content:
            content = content.replace(old_code_5, new_code_5)
            fixes_applied += 1
            print("  ✅ 修复 5/5: 增强路由守卫日志 - 已应用")
        else:
            print("  ⚠️  修复 5/5: 未找到匹配代码（可能已修复）")

        # 写入文件
        if content != original_content:
            write_file(filepath, content)
            print(f"\n✅ App.tsx 已更新 ({fixes_applied} 处修复)")
            return True
        else:
            print("\n⚠️  App.tsx 无需修改")
            return False

    except Exception as e:
        print(f"\n❌ 修复 App.tsx 失败: {e}")
        return False

def main():
    print("=" * 60)
    print("🔧 自动修复脚本 - 扫码登录跳转问题")
    print("=" * 60)
    print()

    # 停止 Node 进程
    print("📌 尝试停止 Node.js 进程...")
    os.system("taskkill /F /IM node.exe /T >nul 2>&1")
    time.sleep(1)

    # 应用修复
    success_count = 0

    if fix_connection_state_context():
        success_count += 1

    if fix_app_tsx():
        success_count += 1

    # 总结
    print("\n" + "=" * 60)
    if success_count > 0:
        print(f"✅ 修复完成！成功修改了 {success_count} 个文件")
    else:
        print("⚠️  所有文件可能已经被修复过了")
    print("=" * 60)
    print()
    print("📝 下一步操作：")
    print("  1. 运行: npm run dev")
    print("  2. 启动应用并扫码测试")
    print("  3. 查看控制台日志，应该看到:")
    print("     - ✅✅✅ STATE UPDATED TO CONNECTED ✅✅✅")
    print("     - 🚀🚀🚀 TRIGGERING NAVIGATION TO /chat 🚀🚀🚀")
    print()

if __name__ == '__main__':
    main()
