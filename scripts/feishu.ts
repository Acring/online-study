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
}
