// 会议室信息类型
interface ReservedRoom {
  room_id: string;
  room_name: string;
}

// 单个会议信息类型
interface MeetingInfo {
  meeting_id: string;
  meeting_topic: string;
  meeting_type: number;
  organizer: string;
  department: string;
  user_id: string;
  employee_id: string;
  email: string;
  mobile: string;
  meeting_start_time: string;
  meeting_end_time: string;
  meeting_duration: string;
  number_of_participants: string;
  number_of_devices: string;
  audio: boolean;
  video: boolean;
  sharing: boolean;
  recording: boolean;
  telephone: boolean;
  reserved_rooms: ReservedRoom[];
  has_related_document: boolean;
}

// API 响应中的数据部分类型
interface MeetingListData {
  meeting_list: MeetingInfo[];
  page_token: string;
  has_more: boolean;
}

// API 完整响应类型
interface MeetingListResponse {
  code: number;
  msg: string;
  data: MeetingListData;
}

export type { ReservedRoom, MeetingInfo, MeetingListData, MeetingListResponse };
