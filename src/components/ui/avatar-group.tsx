import { cn } from '@/lib/utils';
import { MeetingResponse } from '@/types/api/meeting';

interface AvatarGroupProps {
  users: MeetingResponse['participantDurations'];
}

export function AvatarGroup({ users }: AvatarGroupProps) {
  if (!users || users.length === 0) {
    return null;
  }

  // 对用户进行排序，在线用户排在前面
  const sortedUsers = [...users].sort((a, b) => {
    const aOnline = a.leaveTime === '-';
    const bOnline = b.leaveTime === '-';
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return 0;
  });

  return (
    <div className="flex flex-wrap gap-2">
      {sortedUsers.map((user, index) => {
        const isOnline = user.leaveTime === '-';
        return (
          <div
            key={index}
            className={cn(
              'relative flex h-10 w-auto items-center justify-center rounded-full bg-white px-2 ring-gray-400',
              isOnline ? 'ring-2' : 'opacity-60 ring-1'
            )}
          >
            <div className={cn('text-xl font-medium text-gray-800')}>{user.name.slice(0, 7)}</div>
          </div>
        );
      })}
    </div>
  );
}
