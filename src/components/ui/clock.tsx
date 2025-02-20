'use client';

import { useEffect, useState } from 'react';

export function Clock() {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    // 每秒更新一次时间
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // 清理定时器
    return () => clearInterval(timer);
  }, []);

  // 格式化时间，确保个位数时分秒前面加0
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="text-5xl font-bold">
      {hours}:{minutes}:{seconds}
    </div>
  );
}
