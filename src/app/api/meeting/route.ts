import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { config } from '@/lib/config';
import Feishu from '@/lib/feishu';
import { MeetingResponse } from '@/types/api/meeting';

// 添加时区插件
dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET() {
  // 设置为北京时间
  const tz = 'Asia/Shanghai';

  // 开始时间设置为昨天凌晨（北京时间）
  const startTime = +(dayjs().tz(tz).subtract(1, 'day').startOf('day').valueOf() / 1000).toFixed(0);
  // 结束时间设置为今天晚上结束（北京时间）
  const endTime = +(dayjs().tz(tz).endOf('day').valueOf() / 1000).toFixed(0);

  // 初始化飞书 API 客户端
  const feishuAPI = new Feishu(config.feishu);
  // 获取访问令牌
  await feishuAPI.initAccessToken();
  const meetingList = await feishuAPI.getMeetingList({
    startTime,
    endTime,
    meetingStatus: '1',
  });

  const meetingNo = meetingList[0].meeting_id;
  // 获取参会者列表
  const participantList = await feishuAPI.getParticipantList({
    startTime: dayjs(meetingList[0].meeting_start_time).unix(), // 会议开始时间
    endTime: dayjs().unix(), // 当前时间
    meetingNo,
    meetingStatus: '1',
  });

  // 统计当前在线的参会人数
  const currentParticipants = participantList.filter((p) => p.leave_time === '-').length;

  // 获取当前北京时间
  const now = dayjs().tz(tz);

  // 计算每个参会者的学习时长
  const participantDurations = participantList.map((participant) => {
    const joinTime = dayjs(participant.join_time).tz(tz);
    const leaveTime = participant.leave_time === '-' ? now : dayjs(participant.leave_time).tz(tz);
    const duration = leaveTime.diff(joinTime, 'minute');

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
