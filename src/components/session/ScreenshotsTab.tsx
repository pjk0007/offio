"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import type { Screenshot } from "./types";

interface ScreenshotsTabProps {
  screenshots: Screenshot[];
  editable?: boolean;
  selectedScreenshots?: Set<string>;
  onToggleScreenshot?: (id: string) => void;
  onSelectAll?: () => void;
  onDeleteSelected?: () => void;
  onRestoreScreenshot?: (id: string) => void;
}

export function ScreenshotsTab({
  screenshots,
  editable = false,
  selectedScreenshots = new Set(),
  onToggleScreenshot,
  onSelectAll,
  onDeleteSelected,
  onRestoreScreenshot,
}: ScreenshotsTabProps) {
  const deletedCount = screenshots.filter((s) => s.isDeleted).length;
  const nonDeletedCount = screenshots.filter((s) => !s.isDeleted).length;

  if (screenshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>스크린샷</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">스크린샷이 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>스크린샷</CardTitle>
        {editable && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSelectAll}>
              {selectedScreenshots.size === nonDeletedCount ? "전체 해제" : "전체 선택"}
            </Button>
            {selectedScreenshots.size > 0 && (
              <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-1" />
                {selectedScreenshots.size}개 삭제
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {screenshots.map((screenshot) => (
            <div
              key={screenshot.id}
              className={`aspect-video rounded-lg border relative ${
                editable ? "group cursor-pointer" : ""
              } ${
                screenshot.isDeleted
                  ? "bg-muted opacity-50"
                  : editable && selectedScreenshots.has(screenshot.id)
                  ? "ring-2 ring-primary bg-muted"
                  : editable
                  ? "bg-muted hover:ring-2 hover:ring-muted-foreground/20"
                  : "bg-muted"
              } flex items-center justify-center`}
              onClick={() => {
                if (editable && !screenshot.isDeleted && onToggleScreenshot) {
                  onToggleScreenshot(screenshot.id);
                }
              }}
            >
              {editable && !screenshot.isDeleted && (
                <div className="absolute top-1 left-1 z-10">
                  <Checkbox
                    checked={selectedScreenshots.has(screenshot.id)}
                    onCheckedChange={() => onToggleScreenshot?.(screenshot.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="flex items-center justify-center h-full">
                {screenshot.isDeleted ? (
                  editable ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground">삭제됨</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreScreenshot?.(screenshot.id);
                        }}
                      >
                        복원
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">삭제됨</span>
                  )
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <span className="absolute bottom-1 left-1 text-xs bg-background/80 px-1 rounded">
                {screenshot.time}
              </span>
            </div>
          ))}
        </div>
        {deletedCount > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {deletedCount}개의 스크린샷이 삭제되었습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
