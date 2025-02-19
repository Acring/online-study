'use client';

import { Particles } from "@/components/ui/particles";
import { useEffect, useState } from "react";
import { MeetingResponse } from "@/types/api/meeting";

export default function Home() {
  const [meetingData, setMeetingData] = useState<MeetingResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/meeting');
        const data: MeetingResponse = await response.json();
        setMeetingData(data);
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
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
      <Particles
        className="absolute inset-0"
        quantity={100}
        ease={80}
        color={"#000000"}
        refresh
      />
      {meetingData && (
        <div className="z-10 p-6 space-y-4 bg-white/80 rounded-lg">
          <h1 className="text-2xl font-bold">{meetingData.meetingInfo.meeting_topic}</h1>
          <div className="space-y-2">
            <p className="text-lg">当前在线人数: {meetingData.currentParticipants}</p>
            <p className="text-lg">总参与人数: {meetingData.totalParticipants}</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">参会者学习时长:</h2>
            <div className="space-y-1">
              {meetingData.participantDurations.map((participant) => (
                <div key={participant.name} className="flex justify-between">
                  <span>{participant.name}</span>
                  <span>{participant.duration} 分钟</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
