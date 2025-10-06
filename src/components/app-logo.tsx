import React from 'react';

/**
 * 科技感智能仪表盘Logo组件
 * 融入数字化元素和现代化设计，体现智能化和数据分析特点
 */
function TechDashboardIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 定义渐变色 */}
      <defs>
        <linearGradient id="techBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
        <linearGradient id="techSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="50%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#6B7280" />
        </linearGradient>
        <linearGradient id="techAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A21CAF" />
          <stop offset="100%" stopColor="#C026D3" />
        </linearGradient>
      </defs>
      
      {/* 外圆环 - 仪表盘边框 */}
      <circle 
        cx="16" 
        cy="16" 
        r="14" 
        stroke="url(#techBlue)" 
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      
      {/* 内圆环 - 数据环 */}
      <circle 
        cx="16" 
        cy="16" 
        r="11" 
        stroke="url(#techSilver)" 
        strokeWidth="1.5"
        fill="rgba(109, 40, 217, 0.06)"
        strokeDasharray="4 2"
        opacity="0.6"
      />
      
      {/* 中心数据核心 */}
      <circle 
        cx="16" 
        cy="16" 
        r="6" 
        fill="url(#techBlue)"
        opacity="0.15"
      />
      
      {/* 数据指针/指示器 */}
      <path 
        d="M16 10 L18 16 L16 22 L14 16 Z" 
        fill="url(#techAccent)"
        opacity="0.8"
      />
      
      {/* 数字化刻度线 */}
      <g stroke="url(#techBlue)" strokeWidth="1.5" opacity="0.7">
        {/* 12点位置 */}
        <line x1="16" y1="4" x2="16" y2="7" />
        {/* 3点位置 */}
        <line x1="28" y1="16" x2="25" y2="16" />
        {/* 6点位置 */}
        <line x1="16" y1="28" x2="16" y2="25" />
        {/* 9点位置 */}
        <line x1="4" y1="16" x2="7" y2="16" />
      </g>
      
      {/* 数据点 - 智能化元素 */}
      <g fill="url(#techAccent)" opacity="0.9">
        <circle cx="22" cy="10" r="1.5" />
        <circle cx="22" cy="22" r="1.5" />
        <circle cx="10" cy="22" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
      </g>
      
      {/* 中心智能芯片图标 */}
      <rect 
        x="13" 
        y="13" 
        width="6" 
        height="6" 
        rx="1"
        fill="none"
        stroke="url(#techAccent)"
        strokeWidth="1"
        opacity="0.8"
      />
      
      {/* 芯片内部电路线 */}
      <g stroke="url(#techAccent)" strokeWidth="0.5" opacity="0.6">
        <line x1="14" y1="15" x2="18" y2="15" />
        <line x1="14" y1="17" x2="18" y2="17" />
        <line x1="15" y1="14" x2="15" y2="18" />
        <line x1="17" y1="14" x2="17" y2="18" />
      </g>
      
      {/* 外围数据流动效果 */}
      <g stroke="url(#techSilver)" strokeWidth="0.8" opacity="0.4" fill="none">
        <path d="M8 8 Q12 6 16 8 Q20 6 24 8" strokeDasharray="2 1" />
        <path d="M8 24 Q12 26 16 24 Q20 26 24 24" strokeDasharray="2 1" />
      </g>
    </svg>
  );
}

export function AppLogo() {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-lg">
        <TechDashboardIcon className="w-6 h-6 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900 tracking-wide">
          AUTINSIGHT
        </span>
        <span className="text-xs text-gray-600 font-medium">
          车险智能仪表盘
        </span>
      </div>
    </div>
  );
}
