import fs from "fs";
import dayjs from "dayjs";
import fetch from "node-fetch";
import dotenv from "dotenv";
import xlsx from "xlsx";
import Feishu from "./feishu";

// 加载 .env 文件
dotenv.config();

const appId = process.env.FEISHU_APP_ID;
const appSecret = process.env.FEISHU_APP_SECRET;

const tableToken = process.env.FEISHU_TABLE_TOKEN;
const tableId = process.env.FEISHU_TABLE_ID;

const getTenantAccessToken = async () => {
  const response = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
    },
  );

  const data: any = await response.json();
  return data.tenant_access_token;
};

const getTimeRange = () => {
  const startTime = Math.floor(
    dayjs().subtract(1, "day").startOf("day").valueOf() / 1000,
  );
  const endTime = Math.floor(dayjs().endOf("day").valueOf() / 1000);
  return { startTime, endTime };
};

const requestMeetingExport = async (tenantAccessToken, startTime, endTime) => {
  const response = await fetch(
    "https://open.feishu.cn/open-apis/vc/v1/exports/meeting_list",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tenantAccessToken}`,
      },
      body: JSON.stringify({
        start_time: startTime,
        end_time: endTime,
      }),
    },
  );

  const data: any = await response.json();
  return data.data.task_id;
};

const waitForExportCompletion = async (tenantAccessToken, taskId) => {
  while (true) {
    const taskResponse = await fetch(
      `https://open.feishu.cn/open-apis/vc/v1/exports/${taskId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tenantAccessToken}`,
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
};

const downloadFile = async (fileToken, tenantAccessToken) => {
  const response = await fetch(
    `https://open.feishu.cn/open-apis/vc/v1/exports/download?file_token=${fileToken}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tenantAccessToken}`,
      },
    },
  );

  const buffer = await response.buffer();
  fs.writeFileSync("./meetingData.xlsx", buffer);
  console.log("文件下载完成:", "./meetingData.xlsx");
};

const parseCSV = () => {
  const workbook = xlsx.readFile("./meetingData.xlsx", { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  return data;
};

const uploadToFeishuTable = async (records) => {
  const feishuAPI = new Feishu({
    appId: tableToken,
    appSecret: tableData,
  });

  // 这里添加上传到飞书多维表格的逻辑
  console.log("上传到飞书多维表格的数据:", records);
  const tableFields = records[0];

  const tableData = records.map((record) => {
    return tableFields.reduce((acc, field, index) => {
      acc[field] = record[index];
      return acc;
    }, {});
  });

  console.log("tableData", tableData);
};

const syncMeetingData = async () => {
  if (!process.env.APP_ID || !process.env.APP_SECRET) {
    console.log("请在环境变量配置APP_ID和APP_SECRET");
    process.exit(1);
  }

  if (!process.env.APP_TOKEN || !process.env.TABLE_ID) {
    console.log("请在环境变量配置APP_TOKEN和TABLE_ID");
    process.exit(1);
  }

  try {
    const tenantAccessToken = await getTenantAccessToken();
    console.log("tenantAccessToken", tenantAccessToken);

    const { startTime, endTime } = getTimeRange();
    console.log("startTime", startTime);
    console.log("endTime", endTime);

    const taskId = await requestMeetingExport(
      tenantAccessToken,
      startTime,
      endTime,
    );
    const fileToken = await waitForExportCompletion(tenantAccessToken, taskId);

    await downloadFile(fileToken, tenantAccessToken);

    const records = parseCSV();
    console.log("解析后的记录数:", records.length);

    await uploadToFeishuTable(records);
  } catch (error) {
    console.error("同步会议数据时出错:", error);
  }
};

syncMeetingData();
