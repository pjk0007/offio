"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Keyboard, Mouse } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import type { ActivityData, TimeInterval } from "./types";
import { aggregateActivityData } from "./utils";
import { INTERVAL_LABELS, GRAPH_COLORS } from "./constants";

interface ActivityGraphsProps {
  activityData: ActivityData[];
  timeInterval: TimeInterval;
  onTimeIntervalChange: (value: TimeInterval) => void;
}

export function ActivityGraphs({
  activityData,
  timeInterval,
  onTimeIntervalChange,
}: ActivityGraphsProps) {
  const aggregatedData = aggregateActivityData(activityData, timeInterval);
  const xAxisInterval = Math.max(1, Math.floor(aggregatedData.length / 10));

  const TimeIntervalSelect = () => (
    <Select value={timeInterval} onValueChange={(v) => onTimeIntervalChange(v as TimeInterval)}>
      <SelectTrigger className="w-25">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">1분 단위</SelectItem>
        <SelectItem value="5">5분 단위</SelectItem>
        <SelectItem value="10">10분 단위</SelectItem>
        <SelectItem value="30">30분 단위</SelectItem>
        <SelectItem value="60">1시간 단위</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      {/* 통합 활성도 그래프 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            통합 활성도
          </CardTitle>
          <TimeIntervalSelect />
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={aggregatedData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={xAxisInterval}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ActivityData;
                      const activityPercent = Math.round((data.totalActiveSeconds / 60) * 100);
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="font-medium">
                            {label} ({INTERVAL_LABELS[timeInterval]})
                          </p>
                          <p className="text-sm text-purple-500">
                            통합 활성도: {activityPercent}% ({data.totalActiveSeconds}초/60초)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={(d: ActivityData) => Math.round((d.totalActiveSeconds / 60) * 100)}
                  stroke={GRAPH_COLORS.total}
                  fill={GRAPH_COLORS.total}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 키보드 활성도 그래프 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-blue-500" />
            키보드 활성도
          </CardTitle>
          <TimeIntervalSelect />
        </CardHeader>
        <CardContent>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aggregatedData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={xAxisInterval}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ActivityData;
                      const activityPercent = Math.round((data.keyboardActiveSeconds / 60) * 100);
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="font-medium">
                            {label} ({INTERVAL_LABELS[timeInterval]})
                          </p>
                          <p className="text-sm text-blue-500">
                            키보드 활성도: {activityPercent}% ({data.keyboardActiveSeconds}초/60초)
                          </p>
                          <p className="text-sm text-muted-foreground">
                            입력: {data.keyboardCount}회
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={(d: ActivityData) => Math.round((d.keyboardActiveSeconds / 60) * 100)}
                  fill={GRAPH_COLORS.keyboard}
                  radius={[1, 1, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 마우스 활성도 그래프 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mouse className="h-5 w-5 text-green-500" />
            마우스 활성도
          </CardTitle>
          <TimeIntervalSelect />
        </CardHeader>
        <CardContent>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aggregatedData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={xAxisInterval}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ActivityData;
                      const activityPercent = Math.round((data.mouseActiveSeconds / 60) * 100);
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="font-medium">
                            {label} ({INTERVAL_LABELS[timeInterval]})
                          </p>
                          <p className="text-sm text-green-500">
                            마우스 활성도: {activityPercent}% ({data.mouseActiveSeconds}초/60초)
                          </p>
                          <p className="text-sm text-muted-foreground">
                            클릭: {data.mouseClickCount}회
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={(d: ActivityData) => Math.round((d.mouseActiveSeconds / 60) * 100)}
                  fill={GRAPH_COLORS.mouse}
                  radius={[1, 1, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 키보드/마우스 입력 횟수 그래프 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>키보드/마우스 입력 횟수</CardTitle>
          <TimeIntervalSelect />
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={aggregatedData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={xAxisInterval}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ActivityData;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="font-medium">
                            {label} ({INTERVAL_LABELS[timeInterval]})
                          </p>
                          <p className="text-sm text-blue-500">키보드: {data.keyboardCount}회</p>
                          <p className="text-sm text-green-500">마우스: {data.mouseClickCount}회</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="keyboardCount"
                  stroke={GRAPH_COLORS.keyboard}
                  strokeWidth={1.5}
                  dot={false}
                  name="키보드"
                />
                <Line
                  type="monotone"
                  dataKey="mouseClickCount"
                  stroke={GRAPH_COLORS.mouse}
                  strokeWidth={1.5}
                  dot={false}
                  name="마우스"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500" />
              <span>키보드</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500" />
              <span>마우스</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
