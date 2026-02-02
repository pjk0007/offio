// 시간 간격 라벨
export const INTERVAL_LABELS: Record<string, string> = {
  "1": "1분",
  "5": "5분",
  "10": "10분",
  "30": "30분",
  "60": "1시간",
};

// 프로그램별 컬러
export const PROGRAM_COLORS: Record<string, string> = {
  "VS Code": "bg-blue-500",
  Chrome: "bg-yellow-500",
  Slack: "bg-purple-500",
  Figma: "bg-pink-500",
  Terminal: "bg-gray-500",
  Notion: "bg-orange-500",
};

// 기본 프로그램 컬러
export const DEFAULT_PROGRAM_COLOR = "bg-gray-400";

// 그래프 컬러
export const GRAPH_COLORS = {
  keyboard: "hsl(217, 91%, 60%)",
  mouse: "hsl(142, 71%, 45%)",
  total: "hsl(270, 70%, 50%)",
};
