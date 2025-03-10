'use client';

import { useEffect, useState } from 'react';

import Cat from '@/components/Cat';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { Clock } from '@/components/ui/clock';
import { Particles } from '@/components/ui/particles';
import { TransparentHole } from '@/components/ui/transparent-hole';
import { cn } from '@/lib/utils';
import { MeetingResponse } from '@/types/api/meeting';

export default function Home() {
  const [meetingData, setMeetingData] = useState<MeetingResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/meeting');
        const data: MeetingResponse = await response.json();
        setMeetingData(data);
        console.log('meetingData', data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // 立即执行一次
    fetchData();

    // 设置每分钟执行一次的定时器
    const intervalId = setInterval(fetchData, 60000);

    // 清理函数
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border md:shadow-xl',
        {
          'bg-transparent': process.env.NODE_ENV === 'production',
          'bg-black': process.env.NODE_ENV !== 'production',
        }
      )}
    >
      <Particles
        className="absolute inset-0 z-10"
        quantity={200}
        size={0.5}
        color={'#000000'}
        refresh
      />
      <TransparentHole holeWidth="90%" holeHeight="75%" cornerRadius={16} />
      {meetingData && (
        <>
          <div className="absolute top-0 z-20 flex h-[12.5vh] w-full items-center justify-between px-[5%]">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Clock />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-4xl font-medium tracking-widest">
                当前在线: {meetingData.currentParticipants}
              </p>
              <p className="text-2xl font-medium tracking-widest text-gray-600">
                今日参与: {meetingData.totalParticipants}
              </p>
            </div>
            <div className="text-3xl font-medium tracking-tighter">
              关注主播后台自动私信加入方法（免费）
            </div>
          </div>
          <div className="absolute left-[5%] top-[88vh] w-[90%]">
            <AvatarGroup users={meetingData.participantDurations} />
          </div>
        </>
      )}
      <div className="absolute bottom-4 right-[5%] z-20 flex h-[12.5vh] w-full items-center justify-center">
        <Cat />
      </div>
    </div>
  );
}
