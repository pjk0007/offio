"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MinusCircle, Plus, Trash2 } from "lucide-react";
import type { ExcludedRange } from "./types";

interface ExcludedRangesCardProps {
  excludedRanges: ExcludedRange[];
  editable?: boolean;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
}

export function ExcludedRangesCard({
  excludedRanges,
  editable = false,
  onAdd,
  onRemove,
}: ExcludedRangesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MinusCircle className="h-5 w-5 text-orange-500" />
          제외 시간
        </CardTitle>
        {editable && onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            추가
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {excludedRanges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            제외된 시간이 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {excludedRanges.map((range) => (
              <div
                key={range.id}
                className={`flex items-center ${editable ? "justify-between" : "gap-4"} p-3 rounded-lg border bg-muted/50`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {range.startTime} ~ {range.endTime}
                  </span>
                  <Badge variant="secondary">{range.reason}</Badge>
                </div>
                {editable && onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(range.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
