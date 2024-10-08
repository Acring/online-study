import fetch from "node-fetch";

// 请求地址和接口
const BASE_URL = "https://open.feishu.cn";

/**
 * 获取飞书应用鉴权token
 * @returns
 */

export default class Feishu {
  private appId: string;
  private appSecret: string;
  private tenant_access_token: string;

  constructor({ appId, appSecret }: { appId: string; appSecret: string }) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.tenant_access_token = "";
  }

  async initAccessToken() {
    const response = await fetch(
      `${BASE_URL}/open-apis/auth/v3/tenant_access_token/internal/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret,
        }),
      },
    );

    const result: any = await response.json();
    const { tenant_access_token } = result;
    this.tenant_access_token = tenant_access_token;
  }

  async getBitableData({
    appToken,
    tableId,
  }: {
    appToken: string;
    tableId: string;
  }) {
    if (!this.tenant_access_token) {
      await this.initAccessToken();
    }

    const response = await fetch(
      `${BASE_URL}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.tenant_access_token}`,
        },
      },
    );
    const result: any = await response.json();
    return result.data.items ?? [];
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
    if (!this.tenant_access_token) {
      await this.initAccessToken();
    }

    const response = await fetch(
      `${BASE_URL}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.tenant_access_token}`,
        },
      },
    );
    return response;
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
    if (!this.tenant_access_token) {
      await this.initAccessToken();
    }

    const response = await fetch(
      `${BASE_URL}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.tenant_access_token}`,
        },
        body: JSON.stringify({
          fields,
        }),
      },
    );
    return response;
  }

  async requestMeetingExport(startTime: number, endTime: number) {
    if (!this.tenant_access_token) {
      await this.initAccessToken();
    }

    const response = await fetch(
      `${BASE_URL}/open-apis/vc/v1/exports/meeting_list`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.tenant_access_token}`,
        },
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime,
        }),
      },
    );
  
    const data: any = await response.json();
    return data.data.task_id;
  }

  async waitForExportCompletion(taskId: string) {
    if (!this.tenant_access_token) {
      await this.initAccessToken();
    }

    while (true) {
      const taskResponse = await fetch(
        `${BASE_URL}/open-apis/vc/v1/exports/${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.tenant_access_token}`,
          },
        },
      );
  
      const taskData: any = await taskResponse.json();
      if (taskData.data.status === 3) {
        console.log("任务完成", taskData.data.url);
        return taskData.data.file_token;
      } else {
        console.log("任务未完成");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 等待5秒后再次检查
      }
    }
  }

  async downloadFile(fileToken: string) {
    if (!this.tenant_access_token) {
      await this.initAccessToken();
    }

    const response = await fetch(
      `${BASE_URL}/open-apis/vc/v1/exports/download?file_token=${fileToken}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.tenant_access_token}`,
        },
      },
    );
  
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const fs = require('fs');
    fs.writeFileSync("./meetingData.xlsx", uint8Array);
    console.log("文件下载完成:", "./meetingData.xlsx");
  }
}
