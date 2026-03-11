"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { generateTimeSlots, formatTime } from "@/lib/slots";
import { getHeatmapColor, getHeatmapTextColor } from "@/lib/colors";

interface EventDate {
  id: string;
  date: string;
}

interface ParticipantResponse {
  eventDateId: string;
  startTime: string;
}

interface Participant {
  id: string;
  name: string;
  responses: ParticipantResponse[];
}

interface AvailabilityGridProps {
  dates: EventDate[];
  participants: Participant[];
  mode: string;
  timeRangeStart: string;
  timeRangeEnd: string;
  slotDuration: number;
  isEditing: boolean;
  selectedSlots: Set<string>;
  onSlotsChange: (slots: Set<string>) => void;
  highlightedParticipant: string | null;
}

export default function AvailabilityGrid({
  dates,
  participants,
  mode,
  timeRangeStart,
  timeRangeEnd,
  slotDuration,
  isEditing,
  selectedSlots,
  onSlotsChange,
  highlightedParticipant,
}: AvailabilityGridProps) {
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<"add" | "remove">("add");
  const dragStartRef = useRef<{ col: number; row: number } | null>(null);
  const dragCurrentRef = useRef<{ col: number; row: number } | null>(null);
  const [, forceUpdate] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const gridRef = useRef<HTMLDivElement>(null);

  const timeSlots = useMemo(() => {
    if (mode === "DATE_ONLY") return [{ start: "00:00", end: "23:59" }];
    return generateTimeSlots(timeRangeStart, timeRangeEnd, slotDuration);
  }, [mode, timeRangeStart, timeRangeEnd, slotDuration]);

  const heatmapData = useMemo(() => {
    const map = new Map<string, string[]>();
    const filteredParticipants = highlightedParticipant
      ? participants.filter((p) => p.id === highlightedParticipant)
      : participants;

    for (const p of filteredParticipants) {
      for (const r of p.responses) {
        const key = `${r.eventDateId}-${r.startTime}`;
        const existing = map.get(key) || [];
        existing.push(p.name);
        map.set(key, existing);
      }
    }
    return map;
  }, [participants, highlightedParticipant]);

  const maxCount = useMemo(() => {
    if (highlightedParticipant) return 1;
    return participants.length;
  }, [participants.length, highlightedParticipant]);

  const getCellKey = (dateId: string, startTime: string) =>
    `${dateId}-${startTime}`;

  const getDragRange = useCallback(() => {
    if (!dragStartRef.current || !dragCurrentRef.current)
      return new Set<string>();
    const minCol = Math.min(
      dragStartRef.current.col,
      dragCurrentRef.current.col
    );
    const maxCol = Math.max(
      dragStartRef.current.col,
      dragCurrentRef.current.col
    );
    const minRow = Math.min(
      dragStartRef.current.row,
      dragCurrentRef.current.row
    );
    const maxRow = Math.max(
      dragStartRef.current.row,
      dragCurrentRef.current.row
    );

    const keys = new Set<string>();
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        if (c < dates.length && r < timeSlots.length) {
          keys.add(getCellKey(dates[c].id, timeSlots[r].start));
        }
      }
    }
    return keys;
  }, [dates, timeSlots]);

  const handlePointerDown = (col: number, row: number) => {
    if (!isEditing) return;
    const key = getCellKey(dates[col].id, timeSlots[row].start);
    dragModeRef.current = selectedSlots.has(key) ? "remove" : "add";
    isDraggingRef.current = true;
    dragStartRef.current = { col, row };
    dragCurrentRef.current = { col, row };
    forceUpdate((n) => n + 1);
  };

  const handlePointerMove = (col: number, row: number) => {
    if (!isDraggingRef.current || !isEditing) return;
    dragCurrentRef.current = { col, row };
    forceUpdate((n) => n + 1);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current || !isEditing) return;
    const range = getDragRange();
    const newSlots = new Set(selectedSlots);

    range.forEach((key) => {
      if (dragModeRef.current === "add") {
        newSlots.add(key);
      } else {
        newSlots.delete(key);
      }
    });

    onSlotsChange(newSlots);
    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragCurrentRef.current = null;
    forceUpdate((n) => n + 1);
  };

  const dragRange = isDraggingRef.current ? getDragRange() : new Set<string>();

  const isCellInDragPreview = (key: string) => {
    if (!isDraggingRef.current) return false;
    return dragRange.has(key);
  };

  const getCellStyle = (dateId: string, startTime: string) => {
    const key = getCellKey(dateId, startTime);
    const names = heatmapData.get(key) || [];
    const othersCount = names.length;

    if (isEditing) {
      const inDrag = isCellInDragPreview(key);
      const isSelected = selectedSlots.has(key);

      // Show others' heatmap as faint background in edit mode
      const othersOpacity = maxCount > 0 && othersCount > 0
        ? 0.08 + (othersCount / maxCount) * 0.15
        : 0;
      const bgBase = othersOpacity > 0
        ? `hsl(142, 50%, ${85 - (othersCount / maxCount) * 20}%)`
        : "hsl(0, 0%, 97%)";

      if (inDrag) {
        return {
          backgroundColor:
            dragModeRef.current === "add" ? "hsl(217, 80%, 75%)" : "hsl(0, 70%, 90%)",
          cursor: "pointer",
        };
      }
      if (isSelected) {
        return {
          backgroundColor: "hsl(217, 80%, 56%)",
          color: "white",
          cursor: "pointer",
        };
      }
      return {
        backgroundColor: bgBase,
        cursor: "pointer",
      };
    }

    return {
      backgroundColor: getHeatmapColor(othersCount, maxCount),
      color: getHeatmapTextColor(othersCount, maxCount),
    };
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, colIdx: number, rowIdx: number) => {
      if (!isEditing) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const key = getCellKey(dates[colIdx].id, timeSlots[rowIdx].start);
        const newSlots = new Set(selectedSlots);
        if (newSlots.has(key)) {
          newSlots.delete(key);
        } else {
          newSlots.add(key);
        }
        onSlotsChange(newSlots);
        return;
      }

      let nextCol = colIdx;
      let nextRow = rowIdx;

      switch (e.key) {
        case "ArrowUp":
          nextRow = Math.max(0, rowIdx - 1);
          break;
        case "ArrowDown":
          nextRow = Math.min(timeSlots.length - 1, rowIdx + 1);
          break;
        case "ArrowLeft":
          nextCol = Math.max(0, colIdx - 1);
          break;
        case "ArrowRight":
          nextCol = Math.min(dates.length - 1, colIdx + 1);
          break;
        default:
          return;
      }

      e.preventDefault();
      const nextCell = gridRef.current?.querySelector(
        `[data-col="${nextCol}"][data-row="${nextRow}"]`
      ) as HTMLElement | null;
      nextCell?.focus();
    },
    [isEditing, dates, timeSlots, selectedSlots, onSlotsChange]
  );

  const handleCellHover = (
    key: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (isEditing || isDraggingRef.current) return;
    const names = heatmapData.get(key) || [];
    if (names.length === 0) {
      setHoveredCell(null);
      return;
    }
    setHoveredCell(key);
    const rect = gridRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
      });
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
  }, []);

  // Check scroll on mount and resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    // Initial check after render
    setTimeout(checkScroll, 100);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScroll]);

  return (
    <div
      className="select-none relative"
      ref={gridRef}
      role="grid"
      aria-label={isEditing ? "되는 시간 선택 그리드" : "참여자 가용 시간 그리드"}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        handlePointerUp();
        setHoveredCell(null);
      }}
    >
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto"
        onScroll={checkScroll}
      >
        <div
          className="grid min-w-fit"
          style={{
            gridTemplateColumns:
              mode === "DATE_ONLY"
                ? `repeat(${dates.length}, minmax(64px, 1fr))`
                : `48px repeat(${dates.length}, minmax(48px, 1fr))`,
          }}
        >
          {/* Header row */}
          {mode !== "DATE_ONLY" && (
            <div className="sticky left-0 bg-background z-10" />
          )}
          {dates.map((d) => (
            <div
              key={d.id}
              role="columnheader"
              className="text-center text-xs font-medium py-2 border-b border-border"
            >
              <div>{format(new Date(d.date), "M/d", { locale: ko })}</div>
              <div className="text-muted-foreground">
                {format(new Date(d.date), "EEE", { locale: ko })}
              </div>
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map((slot, rowIdx) => (
            <div key={`row-${rowIdx}`} role="row" className="contents">
              {mode !== "DATE_ONLY" && (
                <div
                  className="sticky left-0 bg-background z-10 text-[10px] sm:text-xs text-muted-foreground pr-1 sm:pr-2 flex items-center justify-end border-b border-border/50"
                  style={{ height: "40px" }}
                >
                  {rowIdx % (60 / slotDuration) === 0 && formatTime(slot.start)}
                </div>
              )}
              {dates.map((d, colIdx) => {
                const key = getCellKey(d.id, slot.start);
                const names = heatmapData.get(key) || [];
                const count = names.length;

                const dateLabel = format(new Date(d.date), "M/d EEE", { locale: ko });
                const timeLabel = mode === "DATE_ONLY" ? "" : ` ${formatTime(slot.start)}`;
                const cellLabel = isEditing
                  ? `${dateLabel}${timeLabel} ${selectedSlots.has(key) ? "선택됨" : "선택 안 됨"}`
                  : `${dateLabel}${timeLabel} ${count}/${participants.length}명 가능`;

                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-label={cellLabel}
                    aria-selected={isEditing ? selectedSlots.has(key) : undefined}
                    tabIndex={isEditing && colIdx === 0 && rowIdx === 0 ? 0 : -1}
                    data-col={colIdx}
                    data-row={rowIdx}
                    className={`border-b border-r border-border/30 transition-colors relative ${
                      mode === "DATE_ONLY"
                        ? "flex items-center justify-center"
                        : ""
                    } ${isEditing ? "focus:outline-2 focus:outline-primary focus:outline-offset-[-2px] focus:z-10" : ""}`}
                    style={{
                      height: mode === "DATE_ONLY" ? "48px" : "40px",
                      ...getCellStyle(d.id, slot.start),
                    }}
                    onKeyDown={(e) => handleKeyDown(e, colIdx, rowIdx)}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handlePointerDown(colIdx, rowIdx);
                    }}
                    onPointerMove={(e) => {
                      handlePointerMove(colIdx, rowIdx);
                      handleCellHover(key, e);
                    }}
                    onPointerEnter={(e) => handleCellHover(key, e)}
                    onPointerLeave={() => setHoveredCell(null)}
                    onPointerUp={handlePointerUp}
                  >
                    {mode === "DATE_ONLY" && !isEditing && count > 0 && (
                      <span className="text-sm font-medium">{count}</span>
                    )}
                    {isEditing && count > 0 && !selectedSlots.has(key) && (
                      <span className="text-[10px] text-muted-foreground/60 absolute bottom-0.5 right-1 pointer-events-none">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Tooltip */}
      {hoveredCell && !isEditing && (() => {
        const names = heatmapData.get(hoveredCell) || [];
        if (names.length === 0) return null;
        const gridWidth = gridRef.current?.clientWidth || 300;
        const clampedX = Math.max(80, Math.min(tooltipPos.x, gridWidth - 80));
        return (
          <div
            className="absolute z-50 pointer-events-none bg-foreground text-background text-xs rounded-md px-3 py-2 shadow-lg max-w-[200px]"
            style={{
              left: clampedX,
              top: tooltipPos.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="font-medium">
              {names.length}/{participants.length}명 가능
            </p>
            <p className="opacity-80 break-words">{names.join(", ")}</p>
          </div>
        );
      })()}

      {/* Scroll hint for mobile */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent pointer-events-none z-20 flex items-center justify-center sm:hidden">
          <span className="text-muted-foreground text-xs animate-pulse">&rsaquo;</span>
        </div>
      )}

      {/* Heatmap Legend */}
      {!isEditing && participants.length > 0 && (
        <div className="flex items-center gap-2 mt-4 justify-center text-xs text-muted-foreground">
          <span>0명</span>
          <div className="flex h-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="w-6 h-4"
                style={{
                  backgroundColor: getHeatmapColor(i + 1, 5),
                }}
              />
            ))}
          </div>
          <span>전원</span>
        </div>
      )}
    </div>
  );
}
