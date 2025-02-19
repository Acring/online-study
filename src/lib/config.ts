import dotenv from "dotenv";

// 检查是否在 Next.js 环境中
const isNextJs = process.env.NEXT_RUNTIME !== undefined;

// 只在非 Next.js 环境下加载 .env 文件
if (!isNextJs) {
  dotenv.config();
}

interface Config {
  feishu: {
    appId: string;
    appSecret: string;
  };
  tables: Record<string, { token: string; id: string }>;
}

export const config: Config = {
  feishu: {
    appId: process.env.APP_ID ?? "",
    appSecret: process.env.APP_SECRET ?? "",
  },
  tables: {
    meeting: {
      token: process.env.TABLE_TOKEN ?? "",
      id: process.env.TABLE_ID ?? "",
    },
    participant: {
      token: process.env.PARTICIPANT_TABLE_TOKEN ?? "",
      id: process.env.PARTICIPANT_TABLE_ID ?? "",
    },
    meetingStatistic: {
      token: process.env.MEETING_STATISTIC_TABLE_TOKEN ?? "",
      id: process.env.MEETING_STATISTIC_TABLE_ID ?? "",
    },
    participantStatistic: {
      token: process.env.PARTICIPANT_STATISTIC_TABLE_TOKEN ?? "",
      id: process.env.PARTICIPANT_STATISTIC_TABLE_ID ?? "",
    },
  },
};

export const validateConfig = () => {
  const { feishu, tables } = config;

  if (!feishu.appId || !feishu.appSecret) {
    throw new Error("请在环境变量配置APP_ID和APP_SECRET");
  }

  Object.entries(tables).forEach(([tableName, table]) => {
    if (!table.token || !table.id) {
      throw new Error(`请在环境变量配置${tableName}相关的TOKEN和ID`);
    }
  });
};
