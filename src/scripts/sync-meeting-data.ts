/**
 * 同步会议数据
 * 1. 获取会议数据
 * 2. 获取参会人数据
 * 3. 上传会议数据
 * 4. 上传参会人数据
 */

import fs from "fs";
import dayjs from "dayjs";
import xlsx from "xlsx";
import Feishu from "@/lib/feishu";
import async from "async";
import { config, validateConfig } from "@/lib/config";

interface MeetingRecord {
  fields: Record<string, any>;
  id: string;
  record_id: string;
  "会议 ID": string;
  会议开始时间: string;
  参会人数: number;
  累计入会设备数: number;
}

interface ParticipantRecord {
  参会者: string;
  入会时间: string;
  参会时长: string;
  "会议 ID": string;
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

const processParticipantRecord = (record: ParticipantRecord) => {
  const [hours, minutes, seconds] = record["参会时长"].split(":").map(Number);
  return {
    ...record,
    "参会时长(h)": +(hours + minutes / 60 + seconds / 3600).toFixed(2),
    日期: dayjs(dayjs(record["入会时间"]).format("YYYY-MM-DD")).valueOf(),
  };
};

const uploadMeetingData = async (records: any[], feishuAPI: Feishu) => {
  const tableFields = records[0];
  const { meeting: meetingTable, meetingStatistic } = config.tables;

  const meetingBitableData = await feishuAPI.getBitableData({
    tableToken: meetingTable.token,
    tableId: meetingTable.id,
    body: {
      sort: [
        {
          field_name: "会议日期",
          desc: true,
        },
      ],
    },
  });

  await async.mapLimit(records.slice(1), 1, async (values: any[]) => {
    try {
      const record = values.reduce((acc, field, index) => {
        const fieldName = tableFields[index].trim();
        const value = ["参会人数", "累计入会设备数"].includes(fieldName)
          ? Number(field)
          : field;
        return { ...acc, [fieldName]: value };
      }, {});

      record["会议日期"] = dayjs(
        dayjs(record["会议开始时间"]).format("YYYY-MM-DD"),
      ).valueOf();

      // 检查会议是否已存在
      const existingMeeting = meetingBitableData.find(
        (item: MeetingRecord) =>
          item.fields["会议 ID"][0].text === record["会议 ID"],
      );

      if (!existingMeeting) {
        console.log("上传新会议数据:", record["会议 ID"]);
        const filteredRecord = Object.fromEntries(
          Object.entries(record).filter(([key]) =>
            availableMeetingFields.includes(key),
          ),
        );
        await feishuAPI.addBitableRecord({
          appToken: meetingTable.token,
          tableId: meetingTable.id,
          fields: filteredRecord,
        });
      } else {
        console.log("会议日期已存在", record["会议日期"]);
      }

      // 检查会议统计是否已存在
      const meetingStatisticBitableData = await feishuAPI.getBitableData({
        tableToken: meetingStatistic.token,
        tableId: meetingStatistic.id,
      });

      if (
        meetingStatisticBitableData.find(
          (item: any) =>
            dayjs(item.fields["自习日期"]).format("YYYY-MM-DD") ===
            dayjs(record["会议日期"]).format("YYYY-MM-DD"),
        )
      ) {
        console.log("会议统计日期已存在", record["会议日期"]);
      } else {
        console.log("会议统计日期不存在，正在上传", record["会议日期"]);

        const meetingStatisticRecord = {
          自习日期: record["会议日期"],
        };

        await feishuAPI.addBitableRecord({
          appToken: meetingStatistic.token,
          tableId: meetingStatistic.id,
          fields: meetingStatisticRecord,
        });
      }
    } catch (error) {
      console.error("处理会议记录时出错:", error);
      throw error;
    }
  });
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
  const { participant: participantTable, participantStatistic } = config.tables;

  const tableFields = records[0];
  const meetingParticipantBitableData = await feishuAPI.getBitableData({
    tableToken: participantTable.token,
    tableId: participantTable.id,
    body: {
      sort: [
        {
          field_name: "日期",
          desc: true,
        },
      ],
    },
  });

  const participantStatisticBitableData = await feishuAPI.getBitableData({
    tableToken: participantStatistic.token,
    tableId: participantStatistic.id,
  });
  await async.mapLimit(
    records.slice(1),
    10,
    async (values: any[]) => {
      console.log("上传参会人数据", meetingId, values[0]);
      const baseRecord = values.reduce((acc: any, field: any, index: any) => {
        acc[tableFields[index].trim()] = field;
        return acc;
      }, {});

      baseRecord["会议 ID"] = meetingId;

      const record = processParticipantRecord(baseRecord);

      // 上传会议参会人数据
      if (
        meetingParticipantBitableData.find(
          (item: any) =>
            item.fields["会议 ID"][0]["text"] === meetingId &&
            item.fields["参会者"][0]["text"] === values[0],
        )
      ) {
        console.log("参会人数据已存在", values[0]);
      } else {
        console.log("参会人数据不存在，正在上传", values[0], meetingId);

        feishuAPI.addBitableRecord({
          appToken: participantTable.token,
          tableId: participantTable.id,
          fields: record,
        });
      }

      // 上传参会人员统计数据
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

        await feishuAPI.addBitableRecord({
          appToken: participantStatistic.token,
          tableId: participantStatistic.id,
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
  console.log("开始同步会议数据");

  try {
    // 验证配置
    validateConfig();

    const feishuAPI = new Feishu(config.feishu);
    await feishuAPI.initAccessToken();

    const { startTime, endTime } = getTimeRange();
    console.log(
      "获取时间范围:",
      dayjs(startTime * 1000).format("YYYY-MM-DD HH:mm:ss"),
      "至",
      dayjs(endTime * 1000).format("YYYY-MM-DD HH:mm:ss"),
    );

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

      const participantListTaskId = await feishuAPI.requestParticipantExport({
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
    console.error("同步会议数据失败:", error);
    process.exit(1);
  }
};

syncMeetingData();

/**
 * 可用的会议记录字段列表:
 * ⚠️: 如果上传文档的字段与飞书多维表格的字段不一致，会导致上传失败
 */
const availableMeetingFields = [
  "会议 ID",
  "外部会议",
  "会议主题",
  "会议类型",
  "组织者",
  "组织者部门",
  "用户ID",
  "工号",
  "邮箱",
  "手机",
  "会议开始时间",
  "会议结束时间",
  "会议时长",
  "参会人数",
  "累计入会设备数",
  "音频",
  "视频",
  "共享",
  "录制",
  "电话",
  "会议日期",
];
