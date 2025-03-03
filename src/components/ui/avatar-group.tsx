import { cn } from '@/lib/utils';
import { MeetingResponse } from '@/types/api/meeting';

interface AvatarGroupProps {
  users: MeetingResponse['participantDurations'];
}

export function AvatarGroup({ users }: AvatarGroupProps) {
  if (!users || users.length === 0) {
    return null;
  }

  // 格式化时长显示
  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = (minutes / 60).toFixed(1);
      return `${hours}小时`;
    }
    return `${minutes}分钟`;
  };

  // 对用户进行排序，在线用户排在前面，同时按时长降序排序
  const sortedUsers = [...users].sort((a, b) => {
    const aOnline = a.leaveTime === '-';
    const bOnline = b.leaveTime === '-';
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return b.duration - a.duration; // 按时长降序排序
  });

  return (
    <div className="flex flex-wrap gap-2">
      {sortedUsers.map((user, index) => {
        const isOnline = user.leaveTime === '-';
        return (
          <div
            key={index}
            className={cn(
              'relative flex h-auto min-h-10 w-auto items-center justify-center gap-3 rounded-lg bg-white px-3 py-2 ring-gray-400',
              isOnline ? 'ring-2' : 'opacity-60 ring-1'
            )}
          >
            <div className={cn('text-xl font-medium text-gray-800')}>{user.name.slice(0, 7)}</div>
            <div className="text-sm text-gray-700">{formatDuration(user.duration)}</div>
          </div>
        );
      })}
    </div>
  );
}
