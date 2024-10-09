/**
 * 同步会议数据
 * 1. 获取会议数据
 * 2. 获取参会人数据
 * 3. 上传会议数据
 * 4. 上传参会人数据
 * TODO:
 * 替换重复的会议数据
 * 统计每个会议的参会人数据
 * 替换重复的参会人数据
 * 将参会时常转换为分钟,方便统计
 */
import dayjs from "dayjs";
import dotenv from "dotenv";
import xlsx from "xlsx";
import Feishu from "./feishu.js";
import async from "async";

// 加载 .env 文件
dotenv.config();

const appId = process.env.APP_ID;
const appSecret = process.env.APP_SECRET;

const tableToken = process.env.TABLE_TOKEN;
const tableId = process.env.TABLE_ID;

const participantTableToken = process.env.PARTICIPANT_TABLE_TOKEN;
const participantTableId = process.env.PARTICIPANT_TABLE_ID;


interface BitableRecord {
  fields: Record<string, any>;
  id: string;
  record_id: string;
}

const getTimeRange = () => {
  const startTime = Math.floor(
    dayjs().subtract(1, "day").startOf("day").valueOf() / 1000,
  );
  const endTime = Math.floor(dayjs().endOf("day").valueOf() / 1000);
  return { startTime, endTime };
};

const parseXLSX = (fileName: string) => {
  const workbook = xlsx.readFile(`./${fileName}.xlsx`, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  return data;
};

const uploadMeetingData = async (records: any[], feishuAPI: Feishu) => {

  if(!tableToken || !tableId) {
    console.log("请在环境变量配置TABLE_TOKEN和TABLE_ID");
    process.exit(1);
  }
  // 这里添加上传到飞书多维表格的逻辑
  // console.log("上传到飞书多维表格的数据:", records);
  const tableFields = records[0];

  await async.mapLimit(records.slice(1), 10, async (values: any[]) => {
    // 合成record，对象
    const record = values.reduce((acc: any, field: any, index: any) => {
      // 参会人数和累计入会设备数需要转换为数字类型
      if(tableFields[index].trim() === "参会人数" || tableFields[index].trim() === "累计入会设备数") {
        acc[tableFields[index].trim()] = Number(field);
      } else {
        // trim 去掉空格
        acc[tableFields[index].trim()] = field;
      }
      return acc;
    }, {});
    const result = await feishuAPI.addBitableRecord({
      appToken: tableToken,
      tableId: tableId,
      fields: record,
    })
    // console.log("result", result);
  }, (err: any) => {
    if (err) {
      console.error("上传数据时出错:", err);
    }
  });
};

const uploadParticipantData = async ({ records, feishuAPI, meetingId }: { records: any[]; feishuAPI: Feishu; meetingId: string; }) => {
  if(!participantTableToken || !participantTableId) {
    console.log("请在环境变量配置PARTICIPANT_TABLE_TOKEN和PARTICIPANT_TABLE_ID");
    process.exit(1);
  }
  // 这里添加上传到飞书多维表格的逻辑
  console.log("上传到飞书多维表格的参会人数据:", records);
  const tableFields = records[0];
  await async.mapLimit(records.slice(1), 10, async (values: any[]) => {
    const record = values.reduce((acc: any, field: any, index: any) => {
      acc[tableFields[index].trim()] = field;
      return acc;
    }, {});
    record['会议 ID'] = meetingId;
    const result = await feishuAPI.addBitableRecord({
      appToken: participantTableToken,
      tableId: participantTableId,
      fields: record,
    })
  }, (err: any) => {
    if (err) {
      console.error("上传数据时出错:", err);
    }
  });
}

const syncMeetingData = async () => {
  console.log("同步会议数据");
  if (!process.env.APP_ID || !process.env.APP_SECRET) {
    console.log("请在环境变量配置APP_ID和APP_SECRET");
    process.exit(1);
  }

  if (!process.env.TABLE_TOKEN || !process.env.TABLE_ID) {
    console.log("请在环境变量配置TABLE_TOKEN和TABLE_ID");
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
    console.log("初始化飞书API");
    await feishuAPI.initAccessToken();

    const { startTime, endTime } = getTimeRange();
    console.log("获取时间范围", startTime, endTime);

    const taskId = await feishuAPI.requestMeetingExport(
      startTime,
      endTime,
    );
    console.log("请求会议导出");

    const fileToken = await feishuAPI.waitForExportCompletion(taskId);
    console.log("等待会议导出完成");

    await feishuAPI.downloadFile(fileToken, "meetingData");
    console.log("下载会议数据");

    const records: any[] = parseXLSX("meetingData");
    console.log("解析后的记录数:", records.length);

    await uploadMeetingData(records, feishuAPI);

    const meetingStartTime = dayjs(records[1]?.[11]).subtract(1, "day").unix();
    const meetingEndTime = dayjs(records[1]?.[11]).unix();
    const meetingNo = records[1]?.[0] as string;
    const participantListTaskId = await feishuAPI.getParticipantList({
      startTime: meetingStartTime,
      endTime: meetingEndTime,
      meetingNo,
    });

    console.log("获取参会人数据任务", participantListTaskId);
    const participantList = await feishuAPI.waitForExportCompletion(participantListTaskId);
    console.log("参会人数据", participantList);


    await feishuAPI.downloadFile(participantList, "participantList");

    const participantListRecords = parseXLSX("participantList");
    console.log("参会人数据", participantListRecords);
    await uploadParticipantData({ records: participantListRecords, feishuAPI, meetingId: meetingNo });
  } catch (error) {
    console.error("同步会议数据时出错:", error);
  }
};

syncMeetingData();
