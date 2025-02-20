import dayjs from 'dayjs';

import { config, validateConfig } from '@/lib/config';
import Feishu from '@/lib/feishu';

/**
 * 获取学习状态的主函数
 * 用于统计飞书会议的参会情况和学习时长
 */
async function getStudyStatus() {
  // 验证配置文件是否正确
  validateConfig();

  // 初始化飞书 API 客户端
  const feishuAPI = new Feishu(config.feishu);

  // 计算查询时间范围
  // 开始时间设置为昨天凌晨
  const startTime = +(dayjs().subtract(1, 'day').startOf('day').valueOf() / 1000).toFixed(0);
  // 结束时间设置为今天晚上结束
  const endTime = +(dayjs().endOf('day').valueOf() / 1000).toFixed(0);

  // 获取会议列表
  // meetingStatus: "1" 表示正在进行中的会议
  const meetingList = await feishuAPI.getMeetingList({
    startTime,
    endTime,
  });

  if (!meetingList) {
    console.log('获取会议列表失败');
    process.exit(1);
  }
  // 获取第一个会议的会议号
  const meetingNo = meetingList[0].meeting_id;
  if (!meetingNo) {
    console.log('获取会议号失败');
    process.exit(1);
  }
  // 获取参会者列表
  const participantList = await feishuAPI.getParticipantList({
    startTime: dayjs(meetingList[0].meeting_start_time).unix(), // 会议开始时间
    endTime: dayjs().unix(), // 当前时间
    meetingNo,
  });
  if (!participantList) {
    console.log('获取参会者列表失败');
    process.exit(1);
  }

  console.log('participantList', participantList);
  // 统计当前在线的参会人数
  // leave_time 为 "-" 表示用户仍在会议中
  console.log('当前参会人数: ', participantList.filter((p) => p.leave_time === '-').length);

  // 获取当前时间用于计算学习时长
  const now = dayjs();
  console.log('学习时间统计:');
  // 遍历所有参会者，计算每个人的学习时长
  participantList.forEach((participant) => {
    // 转换加入时间为 dayjs 对象
    const joinTime = dayjs(participant.join_time);
    // 如果用户未离开，使用当前时间作为离开时间
    const leaveTime = participant.leave_time === '-' ? now : dayjs(participant.leave_time);
    // 计算学习时长（分钟）
    const duration = leaveTime.diff(joinTime, 'minute');
    // 输出每个参会者的学习时长
    console.log(`${participant.participant_name}: ${duration} 分钟`);
  });
}

// 执行主函数
getStudyStatus();
