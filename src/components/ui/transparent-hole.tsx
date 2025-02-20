'use client';

import { useEffect, useRef } from 'react';

interface TransparentHoleProps {
  className?: string;
  holeWidth?: number | string;
  holeHeight?: number | string;
  cornerRadius?: number;
}

export const TransparentHole = ({
  className = '',
  holeWidth = 400,
  holeHeight = 300,
  cornerRadius = 16,
}: TransparentHoleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置 canvas 尺寸为父容器尺寸
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      draw();
    };

    const draw = () => {
      if (!ctx || !canvas) return;

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 创建斜向渐变
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height * 1.5);

      // 使用接近白色的渐变
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      gradient.addColorStop(0.5, 'rgba(252, 252, 252, 0.95)');
      gradient.addColorStop(1, 'rgba(250, 250, 250, 0.95)');

      // 使用渐变填充背景
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 计算实际的宽高值
      const calculateDimension = (value: number | string, totalSize: number) => {
        if (typeof value === 'string' && value.endsWith('%')) {
          return (parseFloat(value) / 100) * totalSize;
        }
        return typeof value === 'number' ? value : parseFloat(value);
      };

      const actualWidth = calculateDimension(holeWidth, canvas.width);
      const actualHeight = calculateDimension(holeHeight, canvas.height);

      // 计算镂空区域的位置（居中）
      const x = (canvas.width - actualWidth) / 2;
      const y = (canvas.height - actualHeight) / 2;

      // 绘制圆角矩形镂空
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + actualWidth - cornerRadius, y);
      ctx.quadraticCurveTo(x + actualWidth, y, x + actualWidth, y + cornerRadius);
      ctx.lineTo(x + actualWidth, y + actualHeight - cornerRadius);
      ctx.quadraticCurveTo(
        x + actualWidth,
        y + actualHeight,
        x + actualWidth - cornerRadius,
        y + actualHeight
      );
      ctx.lineTo(x + cornerRadius, y + actualHeight);
      ctx.quadraticCurveTo(x, y + actualHeight, x, y + actualHeight - cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
      ctx.closePath();

      // 使用 destination-out 混合模式创建透明效果
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    };

    // 初始化尺寸
    resizeCanvas();

    // 监听窗口大小变化
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [holeWidth, holeHeight, cornerRadius]);

  return <canvas ref={canvasRef} className={`absolute inset-0 ${className}`} />;
};
