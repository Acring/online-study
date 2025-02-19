import { config } from '@/lib/config';
import Feishu from '@/lib/feishu';
import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { MeetingResponse } from '@/types/api/meeting';

export async function GET() {
    // 开始时间设置为昨天凌晨
    const startTime = +(
      dayjs().subtract(1, "day").startOf("day").valueOf() / 1000
    ).toFixed(0);
    // 结束时间设置为今天晚上结束
    const endTime = +(dayjs().endOf("day").valueOf() / 1000).toFixed(0);
  

  // 初始化飞书 API 客户端
  const feishuAPI = new Feishu(config.feishu);
  // 获取访问令牌
  await feishuAPI.initAccessToken();
  const meetingList = await feishuAPI.getMeetingList({
    startTime,
    endTime,
    meetingStatus: "1",
  });
  console.log(meetingList);

  const meetingNo = meetingList[0].meeting_id;
  // 获取参会者列表
  const participantList = await feishuAPI.getParticipantList({
    startTime: dayjs(meetingList[0].meeting_start_time).unix(), // 会议开始时间
    endTime: dayjs().unix(), // 当前时间
    meetingNo,
    meetingStatus: "1",
  });

  // 统计当前在线的参会人数
  const currentParticipants = participantList.filter((p) => p.leave_time === "-").length;

  // 获取当前时间用于计算学习时长
  const now = dayjs();
  
  // 计算每个参会者的学习时长
  const participantDurations = participantList.map((participant) => {
    const joinTime = dayjs(participant.join_time);
    const leaveTime = participant.leave_time === "-" ? now : dayjs(participant.leave_time);
    const duration = leaveTime.diff(joinTime, "minute");
    
    return {
      name: participant.participant_name,
      duration,
      joinTime: participant.join_time,
      leaveTime: participant.leave_time,
    };
  });

  return NextResponse.json({
    meetingInfo: meetingList[0],
    currentParticipants,
    participantDurations,
    totalParticipants: participantList.length,
  } as MeetingResponse);
} 