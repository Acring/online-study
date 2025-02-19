export interface Participant {
  participant_name: string;
  department: string;
  user_id: string;
  meeting_room_id: string;
  employee_id: string;
  phone: string;
  email: string;
  device: string;
  app_version: string;
  public_ip: string;
  internal_ip: string;
  use_rtc_proxy: boolean;
  location: string;
  network_type: string;
  protocol: string;
  microphone: string;
  speaker: string;
  camera: string;
  audio: boolean;
  video: boolean;
  sharing: boolean;
  join_time: string;
  leave_time: string;
  time_in_meeting: string;
  leave_reason: string;
  accept_status: number;
}

export interface ParticipantResponse {
  code: number;
  msg: string;
  data: {
    participants: Participant[];
    page_token: string;
    has_more: boolean;
  };
}
