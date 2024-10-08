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



const getTimeRange = () => {
  const startTime = Math.floor(
    dayjs().subtract(1, "day").startOf("day").valueOf() / 1000,
  );
  const endTime = Math.floor(dayjs().endOf("day").valueOf() / 1000);
  return { startTime, endTime };
};







const parseCSV = () => {
  const workbook = xlsx.readFile("./meetingData.xlsx", { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  return data;
};

const uploadToFeishuTable = async (records: any[], feishuAPI: Feishu) => {


  // 这里添加上传到飞书多维表格的逻辑
  console.log("上传到飞书多维表格的数据:", records);
  const tableFields = records[0];

  const tableData = records.map((record) => {
    return tableFields.reduce((acc: any, field: any, index: any) => {
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

  if (!appId || !appSecret) {
    console.log("请在环境变量配置APP_ID和APP_SECRET");
    process.exit(1);
  }
  const feishuAPI = new Feishu({
    appId: appId,
    appSecret: appSecret,
  });

  try {
    const tenantAccessToken = await feishuAPI.initAccessToken();
    console.log("tenantAccessToken", tenantAccessToken);

    const { startTime, endTime } = getTimeRange();

    const taskId = await feishuAPI.requestMeetingExport(
      startTime,
      endTime,
    );
    const fileToken = await feishuAPI.waitForExportCompletion(taskId);

    await feishuAPI.downloadFile(fileToken);

    const records = parseCSV();
    console.log("解析后的记录数:", records.length);

    await uploadToFeishuTable(records, feishuAPI);
  } catch (error) {
    console.error("同步会议数据时出错:", error);
  }
};

syncMeetingData();
