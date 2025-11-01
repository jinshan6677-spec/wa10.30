import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  isThisYear,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 智能格式化时间戳
 * - "刚刚" (< 1分钟)
 * - "5分钟前" (< 1小时)
 * - "14:30" (今天)
 * - "昨天" (昨天)
 * - "周一" (本周)
 * - "10/30" (今年)
 * - "2024/10/30" (其他)
 */
export function formatMessageTime(timestamp: Date | number | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

  // 刚刚 (< 1分钟)
  if (diffInMinutes < 1) {
    return '刚刚';
  }

  // X分钟前 (< 1小时)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  // 今天：显示时间 "14:30"
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }

  // 昨天
  if (isYesterday(date)) {
    return '昨天';
  }

  // 本周：显示星期 "周一"
  if (isThisWeek(date, { weekStartsOn: 1 })) {
    return format(date, 'EEEE', { locale: zhCN });
  }

  // 今年：显示月/日 "10/30"
  if (isThisYear(date)) {
    return format(date, 'MM/dd');
  }

  // 其他：显示完整日期 "2024/10/30"
  return format(date, 'yyyy/MM/dd');
}

/**
 * 格式化最后上线时间
 * - "在线" (当前在线)
 * - "5分钟前在线" (< 1小时)
 * - "今天14:30在线" (今天)
 * - "昨天在线" (昨天)
 * - "10/30在线" (今年)
 * - "2024/10/30在线" (其他)
 */
export function formatLastSeen(lastSeenAt: Date | number | string | undefined, isOnline: boolean): string {
  if (isOnline) {
    return '在线';
  }

  if (!lastSeenAt) {
    return '';
  }

  const date = lastSeenAt instanceof Date ? lastSeenAt : new Date(lastSeenAt);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

  // X分钟前在线 (< 1小时)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前在线`;
  }

  // 今天：显示时间
  if (isToday(date)) {
    return `今天${format(date, 'HH:mm')}在线`;
  }

  // 昨天
  if (isYesterday(date)) {
    return '昨天在线';
  }

  // 今年：显示月/日
  if (isThisYear(date)) {
    return `${format(date, 'MM/dd')}在线`;
  }

  // 其他：显示完整日期
  return `${format(date, 'yyyy/MM/dd')}在线`;
}

/**
 * 格式化相对时间（用于搜索结果等）
 * 例如："5分钟前"、"2小时前"、"3天前"
 */
export function formatRelativeTime(timestamp: Date | number | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return formatDistanceToNow(date, {
    locale: zhCN,
    addSuffix: true,
  });
}
