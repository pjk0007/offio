import type { ActivityData, TimeInterval } from "./types";

// 시간 포맷팅 (초 -> X시간 Y분)
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}시간 ${minutes}분`;
}

// 평균 활성도 계산
export function calculateAverageActivity(
  activityData: ActivityData[],
  field: "keyboardActiveSeconds" | "mouseActiveSeconds" | "totalActiveSeconds"
): number {
  if (activityData.length === 0) return 0;

  const filtered = activityData.filter((d) => d[field] > 0);
  if (filtered.length === 0) return 0;

  const sum = filtered.reduce((acc, d) => acc + d[field], 0);
  return Math.round((sum / filtered.length / 60) * 100);
}

// 시간 단위에 따라 활동 데이터 집계
export function aggregateActivityData(
  activityData: ActivityData[],
  timeInterval: TimeInterval
): ActivityData[] {
  const interval = parseInt(timeInterval);
  if (interval === 1) return activityData;

  const result: ActivityData[] = [];
  for (let i = 0; i < activityData.length; i += interval) {
    const chunk = activityData.slice(i, Math.min(i + interval, activityData.length));
    if (chunk.length === 0) continue;

    const firstItem = chunk[0];
    const aggregated: ActivityData = {
      id: firstItem.id,
      time: firstItem.time,
      hour: firstItem.hour,
      minute: firstItem.minute,
      keyboardCount: chunk.reduce((sum, d) => sum + d.keyboardCount, 0),
      mouseClickCount: chunk.reduce((sum, d) => sum + d.mouseClickCount, 0),
      mouseDistance: chunk.reduce((sum, d) => sum + d.mouseDistance, 0),
      keyboardActiveSeconds: Math.round(
        chunk.reduce((sum, d) => sum + d.keyboardActiveSeconds, 0) / chunk.length
      ),
      mouseActiveSeconds: Math.round(
        chunk.reduce((sum, d) => sum + d.mouseActiveSeconds, 0) / chunk.length
      ),
      totalActiveSeconds: Math.round(
        chunk.reduce((sum, d) => sum + d.totalActiveSeconds, 0) / chunk.length
      ),
    };
    result.push(aggregated);
  }
  return result;
}

// 총 입력 횟수 계산
export function calculateTotalInputCount(activityData: ActivityData[]): number {
  return activityData.reduce((acc, d) => acc + d.keyboardCount + d.mouseClickCount, 0);
}
