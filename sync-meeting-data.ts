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

import fs from "fs";
import dayjs from "dayjs";
import dotenv from "dotenv";
import xlsx from "xlsx";
import Feishu from "./feishu.js";
import async from "async";

// 加载 .env 文件
dotenv.config();

const appId = process.env.APP_ID;
const appSecret = process.env.APP_SECRET;

// 会议数据
const meetingTableToken = process.env.TABLE_TOKEN;
const mettingTableId = process.env.TABLE_ID;

// 参会人数据
const participantTableToken = process.env.PARTICIPANT_TABLE_TOKEN;
const participantTableId = process.env.PARTICIPANT_TABLE_ID;

// 会议统计
const meetingStatisticTableToken = process.env.MEETING_STATISTIC_TABLE_TOKEN;
const meetingStatisticTableId = process.env.MEETING_STATISTIC_TABLE_ID;

// 参会人员统计
const participantStatisticTableToken =
  process.env.PARTICIPANT_STATISTIC_TABLE_TOKEN;
const participantStatisticTableId = process.env.PARTICIPANT_STATISTIC_TABLE_ID;

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
  removeXLSX(fileName);
  return data;
};

const removeXLSX = (fileName: string) => {
  fs.unlinkSync(`./${fileName}.xlsx`);
};

const uploadMeetingData = async (records: any[], feishuAPI: Feishu) => {
  if (!meetingTableToken || !mettingTableId) {
    console.log("请在环境变量配置TABLE_TOKEN和TABLE_ID");
    process.exit(1);
  }

  if (!meetingStatisticTableToken || !meetingStatisticTableId) {
    console.log(
      "请在环境变量配置MEETING_STATISTIC_TABLE_TOKEN和MEETING_STATISTIC_TABLE_ID",
    );
    process.exit(1);
  }

  // console.log("上传到飞书多维表格的数据:", records);
  const tableFields = records[0];

  const meetingBitableData = await feishuAPI.getBitableData({
    tableToken: meetingTableToken,
    tableId: mettingTableId,
  });

  // console.log("meetingBitableData", JSON.stringify(meetingBitableData));
  await async.mapLimit(
    records.slice(1),
    1,
    async (values: any[]) => {
      const meetingStatisticBitableData = await feishuAPI.getBitableData({
        tableToken: meetingStatisticTableToken,
        tableId: meetingStatisticTableId,
      });
      // 合成record，对象
      const record = values.reduce((acc: any, field: any, index: any) => {
        // 参会人数和累计入会设备数需要转换为数字类型
        if (
          tableFields[index].trim() === "参会人数" ||
          tableFields[index].trim() === "累计入会设备数"
        ) {
          acc[tableFields[index].trim()] = Number(field);
        } else {
          // trim 去掉空格
          acc[tableFields[index].trim()] = field;
        }
        return acc;
      }, {});

      // 补充会议日期
      record["会议日期"] = dayjs(
        dayjs(record["会议开始时间"]).format("YYYY-MM-DD"),
      ).valueOf();

      if (
        meetingBitableData.find(
          (item: any) =>
            item.fields["会议 ID"][0]["text"] === record["会议 ID"],
        )
      ) {
        console.log("会议数据已存在", record["会议 ID"]);
      } else {
        console.log("会议数据不存在，正在上传", record["会议 ID"]);

        const result = await feishuAPI.addBitableRecord({
          appToken: meetingTableToken,
          tableId: mettingTableId,
          fields: record,
        });
      }
      if (
        meetingStatisticBitableData.find(
          (item: any) =>
            dayjs(item.fields["自习日期"]).format("YYYY-MM-DD") ===
            dayjs(record["会议日期"]).format("YYYY-MM-DD"),
        )
      ) {
        console.log("会议日期已存在", record["会议日期"]);
      } else {
        console.log("会议日期不存在，正在上传", record["会议日期"]);

        const meetingStatisticRecord = {
          自习日期: record["会议日期"],
        };

        const meetingStatisticResult = await feishuAPI.addBitableRecord({
          appToken: meetingStatisticTableToken,
          tableId: meetingStatisticTableId,
          fields: meetingStatisticRecord,
        });
      }
    },
    (err: any) => {
      if (err) {
        console.error("上传数据时出错:", err);
      }
    },
  );
};

const uploadParticipantData = async ({
  records,
  feishuAPI,
  meetingId,
}: {
  records: any[];
  feishuAPI: Feishu;
  meetingId: string;
}) => {
  if (!participantTableToken || !participantTableId) {
    console.log(
      "请在环境变量配置PARTICIPANT_TABLE_TOKEN和PARTICIPANT_TABLE_ID",
    );
    process.exit(1);
  }

  if (!participantStatisticTableToken || !participantStatisticTableId) {
    console.log(
      "请在环境变量配置PARTICIPANT_STATISTIC_TABLE_TOKEN和PARTICIPANT_STATISTIC_TABLE_ID",
    );
    process.exit(1);
  }

  // 这里添加上传到飞书多维表格的逻辑
  // console.log("上传到飞书多维表格的参会人数据:", records);
  const tableFields = records[0];
  const meetingParticipantBitableData = await feishuAPI.getBitableData({
    tableToken: participantTableToken,
    tableId: participantTableId,
  });

  const participantStatisticBitableData = await feishuAPI.getBitableData({
    tableToken: participantStatisticTableToken,
    tableId: participantStatisticTableId,
  });

  await async.mapLimit(
    records.slice(1),
    10,
    async (values: any[]) => {
      console.log("上传参会人数据", meetingId, values[0]);
      const record = values.reduce((acc: any, field: any, index: any) => {
        acc[tableFields[index].trim()] = field;
        return acc;
      }, {});

      // 补充会议 ID，参会时长，日期
      record["会议 ID"] = meetingId;
      // 将参会时长转换为小时 00:20:36 -> 0.34 h
      const [hours, minutes, seconds] = record["参会时长"]
        .split(":")
        .map(Number);
      record["参会时长(h)"] = hours + minutes / 60 + seconds / 3600;
      record["日期"] = dayjs(
        dayjs(record["入会时间"]).format("YYYY-MM-DD"),
      ).valueOf();

      if (
        meetingParticipantBitableData.find(
          (item: any) =>
            item.fields["会议 ID"][0]["text"] === meetingId &&
            item.fields["参会者"][0]["text"] === values[0],
        )
      ) {
        console.log("参会人数据已存在", values[0]);
      } else {
        console.log("参会人数据不存在，正在上传", values[0]);

        const result = await feishuAPI.addBitableRecord({
          appToken: participantTableToken,
          tableId: participantTableId,
          fields: record,
        });
      }

      // 上传新增的参会人员
      if (
        participantStatisticBitableData.find(
          (item: any) => item.fields["名称"][0]["text"] === record["参会者"],
        )
      ) {
        console.log("参会人员已存在", record["参会者"]);
      } else {
        console.log("参会人员不存在，正在上传", record["参会者"]);
        const participantStatisticRecord = {
          名称: record["参会者"],
        };

        const participantStatisticResult = await feishuAPI.addBitableRecord({
          appToken: participantStatisticTableToken,
          tableId: participantStatisticTableId,
          fields: participantStatisticRecord,
        });
      }
    },
    (err: any) => {
      if (err) {
        console.error("上传数据时出错:", err);
      }
    },
  );
};

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

    const taskId = await feishuAPI.requestMeetingExport(startTime, endTime);
    console.log("请求会议导出");

    const fileToken = await feishuAPI.waitForExportCompletion(taskId);
    console.log("等待会议导出完成");

    await feishuAPI.downloadFile(fileToken, "meetingData");
    console.log("下载会议数据");

    const records: any[] = parseXLSX("meetingData");
    console.log("解析后的记录数:", records.length);

    await uploadMeetingData(records, feishuAPI);

    await async.mapLimit(records.slice(1), 1, async (values: any[]) => {
      const meetingStartTime = dayjs(values[11]).subtract(1, "day").unix();
      const meetingEndTime = dayjs(values[11]).unix();

      const meetingNo = values[0] as string;

      const participantListTaskId = await feishuAPI.getParticipantList({
        startTime: meetingStartTime,
        endTime: meetingEndTime,
        meetingNo,
      });

      console.log("获取参会人数据任务", participantListTaskId);
      const participantList = await feishuAPI.waitForExportCompletion(
        participantListTaskId,
      );
      // console.log("参会人数据", participantList);

      await feishuAPI.downloadFile(
        participantList,
        `participantList-${meetingNo}`,
      );

      const participantListRecords = parseXLSX(`participantList-${meetingNo}`);
      // console.log("参会人数据", participantListRecords);
      await uploadParticipantData({
        records: participantListRecords,
        feishuAPI,
        meetingId: meetingNo,
      });
    });
  } catch (error) {
    console.error("同步会议数据时出错:", error);
  }
};

syncMeetingData();
