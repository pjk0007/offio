"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimelineSlot, ExcludedRange } from "./types";

interface TimelineTabProps {
  timeline: TimelineSlot[];
  excludedRanges?: ExcludedRange[];
  editable?: boolean;
}

export function TimelineTab({ timeline, excludedRanges = [], editable = false }: TimelineTabProps) {
  // editable 모드에서는 excludedRanges를 사용하여 제외 표시
  const isExcluded = (hour: number): ExcludedRange | undefined => {
    if (!editable) return undefined;
    return excludedRanges.find((range) => {
      const [startH] = range.startTime.split(":").map(Number);
      const [endH] = range.endTime.split(":").map(Number);
      return hour >= startH && hour < endH;
    });
  };

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>시간대별 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">타임라인 데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>시간대별 활동</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 타임라인 바 */}
        <div className="mb-6">
          <div className="flex text-xs text-muted-foreground mb-1">
            {timeline.map((slot) => (
              <span key={slot.hour} className="flex-1 text-center">
                {slot.hour}
              </span>
            ))}
          </div>
          <div className="flex h-8 rounded overflow-hidden">
            {timeline.map((slot) => {
              const excluded = editable ? isExcluded(slot.hour) : slot.excluded;
              return (
                <div
                  key={slot.hour}
                  className={`flex-1 ${
                    excluded
                      ? editable
                        ? "bg-orange-200"
                        : "bg-muted"
                      : slot.activeMinutes > 50
                      ? "bg-primary"
                      : slot.activeMinutes > 30
                      ? "bg-primary/70"
                      : slot.activeMinutes > 0
                      ? "bg-primary/40"
                      : "bg-muted"
                  }`}
                  title={
                    excluded
                      ? editable
                        ? `제외: ${(excluded as ExcludedRange).reason}`
                        : slot.excludeReason || "제외됨"
                      : `${slot.activeMinutes}분 활동`
                  }
                />
              );
            })}
          </div>
        </div>

        {/* 상세 */}
        <div className="space-y-2">
          {timeline.map((slot) => {
            const excludedRange = editable ? isExcluded(slot.hour) : null;
            const isSlotExcluded = editable ? !!excludedRange : slot.excluded;
            const excludeReason = editable
              ? excludedRange?.reason
              : slot.excludeReason;

            return (
              <div
                key={slot.hour}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isSlotExcluded
                    ? editable
                      ? "bg-orange-50 border-orange-200"
                      : "bg-muted/50"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium w-20">
                    {slot.hour}:00~{slot.hour + 1}:00
                  </span>
                  {isSlotExcluded ? (
                    editable ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        제외: {excludeReason}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {excludeReason || "제외됨"}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      활동: {slot.activeMinutes}분
                    </span>
                  )}
                </div>
                {!isSlotExcluded && slot.programs.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {slot.programs.map((p) => p.name).join(", ")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
