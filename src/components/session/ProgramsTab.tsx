"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgramUsage, TimelineSlot } from "./types";
import { PROGRAM_COLORS, DEFAULT_PROGRAM_COLOR } from "./constants";

interface ProgramsTabProps {
  programUsage: ProgramUsage[];
  timeline?: TimelineSlot[];
  detailed?: boolean;
}

export function ProgramsTab({ programUsage, timeline = [], detailed = false }: ProgramsTabProps) {
  const totalMinutes = programUsage.reduce((sum, p) => sum + p.minutes, 0);

  const getPercentage = (minutes: number) =>
    totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;

  const getColor = (name: string) => PROGRAM_COLORS[name] || DEFAULT_PROGRAM_COLOR;

  if (programUsage.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>프로그램 사용량</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">프로그램 사용 기록이 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  // 간단한 버전 (근무자용)
  if (!detailed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>프로그램 사용량</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programUsage.map((program) => {
              const percentage = getPercentage(program.minutes);
              return (
                <div key={program.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{program.name}</span>
                    <span className="text-muted-foreground">
                      {Math.floor(program.minutes / 60)}시간 {program.minutes % 60}분 ({percentage}
                      %)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${getColor(program.name)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 상세 버전 (관리자용)
  return (
    <div className="space-y-4">
      {/* 프로그램 사용량 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>프로그램 사용 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programUsage.map((program) => {
              const percentage = getPercentage(program.minutes);
              const color = getColor(program.name);
              return (
                <div key={program.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${color}`} />
                      <span className="font-medium">{program.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.floor(program.minutes / 60)}시간 {program.minutes % 60}분 ({percentage}
                      %)
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 시간대별 프로그램 사용 */}
      <Card>
        <CardHeader>
          <CardTitle>시간대별 프로그램 사용</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">타임라인 데이터가 없습니다</p>
          ) : (
            <>
              <div className="space-y-2">
                {timeline
                  .filter((slot) => !slot.excluded)
                  .map((slot) => (
                    <div key={slot.hour} className="flex items-center gap-4 p-3 rounded-lg border">
                      <span className="font-medium w-24 text-sm">
                        {slot.hour}:00 ~ {slot.hour + 1}:00
                      </span>
                      <div className="flex-1 flex gap-1">
                        {slot.programs.map((program, idx) => {
                          const width = Math.round((program.minutes / 60) * 100);
                          return (
                            <div
                              key={idx}
                              className={`h-6 ${getColor(program.name)} rounded text-xs text-white flex items-center justify-center`}
                              style={{ width: `${width}%` }}
                              title={`${program.name}: ${program.minutes}분`}
                            >
                              {width > 15 && program.name}
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {slot.activeMinutes}분
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                {Array.from(new Set(programUsage.map((p) => p.name)))
                  .slice(0, 6)
                  .map((name) => (
                    <div key={name} className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded ${getColor(name)}`} />
                      <span>{name}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
