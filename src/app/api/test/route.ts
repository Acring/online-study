import { NextResponse } from 'next/server';
import * as lark from '@larksuiteoapi/node-sdk';
import dayjs from 'dayjs';

import { config } from '@/lib/config';

export async function GET() {
  const client = new lark.Client({
    appId: config.feishu.appId,
    appSecret: config.feishu.appSecret,
  });

  // 开始时间设置为昨天凌晨（北京时间）
  const startTime = +(dayjs().subtract(1, 'day').startOf('day').valueOf() / 1000).toFixed(0);
  // 结束时间设置为今天晚上结束（北京时间）
  const endTime = +(dayjs().endOf('day').valueOf() / 1000).toFixed(0);

  const res = await client.vc.meetingList.get({
    params: {
      start_time: startTime.toString(),
      end_time: endTime.toString(),
      meeting_status: 1,
    },
  });

  console.log(res.data?.meeting_list);

  return NextResponse.json({ message: 'Hello, world!' });
}
