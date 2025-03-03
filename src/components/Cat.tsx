'use client';

import { FC } from 'react';

const Cat: FC = () => {
  return (
    <div className="relative left-1/2 top-1/2 h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2">
      {/* 身体 */}
      <div className="absolute bottom-0 right-0 h-[60%] w-[85%] rounded-[50%_10%_50%_40%/60%_5%_65%_50%] bg-[#222]"></div>

      {/* 头部 */}
      <div className="absolute right-0 top-[10%] h-[50%] w-[60%] rounded-[50%_50%_30%_30%/60%_60%_30%_30%] bg-[#222]">
        {/* 眼睛 */}
        <div className="absolute right-[15%] top-[45%] h-[5%] w-[50%]">
          <div className="absolute left-0 h-[10px] w-[10px] animate-[eye-move_3s_infinite] rounded-full bg-white"></div>
          <div className="absolute right-0 h-[10px] w-[10px] animate-[eye-move_3s_infinite] rounded-full bg-white"></div>
        </div>

        {/* 耳朵 */}
        <div className="absolute bottom-[90%] left-[15%] h-0 w-0 -rotate-[30deg] border-b-[10px] border-l-[7px] border-r-[7px] border-transparent border-b-[#222]"></div>
        <div className="absolute bottom-[85%] right-[5%] h-0 w-0 rotate-[30deg] border-b-[15px] border-l-[10px] border-r-[10px] border-transparent border-b-[#222]"></div>
      </div>

      {/* 尾巴 */}
      <div className="absolute bottom-0 right-[35%] h-[18%] w-[50%] rounded-[50%/250%] bg-[#222]">
        <div className="absolute right-[90%] h-full w-[25px] origin-right animate-[tail_2s_infinite] rounded-l-[50%] bg-[#222]">
          <div className="absolute right-[26%] h-full w-[25px] origin-right animate-[tail_2s_infinite] rounded-l-[50%] bg-[#222]">
            <div className="absolute right-[26%] h-full w-[25px] origin-right animate-[tail_2s_infinite] rounded-l-[50%] bg-[#222]">
              <div className="absolute right-[26%] h-full w-[25px] origin-right animate-[tail_2s_infinite] rounded-l-[50%] bg-[#222]">
                <div className="absolute right-[26%] h-full w-[25px] origin-right animate-[tail_2s_infinite] rounded-l-[50%] bg-[#222]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cat;
