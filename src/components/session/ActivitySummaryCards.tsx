"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Keyboard, Mouse, Activity, BarChart3 } from "lucide-react";
import type { ActivityData } from "./types";
import { calculateAverageActivity, calculateTotalInputCount } from "./utils";

interface ActivitySummaryCardsProps {
  activityData: ActivityData[];
}

export function ActivitySummaryCards({ activityData }: ActivitySummaryCardsProps) {
  const avgKeyboardActivity = calculateAverageActivity(activityData, "keyboardActiveSeconds");
  const avgMouseActivity = calculateAverageActivity(activityData, "mouseActiveSeconds");
  const avgTotalActivity = calculateAverageActivity(activityData, "totalActiveSeconds");
  const totalInputCount = calculateTotalInputCount(activityData);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">키보드 활성도</span>
          </div>
          <p className="text-2xl font-bold mt-1">{avgKeyboardActivity}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Mouse className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">마우스 활성도</span>
          </div>
          <p className="text-2xl font-bold mt-1">{avgMouseActivity}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-muted-foreground">통합 활성도</span>
          </div>
          <p className="text-2xl font-bold mt-1">{avgTotalActivity}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-muted-foreground">총 입력</span>
          </div>
          <p className="text-2xl font-bold mt-1">{totalInputCount.toLocaleString()}회</p>
        </CardContent>
      </Card>
    </div>
  );
}
