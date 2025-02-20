import { MeetingResponse } from '@/types/api/meeting';

interface AvatarGroupProps {
  users: MeetingResponse['participantDurations'];
}

function generateGradient(): string {
  const hue = Math.floor(Math.random() * 360);
  return `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 40) % 360}, 70%, 50%))`;
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
            className={`relative flex h-10 w-auto items-center justify-center rounded-full px-2 ring-2 ring-white ${
              isOnline ? '' : 'bg-gray-300'
            }`}
            style={isOnline ? { background: generateGradient() } : undefined}
          >
            <div className={`font-medium ${isOnline ? 'text-white' : 'text-gray-600'}`}>
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
