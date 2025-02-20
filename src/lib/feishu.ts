import * as lark from '@larksuiteoapi/node-sdk';

/**
 * 获取飞书应用鉴权token
 * @returns
 */

export default class Feishu {
  private client: lark.Client;

  constructor({ appId, appSecret }: { appId: string; appSecret: string }) {
    this.client = new lark.Client({
      appId,
      appSecret,
    });
  }

  async getBitableData({
    tableToken,
    tableId,
    body = {},
  }: {
    tableToken: string;
    tableId: string;
    body?: any;
  }) {
    try {
      const response = await this.client.bitable.appTableRecord.search({
        path: {
          app_token: tableToken,
          table_id: tableId,
        },
        params: {
          page_size: 500,
        },
        data: body,
      });
      return response.data?.items ?? [];
    } catch (error) {
      console.log('获取数据失败', error);
      process.exit(1);
    }
  }

  async removeBitableRecord({
    appToken,
    tableId,
    recordId,
  }: {
    appToken: string;
    tableId: string;
    recordId: string;
  }) {
    return await this.client.bitable.appTableRecord.delete({
      path: {
        app_token: appToken,
        table_id: tableId,
        record_id: recordId,
      },
    });
  }

  async addBitableRecord({
    appToken,
    tableId,
    fields,
  }: {
    appToken: string;
    tableId: string;
    fields: any;
  }) {
    return await this.client.bitable.appTableRecord.create({
      path: {
        app_token: appToken,
        table_id: tableId,
      },
      data: {
        fields,
      },
    });
  }

  async requestMeetingExport(startTime: number, endTime: number) {
    const response = await this.client.vc.export.meetingList({
      data: {
        start_time: startTime.toString(),
        end_time: endTime.toString(),
      },
    });
    return response.data?.task_id;
  }

  async requestParticipantExport({
    startTime,
    endTime,
    meetingNo,
  }: {
    startTime: number;
    endTime: number;
    meetingNo: string;
  }) {
    const response = await this.client.vc.export.participantList({
      data: {
        meeting_start_time: startTime.toString(),
        meeting_end_time: endTime.toString(),
        meeting_no: meetingNo,
      },
    });
    console.log('data', response);
    return response.data?.task_id ?? '';
  }

  async waitForExportCompletion(taskId: string) {
    while (true) {
      const response = await this.client.vc.export.get({
        path: {
          task_id: taskId,
        },
      });

      if (response.data?.status === 3) {
        console.log('任务完成', response.data.url);
        return response.data.file_token;
      } else {
        console.log('任务进行中');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  async downloadFile(fileToken: string, fileName: string) {
    const response = await this.client.vc.export.download({
      params: {
        file_token: fileToken,
      },
    });

    await response.writeFile(`./${fileName}.xlsx`);
    console.log('文件下载完成:', `./${fileName}.xlsx`);
  }

  async getMeetingList({
    startTime,
    endTime,
    meetingStatus = 1,
  }: {
    startTime: number;
    endTime: number;
    meetingStatus?: number;
  }) {
    try {
      const response = await this.client.vc.meetingList.get({
        params: {
          start_time: startTime.toString(),
          end_time: endTime.toString(),
          meeting_status: meetingStatus,
          page_size: 100,
          page_token: '',
        },
      });
      return response.data?.meeting_list;
    } catch (error) {
      console.log('获取会议列表失败', error);
      process.exit(1);
    }
  }

  async getParticipantList({
    startTime,
    endTime,
    meetingNo,
    meetingStatus = 1,
  }: {
    startTime: number;
    endTime: number;
    meetingNo: string;
    meetingStatus?: number;
  }) {
    try {
      const response = await this.client.vc.participantList.get({
        params: {
          meeting_start_time: startTime.toString(),
          meeting_end_time: endTime.toString(),
          meeting_no: meetingNo,
          meeting_status: meetingStatus,
        },
      });
      console.log('data', response, startTime, endTime, meetingNo);
      return response.data?.participants;
    } catch (error) {
      console.log('获取参会人列表失败', error, startTime, endTime, meetingNo);
      return undefined;
    }
  }
}
