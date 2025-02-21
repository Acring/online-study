import { MeetingInfo } from '../meeting';

// 参会者时长信息
export interface ParticipantDuration {
  name: string;
  duration: number;
  joinTime: string;
  leaveTime: string;
}

// API 响应数据
export interface MeetingResponse {
  meetingInfo: MeetingInfo;
  currentParticipants: number;
  participantDurations: ParticipantDuration[];
  totalParticipants: number;
  now: string;
}
