"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";

import {
  BedDouble,
  Building2,
  CheckCircle2,
  DoorOpen,
  Edit3,
  Home,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  School2,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { CinematicSelect, type CinematicSelectOption } from "@/components/dashboard/cinematic-select";
import { EmptyPanel, MetricCard, PanelCard, SectionHeading } from "@/components/dashboard/module-kit";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PaginatedResult } from "@/lib/api/contracts";
import {
  assignDormitoryBed,
  cancelAssignDormitoryBed,
  createCampus,
  createClassroom,
  createDormitoryBed,
  createDormitoryBuilding,
  createDormitoryFloor,
  createDormitoryRoom,
  deleteCampus,
  deleteClassroom,
  deleteDormitoryBed,
  deleteDormitoryBuilding,
  deleteDormitoryFloor,
  deleteDormitoryRoom,
  fetchCampusList,
  fetchClassroomList,
  fetchDormitoryAssignBedList,
  fetchDormitoryBedList,
  fetchDormitoryBuildingList,
  fetchDormitoryFloorList,
  fetchDormitoryRoomList,
  fetchDormitoryStudentList,
  fetchDormitoryTeacherList,
  updateCampus,
  updateClassroom,
  updateDormitoryBed,
  updateDormitoryBuilding,
  updateDormitoryFloor,
  updateDormitoryRoom,
} from "@/lib/api/business";
import { getSchoolProfile } from "@/lib/user-profile";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type EntityKey = "campus" | "classroom" | "building" | "floor" | "room" | "bed";
type DormUserType = "student" | "teacher";
type RowRecord = Record<string, unknown> & { id: string | number };
type VisualBuildingKind = "dormitory" | "teaching";
type VisualPosition = { x: number; y: number };
type FloorUnitSummary = { name: string; units: number; unitLabel: string };

type FieldConfig = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "select";
  options?: CinematicSelectOption[];
};

type EditingState = {
  key: EntityKey;
  record: RowRecord | null;
  defaults?: Record<string, string>;
};

type EntityConfig = {
  key: EntityKey;
  title: string;
  icon: typeof School2;
  fields: (context: OptionContext) => FieldConfig[];
  list: (query: Record<string, unknown>, token: string) => Promise<PaginatedResult<RowRecord>>;
  create: (payload: Record<string, unknown>, token: string) => Promise<unknown>;
  update: (payload: Record<string, unknown>, token: string) => Promise<unknown>;
  remove: (id: string | number, token: string) => Promise<unknown>;
};

type OptionContext = {
  campuses: CinematicSelectOption[];
  buildings: CinematicSelectOption[];
  floors: CinematicSelectOption[];
  rooms: CinematicSelectOption[];
};

const PAGE_SIZE = 10;

const entityOrder: EntityKey[] = ["campus", "classroom", "building", "floor", "room", "bed"];
const GRID_COLS = 12;
const GRID_ROWS = 7;
const BUILDING_POSITION_STORAGE_KEY = "music-road-campus-building-positions";

function textOf(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function displayName(record: RowRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return `#${record.id}`;
}

function toOptions(records: RowRecord[], keys: string[]): CinematicSelectOption[] {
  return records.map((record) => ({ value: String(record.id), label: displayName(record, keys) }));
}

function compactPayload(form: Record<string, string>, record?: RowRecord | null) {
  const payload: Record<string, unknown> = record ? { id: record.id } : {};
  Object.entries(form).forEach(([key, value]) => {
    const trimmed = value.trim();
    if (trimmed !== "") payload[key] = trimmed;
  });
  return payload;
}

function layoutPosition(record: RowRecord, index: number) {
  const rawX = Number(record.x ?? record.positionX ?? record.left);
  const rawY = Number(record.y ?? record.positionY ?? record.top);
  return {
    x: Number.isFinite(rawX) && rawX > 0 ? Math.min(GRID_COLS, Math.max(1, rawX)) : 2 + ((index * 3) % 9),
    y: Number.isFinite(rawY) && rawY > 0 ? Math.min(GRID_ROWS, Math.max(1, rawY)) : 2 + (Math.floor(index / 3) % 4),
  };
}

function readBuildingPositions(): Record<string, VisualPosition> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BUILDING_POSITION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, VisualPosition>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistBuildingPositions(positions: Record<string, VisualPosition>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUILDING_POSITION_STORAGE_KEY, JSON.stringify(positions));
}

function sameId(left: unknown, right: unknown) {
  return left !== undefined && left !== null && right !== undefined && right !== null && String(left) === String(right);
}

function recordMatches(record: RowRecord, keys: string[], target?: RowRecord) {
  if (!target?.id) return true;
  return keys.some((key) => sameId(record[key], target.id));
}

function getClassroomName(record: RowRecord) {
  return displayName(record, ["name", "classroomName", "roomName"]);
}

function parseClassroomName(record: RowRecord) {
  const rawName = getClassroomName(record).trim();
  const normalized = rawName.replace(/[—–]/g, "-");
  const parts = normalized.split("-").map((item) => item.trim()).filter(Boolean);

  if (parts.length >= 3) {
    return {
      buildingName: parts[0],
      floorName: parts[1],
      roomName: parts.slice(2).join("-"),
    };
  }

  const floorMatch = normalized.match(/^(.*?)(\d+\s*层)\s*[-_ ]?\s*(.+)$/);
  if (floorMatch) {
    return {
      buildingName: floorMatch[1].trim() || "教学楼",
      floorName: floorMatch[2].replace(/\s+/g, ""),
      roomName: floorMatch[3].trim(),
    };
  }

  const namedRoomMatch = normalized.match(/^(.+?)(\d{3,4})(?:室|教室)?$/);
  if (namedRoomMatch) {
    const roomNumber = namedRoomMatch[2];
    return {
      buildingName: namedRoomMatch[1].trim() || "教学楼",
      floorName: `${roomNumber.slice(0, 1)}层`,
      roomName: roomNumber,
    };
  }

  const numericRoom = normalized.match(/^(\d)(\d{2,})$/);
  return {
    buildingName: "教学楼",
    floorName: numericRoom ? `${numericRoom[1]}层` : "1层",
    roomName: rawName,
  };
}

function classroomBelongsToCampus(record: RowRecord, campus?: RowRecord) {
  if (!campus?.id) return true;
  if (record.campusId === undefined || record.campusId === null || record.campusId === "") return true;
  if (String(record.campusId) === "0") return true;
  return sameId(record.campusId, campus.id);
}

function getDormitoryFloorUnits(building: RowRecord, records: Record<EntityKey, RowRecord[]>): FloorUnitSummary[] {
  return records.floor
    .filter((floor) => sameId(floor.buildingId, building.id))
    .map((floor) => {
      const units = Number(
        floor.roomCount ??
          records.room.filter((room) => sameId(room.floorId, floor.id) || (sameId(room.buildingId, building.id) && !room.floorId)).length,
      );
      return {
        name: displayName(floor, ["name", "floorName"]),
        units: Number.isFinite(units) ? units : 0,
        unitLabel: "宿舍",
      };
    });
}

function getVisualBuildings(records: Record<EntityKey, RowRecord[]>, selected: Partial<Record<EntityKey, RowRecord>>) {
  const dormitoryBuildings = records.building
    .filter((record) => recordMatches(record, ["campusId"], selected.campus))
    .map((record) => {
      const floorUnits = getDormitoryFloorUnits(record, records);
      return {
        ...record,
        visualKind: "dormitory" as VisualBuildingKind,
        floorUnits,
        floorCount: floorUnits.length || record.floorCount,
        roomCount: floorUnits.reduce((sum, floor) => sum + floor.units, 0),
      };
    });
  const teachingMap = new Map<string, { record: RowRecord; floors: Map<string, number> }>();

  records.classroom.filter((record) => classroomBelongsToCampus(record, selected.campus)).forEach((classroom) => {
    const parsed = parseClassroomName(classroom);
    const campusId = selected.campus?.id ?? classroom.campusId ?? "all";
    const key = `${campusId}:${parsed.buildingName}`;
    const current =
      teachingMap.get(key) ??
      {
        record: {
          id: `teaching:${key}`,
          name: parsed.buildingName,
          buildingName: parsed.buildingName,
          campusId,
          visualKind: "teaching",
          synthetic: true,
        },
        floors: new Map<string, number>(),
      };
    current.floors.set(parsed.floorName, (current.floors.get(parsed.floorName) ?? 0) + 1);
    teachingMap.set(key, current);
  });

  const teachingBuildings = Array.from(teachingMap.values()).map(({ record, floors }) => {
    const floorUnits = Array.from(floors.entries()).map(([name, units]) => ({ name, units, unitLabel: "教室" }));
    return {
      ...record,
      floorUnits,
      roomCount: floorUnits.reduce((sum, floor) => sum + floor.units, 0),
      floorCount: floorUnits.length,
      floorNames: floorUnits.map((floor) => floor.name),
    };
  });

  return [...dormitoryBuildings, ...teachingBuildings];
}

function getTeachingClassrooms(records: RowRecord[], selected: Partial<Record<EntityKey, RowRecord>>) {
  const selectedBuildingName = selected.building?.visualKind === "teaching" ? displayName(selected.building, ["name", "buildingName"]) : "";
  const selectedFloorName = selected.floor?.visualKind === "teaching" ? displayName(selected.floor, ["name", "floorName"]) : "";

  return records.filter((classroom) => {
    if (!classroomBelongsToCampus(classroom, selected.campus)) return false;
    const parsed = parseClassroomName(classroom);
    if (selectedBuildingName && parsed.buildingName !== selectedBuildingName) return false;
    if (selectedFloorName && parsed.floorName !== selectedFloorName) return false;
    return true;
  });
}

function getVisualFloors(records: Record<EntityKey, RowRecord[]>, selected: Partial<Record<EntityKey, RowRecord>>) {
  if (selected.building?.visualKind === "teaching") {
    const floorMap = new Map<string, RowRecord>();
    getTeachingClassrooms(records.classroom, selected).forEach((classroom) => {
      const parsed = parseClassroomName(classroom);
      const current = floorMap.get(parsed.floorName);
      floorMap.set(parsed.floorName, {
        id: `teaching-floor:${selected.building?.id}:${parsed.floorName}`,
        name: parsed.floorName,
        floorName: parsed.floorName,
        buildingId: selected.building?.id,
        visualKind: "teaching",
        synthetic: true,
        classroomCount: Number(current?.classroomCount ?? 0) + 1,
      });
    });
    return Array.from(floorMap.values());
  }

  return records.floor
    .filter((record) => recordMatches(record, ["buildingId"], selected.building))
    .map((floor) => ({
      ...floor,
      roomCount: records.room.filter((room) => recordMatches(room, ["floorId"], floor)).length,
    }));
}

function getSceneRecords(key: EntityKey, records: Record<EntityKey, RowRecord[]>, selected: Partial<Record<EntityKey, RowRecord>>) {
  if (key === "classroom") return getTeachingClassrooms(records.classroom, selected);
  if (key === "building") return getVisualBuildings(records, selected);
  if (key === "floor") return getVisualFloors(records, selected);
  if (key === "room") {
    return records.room.filter(
      (record) => recordMatches(record, ["buildingId"], selected.building) && recordMatches(record, ["floorId"], selected.floor),
    );
  }
  if (key === "bed") return records.bed.filter((record) => recordMatches(record, ["roomId"], selected.room));
  return records.campus;
}

function nextKeyOf(key: EntityKey, selected: Partial<Record<EntityKey, RowRecord>> = {}): EntityKey | null {
  if (key === "campus") return "building";
  if (key === "building") return "floor";
  if (key === "floor" && selected.building?.visualKind === "teaching") return "classroom";
  if (key === "floor") return "room";
  if (key === "room") return "bed";
  return null;
}

function getCreateDefaults(key: EntityKey, selected: Partial<Record<EntityKey, RowRecord>>) {
  const defaults: Record<string, string> = {};
  if ((key === "classroom" || key === "building") && selected.campus?.id) defaults.campusId = String(selected.campus.id);
  if ((key === "floor" || key === "room") && selected.building?.id) defaults.buildingId = String(selected.building.id);
  if (key === "room" && selected.floor?.id) defaults.floorId = String(selected.floor.id);
  if (key === "bed" && selected.room?.id) defaults.roomId = String(selected.room.id);
  return defaults;
}

function getTeachingBuildingName(selected: Partial<Record<EntityKey, RowRecord>>) {
  return selected.building?.visualKind === "teaching" ? displayName(selected.building, ["name", "buildingName"]) : "教学楼A";
}

function getTeachingFloorName(selected: Partial<Record<EntityKey, RowRecord>>) {
  return selected.floor?.visualKind === "teaching" ? displayName(selected.floor, ["name", "floorName"]) : "1层";
}

function getFloorIndex(floorName: string) {
  const match = floorName.match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function suggestClassroomName(selected: Partial<Record<EntityKey, RowRecord>>, classrooms: RowRecord[]) {
  const buildingName = getTeachingBuildingName(selected);
  const floorName = getTeachingFloorName(selected);
  const floorIndex = getFloorIndex(floorName);
  const usedNumbers = getTeachingClassrooms(classrooms, {
    ...selected,
    building: { ...(selected.building ?? {}), id: selected.building?.id ?? `teaching:${buildingName}`, name: buildingName, visualKind: "teaching" },
    floor: { ...(selected.floor ?? {}), id: selected.floor?.id ?? `teaching-floor:${floorName}`, name: floorName, floorName, visualKind: "teaching" },
  }).map((classroom) => {
    const parsed = parseClassroomName(classroom);
    const digits = parsed.roomName.match(/\d+/)?.[0];
    return digits ? Number(digits) : 0;
  });
  const nextRoom = Math.max(floorIndex * 100, ...usedNumbers) + 1;
  return `${buildingName}-${floorName}-${nextRoom}`;
}

function normalizeClassroomCreatePayload(payload: Record<string, unknown>, selected: Partial<Record<EntityKey, RowRecord>>, classrooms: RowRecord[]) {
  const rawName = textOf(payload.name, "").trim();
  const suggested = suggestClassroomName(selected, classrooms);
  if (!rawName) return { name: suggested };
  if (rawName.includes("-") || rawName.includes("—") || rawName.includes("–")) return { name: rawName };
  return { name: `${getTeachingBuildingName(selected)}-${getTeachingFloorName(selected)}-${rawName}` };
}

function normalizeDormitoryBuildingPayload(
  payload: Record<string, unknown>,
  selected: Partial<Record<EntityKey, RowRecord>>,
  schoolId?: string | number,
) {
  const buildingName = textOf(payload.buildingName ?? payload.name, "").trim();
  const next: Record<string, unknown> = {
    buildingName,
    campusId: payload.campusId ?? selected.campus?.id ?? 0,
    schoolId: schoolId ?? selected.campus?.schoolId ?? 0,
  };
  if (payload.id !== undefined && payload.id !== null && payload.id !== "") next.id = payload.id;
  return next;
}

function nextTeachingBuildingName(classrooms: RowRecord[], selected: Partial<Record<EntityKey, RowRecord>>) {
  const existing = new Set(
    getTeachingClassrooms(classrooms, { ...selected, building: undefined, floor: undefined }).map((classroom) => parseClassroomName(classroom).buildingName),
  );
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const nextLetter = letters.find((letter) => !existing.has(`教学楼${letter}`)) ?? String(existing.size + 1);
  return `教学楼${nextLetter}`;
}

function selectionLabel(key: EntityKey, selected: Partial<Record<EntityKey, RowRecord>>) {
  if (key === "floor") return selected.building ? `所属宿舍楼：${displayName(selected.building, ["name", "buildingName"])}` : "请先选择宿舍楼";
  if (key === "room") return selected.floor ? `所属楼层：${displayName(selected.floor, ["name", "floorName"])}` : "可先选择楼层，房间会自动归属";
  if (key === "bed") return selected.room ? `所属房间：${displayName(selected.room, ["name", "roomName"])}` : "请先选择房间";
  if (key === "classroom" || key === "building") return selected.campus ? `所属校区：${displayName(selected.campus, ["name", "campusName"])}` : "全部校区";
  return "校区空间总览";
}

function CampusBuildingModel({
  building,
  index,
  active,
  position,
  dragging,
  onClick,
  onStartDrag,
}: {
  building: RowRecord;
  index: number;
  active: boolean;
  position?: VisualPosition;
  dragging?: boolean;
  onClick: () => void;
  onStartDrag?: (id: string, event: PointerEvent<HTMLButtonElement>) => void;
}) {
  const pos = position ?? layoutPosition(building, index);
  const name = displayName(building, ["name", "buildingName"]);
  const floorUnits = (Array.isArray(building.floorUnits) ? building.floorUnits : []) as FloorUnitSummary[];
  const fallbackFloorCount = Number(building.floorCount ?? building.floors ?? 1);
  const floors =
    floorUnits.length > 0
      ? floorUnits
      : Array.from({ length: Math.max(1, Number.isFinite(fallbackFloorCount) ? fallbackFloorCount : 1) }).map((_, floorIndex) => ({
          name: `${floorIndex + 1}层`,
          units: 0,
          unitLabel: building.visualKind === "teaching" ? "教室" : "宿舍",
        }));
  const floorCount = floors.length;
  const maxUnits = Math.max(1, ...floors.map((floor) => floor.units));
  const height = Math.min(190, 58 + Math.max(1, floorCount) * 28);
  const isTeaching = building.visualKind === "teaching";
  const summary = isTeaching ? `教学楼 · ${floorCount} 层 · ${String(building.roomCount ?? 0)} 间教室` : `宿舍楼 · ${floorCount} 层`;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(event) => {
        event.preventDefault();
        onStartDrag?.(String(building.id), event);
      }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none text-left active:cursor-grabbing",
        !dragging && "transition-all duration-300",
        active ? "z-30 scale-105" : "z-20 hover:scale-[1.03]",
        dragging && "z-40 scale-105 transition-none",
      )}
      style={{ left: `${(pos.x / GRID_COLS) * 100}%`, top: `${(pos.y / GRID_ROWS) * 100}%` }}
    >
      <span className="relative block h-[230px] w-[160px]">
        <span className="absolute bottom-3 left-1/2 h-6 w-36 -translate-x-1/2 rounded-full bg-violet-500/20 blur-md" />
        <span
          className={cn(
            "absolute bottom-10 left-[24px] w-[90px] rounded-t-[0.9rem] border border-violet-200 bg-gradient-to-b from-violet-100 via-white to-fuchsia-50 shadow-[0_22px_40px_rgba(35,31,70,0.18)]",
            active && "ring-4 ring-primary/20",
          )}
          style={{ height }}
        >
          <span className="absolute inset-x-2 bottom-7 top-3 flex flex-col-reverse justify-end gap-1.5">
            {floors.map((floor, floorIndex) => {
              const unitCount = Math.max(1, floor.units || 1);
              const visibleUnits = Math.min(8, unitCount);
              return (
                <span key={`${floor.name}-${floorIndex}`} className="group/floor relative rounded-md bg-white/70 px-1 py-1 shadow-[0_1px_0_rgba(255,255,255,0.75)_inset]">
                  <span
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${Math.min(visibleUnits, Math.max(1, maxUnits, 5))}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: visibleUnits }).map((_, itemIndex) => (
                      <span key={itemIndex} className={cn("h-2.5 rounded-[0.2rem]", isTeaching ? "bg-sky-300/80" : "bg-violet-300/80")} />
                    ))}
                  </span>
                  <span className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 rounded-full bg-slate-950 px-2 py-1 text-[0.62rem] text-white shadow-lg group-hover/floor:block">
                    {floor.name} · {floor.units} {floor.unitLabel}
                  </span>
                </span>
              );
            })}
          </span>
          <span className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 rounded-t-md bg-violet-500/70" />
        </span>
        <span className="absolute bottom-12 left-[114px] h-[92px] w-[38px] skew-y-[28deg] rounded-r-[0.55rem] border-r border-t border-violet-200 bg-violet-200/60" style={{ height: Math.max(40, height - 10) }} />
        <span className="absolute bottom-0 left-0 right-0 rounded-[1rem] border border-white/80 bg-white/92 px-3 py-2 shadow-[0_12px_30px_rgba(58,45,110,0.12)]">
          <span className="block truncate text-xs font-semibold text-foreground">{name}</span>
          <span className="mt-0.5 block truncate text-[0.68rem] text-muted-foreground">{summary}</span>
        </span>
      </span>
    </button>
  );
}

function CampusZoneModel({
  campus,
  index,
  active,
  onClick,
}: {
  campus: RowRecord;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const pos = layoutPosition(campus, index);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("absolute h-[120px] w-[180px] -translate-x-1/2 -translate-y-1/2 transition-all duration-300", active ? "z-30 scale-105" : "z-20 hover:scale-[1.03]")}
      style={{ left: `${(pos.x / GRID_COLS) * 100}%`, top: `${(pos.y / GRID_ROWS) * 100}%` }}
    >
      <span className="absolute inset-x-6 bottom-2 h-5 rounded-full bg-primary/18 blur-lg" />
      <span
        className={cn(
          "absolute inset-0 -skew-x-6 rounded-[1.6rem] border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,231,255,0.9))] shadow-[0_24px_54px_rgba(66,48,126,0.16)]",
          active && "ring-4 ring-primary/20",
        )}
      />
      <span className="absolute inset-4 grid grid-cols-3 gap-2 opacity-80">
        {Array.from({ length: 6 }).map((_, itemIndex) => (
          <span key={itemIndex} className="rounded-xl bg-primary/10" />
        ))}
      </span>
      <span className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/86 px-3 py-2 text-left shadow-sm">
        <span className="block truncate text-sm font-semibold text-slate-950">{displayName(campus, ["name", "campusName"])}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">点击进入宿舍楼视图</span>
      </span>
    </button>
  );
}

function MiniSpaceModel({
  record,
  index,
  active,
  icon,
  titleKeys,
  variant,
  onClick,
}: {
  record: RowRecord;
  index: number;
  active: boolean;
  icon: ReactNode;
  titleKeys: string[];
  variant: "classroom" | "room" | "bed";
  onClick: () => void;
}) {
  const pos = layoutPosition(record, index);
  const width = variant === "bed" ? 112 : 150;
  const height = variant === "bed" ? 86 : 112;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("absolute -translate-x-1/2 -translate-y-1/2 text-left transition-all duration-300", active ? "z-30 scale-105" : "z-20 hover:scale-[1.03]")}
      style={{ left: `${(pos.x / GRID_COLS) * 100}%`, top: `${(pos.y / GRID_ROWS) * 100}%`, width, height }}
    >
      <span className="absolute inset-x-4 bottom-0 h-4 rounded-full bg-primary/18 blur-md" />
      <span
        className={cn(
          "absolute inset-0 rounded-[1.4rem] border border-white/90 bg-white/92 shadow-[0_22px_48px_rgba(66,48,126,0.14)]",
          active && "ring-4 ring-primary/20",
          variant === "classroom" && "bg-[linear-gradient(135deg,#ffffff,#eff6ff)]",
          variant === "room" && "bg-[linear-gradient(135deg,#ffffff,#f7f2ff)]",
          variant === "bed" && "bg-[linear-gradient(135deg,#ffffff,#f0fdf4)]",
        )}
      />
      <span className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
      {variant !== "bed" ? (
        <span className="absolute bottom-10 left-4 right-4 grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, itemIndex) => (
            <span key={itemIndex} className="h-3 rounded-md bg-primary/12" />
          ))}
        </span>
      ) : (
        <span className="absolute bottom-9 left-4 right-4 h-5 rounded-lg bg-emerald-300/60 shadow-[8px_8px_0_rgba(132,78,255,0.12)]" />
      )}
      <span className="absolute inset-x-3 bottom-3 truncate text-xs font-semibold text-slate-900">{displayName(record, titleKeys)}</span>
    </button>
  );
}

function FloorStackScene({
  floors,
  building,
  selectedFloor,
  onSelect,
}: {
  floors: RowRecord[];
  building?: RowRecord;
  selectedFloor?: RowRecord;
  onSelect: (record: RowRecord) => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[430px] w-[420px]">
        <div className="absolute bottom-6 left-1/2 h-10 w-80 -translate-x-1/2 rounded-full bg-primary/18 blur-xl" />
        <div className="absolute bottom-10 left-1/2 w-72 -translate-x-1/2 rounded-[2rem] border border-white/90 bg-white/86 px-5 py-4 text-center shadow-[0_18px_44px_rgba(66,48,126,0.12)]">
          <p className="text-xs text-muted-foreground">当前宿舍楼</p>
          <p className="mt-1 truncate text-lg font-semibold text-slate-950">{building ? displayName(building, ["name", "buildingName"]) : "未选择宿舍楼"}</p>
        </div>
        {floors.map((floor, index) => {
          const active = sameId(selectedFloor?.id, floor.id);
          const count = Number(floor.classroomCount ?? floor.roomCount ?? 0);
          const unit = floor.visualKind === "teaching" ? "间教室" : "间卧室";
          return (
            <button
              key={String(floor.id)}
              type="button"
              onClick={() => onSelect(floor)}
              className={cn("absolute left-1/2 h-12 w-72 -translate-x-1/2 -skew-x-12 rounded-[1.1rem] border border-white/90 bg-white/92 shadow-[0_16px_34px_rgba(66,48,126,0.13)] transition-all duration-300 hover:-translate-y-1", active && "bg-primary/12 ring-4 ring-primary/18")}
              style={{ bottom: 118 + index * 36 }}
            >
              <span className="absolute inset-y-2 left-5 w-14 rounded-lg bg-primary/12" />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 skew-x-12 text-right">
                <span className="block text-sm font-semibold text-slate-900">{displayName(floor, ["name", "floorName"])}</span>
                <span className="block text-[0.68rem] text-muted-foreground">{count} {unit}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CampusScene({
  activeKey,
  records,
  selected,
  loading,
  buildingPositions,
  onSelect,
  onBuildingPositionChange,
}: {
  activeKey: EntityKey;
  records: Record<EntityKey, RowRecord[]>;
  selected: Partial<Record<EntityKey, RowRecord>>;
  loading: Record<EntityKey, boolean>;
  buildingPositions: Record<string, VisualPosition>;
  onSelect: (key: EntityKey, record: RowRecord) => void;
  onBuildingPositionChange: (id: string, position: VisualPosition) => void;
}) {
  const [draggingBuildingId, setDraggingBuildingId] = useState<string | null>(null);
  const [draftPositions, setDraftPositions] = useState<Record<string, VisualPosition>>({});
  const dragStateRef = useRef<{
    frame: number | null;
    id: string;
    latest?: VisualPosition;
    moved: boolean;
    startX: number;
    startY: number;
  } | null>(null);
  const suppressClickRef = useRef<string | null>(null);
  const sceneRecords = getSceneRecords(activeKey, records, selected);
  const focusBuilding = selected.building ?? records.building[0];
  const emptyMessage = activeKey === "floor" && !focusBuilding ? "先选择或新增一栋宿舍楼，楼层会在这里堆叠显示。" : `当前没有${entityConfigs[activeKey].title}记录。`;

  const commitDrag = () => {
    const state = dragStateRef.current;
    if (!state) return;
    if (state.frame !== null) window.cancelAnimationFrame(state.frame);
    if (state.moved && state.latest) {
      suppressClickRef.current = state.id;
      onBuildingPositionChange(state.id, state.latest);
      setDraftPositions((current) => {
        const next = { ...current };
        delete next[state.id];
        return next;
      });
      window.setTimeout(() => {
        if (suppressClickRef.current === state.id) suppressClickRef.current = null;
      }, 180);
    }
    dragStateRef.current = null;
    setDraggingBuildingId(null);
  };

  const moveBuilding = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || activeKey !== "building") return;
    const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
    if (distance < 4 && !state.moved) return;
    state.moved = true;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(GRID_COLS - 0.8, Math.max(0.8, ((event.clientX - rect.left) / rect.width) * GRID_COLS));
    const y = Math.min(GRID_ROWS - 0.8, Math.max(0.8, ((event.clientY - rect.top) / rect.height) * GRID_ROWS));
    state.latest = { x, y };
    if (state.frame !== null) return;
    state.frame = window.requestAnimationFrame(() => {
      const current = dragStateRef.current;
      if (!current?.latest) return;
      current.frame = null;
      setDraftPositions((positions) => ({ ...positions, [current.id]: current.latest as VisualPosition }));
    });
  };

  return (
    <div
      className="relative min-h-[520px] overflow-hidden rounded-[1.6rem] border border-white bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_38%,#eef2ff_100%)] shadow-[0_20px_70px_rgba(103,79,194,0.08)] xl:min-h-[620px]"
      onPointerMove={moveBuilding}
      onPointerUp={commitDrag}
      onPointerCancel={commitDrag}
      onPointerLeave={commitDrag}
    >
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(101,76,196,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(101,76,196,0.08)_1px,transparent_1px)] [background-size:8.333%_14.285%]" />
      <div className="absolute left-8 top-8 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-xl">
        {selectionLabel(activeKey, selected)}
      </div>

      {activeKey === "campus"
        ? sceneRecords.map((campus, index) => (
            <CampusZoneModel key={String(campus.id)} campus={campus} index={index} active={sameId(selected.campus?.id, campus.id)} onClick={() => onSelect("campus", campus)} />
          ))
        : null}

      {activeKey === "building"
        ? sceneRecords.map((building, index) => (
            <CampusBuildingModel
              key={String(building.id)}
              building={building}
              index={index}
              position={draftPositions[String(building.id)] ?? buildingPositions[String(building.id)]}
              dragging={draggingBuildingId === String(building.id)}
              active={sameId(selected.building?.id, building.id)}
              onStartDrag={(id, event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragStateRef.current = {
                  frame: null,
                  id,
                  moved: false,
                  startX: event.clientX,
                  startY: event.clientY,
                };
                setDraggingBuildingId(id);
              }}
              onClick={() => {
                if (suppressClickRef.current === String(building.id)) return;
                onSelect("building", building);
              }}
            />
          ))
        : null}

      {activeKey === "classroom"
        ? sceneRecords.map((classroom, index) => (
            <MiniSpaceModel
              key={String(classroom.id)}
              record={classroom}
              index={index}
              active={sameId(selected.classroom?.id, classroom.id)}
              icon={<DoorOpen className="size-4" />}
              titleKeys={["name", "classroomName"]}
              variant="classroom"
              onClick={() => onSelect("classroom", classroom)}
            />
          ))
        : null}

      {activeKey === "floor" && focusBuilding ? (
        <FloorStackScene floors={sceneRecords} building={focusBuilding} selectedFloor={selected.floor} onSelect={(floor) => onSelect("floor", floor)} />
      ) : null}

      {activeKey === "room"
        ? sceneRecords.map((room, index) => (
            <MiniSpaceModel
              key={String(room.id)}
              record={room}
              index={index}
              active={sameId(selected.room?.id, room.id)}
              icon={<Home className="size-4" />}
              titleKeys={["name", "roomName"]}
              variant="room"
              onClick={() => onSelect("room", room)}
            />
          ))
        : null}

      {activeKey === "bed"
        ? sceneRecords.map((bed, index) => (
            <MiniSpaceModel
              key={String(bed.id)}
              record={bed}
              index={index}
              active={sameId(selected.bed?.id, bed.id)}
              icon={<BedDouble className="size-4" />}
              titleKeys={["name", "bedName"]}
              variant="bed"
              onClick={() => onSelect("bed", bed)}
            />
          ))
        : null}

      {!loading[activeKey] && !sceneRecords.length ? (
        <div className="absolute inset-0 flex items-center justify-center px-8">
          <EmptyPanel title={`暂无${entityConfigs[activeKey].title}`} description={emptyMessage} />
        </div>
      ) : null}
      {loading[activeKey] ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 text-sm text-muted-foreground backdrop-blur-sm">
          <Loader2 className="mr-2 size-4 animate-spin" />
          正在生成空间模型
        </div>
      ) : null}
    </div>
  );
}

const entityConfigs: Record<EntityKey, EntityConfig> = {
  campus: {
    key: "campus",
    title: "校区",
    icon: School2,
    fields: () => [
      { key: "name", label: "校区名称", placeholder: "例如：长沙校区" },
      { key: "sort", label: "排序", placeholder: "可选", type: "number" },
    ],
    list: fetchCampusList,
    create: createCampus,
    update: updateCampus,
    remove: deleteCampus,
  },
  classroom: {
    key: "classroom",
    title: "教室",
    icon: DoorOpen,
    fields: () => [
      { key: "name", label: "教室名称", placeholder: "例如：教学楼A-1层-101" },
    ],
    list: fetchClassroomList,
    create: createClassroom,
    update: updateClassroom,
    remove: deleteClassroom,
  },
  building: {
    key: "building",
    title: "宿舍大楼",
    icon: Building2,
    fields: ({ campuses }) => [
      { key: "buildingName", label: "宿舍楼名称", placeholder: "例如：1号宿舍楼" },
      { key: "campusId", label: "所属校区", placeholder: "选择校区", type: "select", options: campuses },
    ],
    list: fetchDormitoryBuildingList,
    create: createDormitoryBuilding,
    update: updateDormitoryBuilding,
    remove: deleteDormitoryBuilding,
  },
  floor: {
    key: "floor",
    title: "宿舍楼层",
    icon: Layers3,
    fields: ({ buildings }) => [
      { key: "name", label: "楼层名称", placeholder: "例如：1层" },
      { key: "buildingId", label: "所属宿舍楼", placeholder: "选择宿舍楼", type: "select", options: buildings },
    ],
    list: fetchDormitoryFloorList,
    create: createDormitoryFloor,
    update: updateDormitoryFloor,
    remove: deleteDormitoryFloor,
  },
  room: {
    key: "room",
    title: "宿舍房间",
    icon: Home,
    fields: ({ buildings, floors }) => [
      { key: "name", label: "房间名称", placeholder: "例如：101" },
      { key: "buildingId", label: "所属宿舍楼", placeholder: "选择宿舍楼", type: "select", options: buildings },
      { key: "floorId", label: "所属楼层", placeholder: "选择楼层", type: "select", options: floors },
      { key: "capacity", label: "容量", placeholder: "例如：4", type: "number" },
    ],
    list: fetchDormitoryRoomList,
    create: createDormitoryRoom,
    update: updateDormitoryRoom,
    remove: deleteDormitoryRoom,
  },
  bed: {
    key: "bed",
    title: "宿舍床位",
    icon: BedDouble,
    fields: ({ rooms }) => [
      { key: "name", label: "床位名称", placeholder: "例如：101-1号" },
      { key: "roomId", label: "所属房间", placeholder: "选择房间", type: "select", options: rooms },
    ],
    list: fetchDormitoryBedList,
    create: createDormitoryBed,
    update: updateDormitoryBed,
    remove: deleteDormitoryBed,
  },
};

function EntityDialog({
  open,
  onOpenChange,
  config,
  context,
  record,
  defaults,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EntityConfig;
  context: OptionContext;
  record: RowRecord | null;
  defaults?: Record<string, string>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const fields = config.fields(context);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextFields = config.fields(context);
    const next: Record<string, string> = {};
    nextFields.forEach((field) => {
      next[field.key] = textOf(record?.[field.key] ?? defaults?.[field.key], "");
    });
    setForm(next);
  }, [config, context, defaults, open, record]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(compactPayload(form, record));
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record ? `编辑${config.title}` : `新增${config.title}`}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">{field.label}</Label>
              {field.type === "select" ? (
                <CinematicSelect
                  value={form[field.key] ?? ""}
                  onValueChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                  options={field.options ?? []}
                  placeholder={field.placeholder}
                />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={form[field.key] ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                  className="h-11 rounded-xl border-[#e8e4f3] bg-white/80"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EntityTable({
  config,
  records,
  loading,
  active,
  onSelect,
  onEdit,
  onDelete,
}: {
  config: EntityConfig;
  records: RowRecord[];
  loading: boolean;
  active?: string | number | null;
  onSelect: (record: RowRecord) => void;
  onEdit: (record: RowRecord) => void;
  onDelete: (record: RowRecord) => void;
}) {
  const Icon = config.icon;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#eeeaf7] bg-[#fbfaff] hover:bg-[#fbfaff]">
            <TableHead className="min-w-[210px] px-5 py-4">{config.title}名称</TableHead>
            <TableHead className="min-w-[160px] px-5 py-4">关联信息</TableHead>
            <TableHead className="min-w-[150px] px-5 py-4">创建时间</TableHead>
            <TableHead className="min-w-[180px] px-5 py-4 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                正在加载
              </TableCell>
            </TableRow>
          ) : records.length ? (
            records.map((record) => {
              const synthetic = record.synthetic === true;
              return (
                <TableRow
                  key={String(record.id)}
                  className={cn("cursor-pointer border-[#f0edf7] hover:bg-[#fbfaff]/70", String(active ?? "") === String(record.id) && "bg-primary/[0.04]")}
                  onClick={() => onSelect(record)}
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{displayName(record, ["name", "campusName", "classroomName", "buildingName", "floorName", "roomName", "bedName"])}</p>
                          {synthetic ? <Badge className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] text-primary hover:bg-primary/10">前端合成</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">ID {record.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                    {textOf(record.campusName ?? record.buildingName ?? record.floorName ?? record.roomName ?? record.classroomCount ?? record.roomCount ?? record.capacity, "-")}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">{synthetic ? "由教室名称解析" : textOf(record.createTime ?? record.updateTime)}</TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                      {synthetic ? (
                        <Badge className="rounded-full border border-[#ece8f8] bg-white px-3 py-1 text-muted-foreground hover:bg-white">点击查看下级</Badge>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onEdit(record)}>
                            <Edit3 className="size-4" />
                            编辑
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" onClick={() => onDelete(record)}>
                            <Trash2 className="size-4" />
                            删除
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="p-5">
                <EmptyPanel title="暂无数据" description={`当前还没有${config.title}记录。`} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function CampusesPage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const schoolProfile = getSchoolProfile(user);
  const [activeKey, setActiveKey] = useState<EntityKey>("campus");
  const [records, setRecords] = useState<Record<EntityKey, RowRecord[]>>({
    campus: [],
    classroom: [],
    building: [],
    floor: [],
    room: [],
    bed: [],
  });
  const [loading, setLoading] = useState<Record<EntityKey, boolean>>({
    campus: false,
    classroom: false,
    building: false,
    floor: false,
    room: false,
    bed: false,
  });
  const [selected, setSelected] = useState<Partial<Record<EntityKey, RowRecord>>>({});
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ key: EntityKey; record: RowRecord } | null>(null);
  const [assignType, setAssignType] = useState<DormUserType>("student");
  const [assignBedId, setAssignBedId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignBeds, setAssignBeds] = useState<RowRecord[]>([]);
  const [assignUsers, setAssignUsers] = useState<RowRecord[]>([]);
  const [buildingPositions, setBuildingPositions] = useState<Record<string, VisualPosition>>(() => readBuildingPositions());

  const context = useMemo<OptionContext>(
    () => ({
      campuses: toOptions(records.campus, ["name", "campusName"]),
      buildings: toOptions(records.building, ["name", "buildingName"]),
      floors: toOptions(records.floor, ["name", "floorName"]),
      rooms: toOptions(records.room, ["name", "roomName"]),
    }),
    [records],
  );

  const loadEntity = useCallback(
    async (key: EntityKey) => {
      if (!token) return;
      const config = entityConfigs[key];
      setLoading((current) => ({ ...current, [key]: true }));
      try {
        if ((key === "floor" && selected.building?.visualKind === "teaching") || (key === "room" && selected.floor?.visualKind === "teaching")) {
          setRecords((current) => ({ ...current, [key]: [] }));
          return;
        }
        const query: Record<string, unknown> = { current: 1, size: PAGE_SIZE };
        if (key === "building" && selected.campus?.id) query.campusId = selected.campus.id;
        if (key === "floor" && selected.building?.id) query.buildingId = selected.building.id;
        if (key === "room") {
          if (selected.building?.id) query.buildingId = selected.building.id;
          if (selected.floor?.id) query.floorId = selected.floor.id;
        }
        if (key === "bed" && selected.room?.id) query.roomId = selected.room.id;
        const result = await config.list(query, token);
        setRecords((current) => ({ ...current, [key]: result.records ?? [] }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `${config.title}加载失败`);
      } finally {
        setLoading((current) => ({ ...current, [key]: false }));
      }
    },
    [selected.bed?.id, selected.building?.id, selected.campus?.id, selected.floor?.id, selected.room?.id, token],
  );

  const loadAll = useCallback(async () => {
    await Promise.all(entityOrder.map((key) => loadEntity(key)));
  }, [loadEntity]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchDormitoryAssignBedList({ current: 1, size: 200 }, token),
      assignType === "student"
        ? fetchDormitoryStudentList({ current: 1, size: 200 }, token)
        : fetchDormitoryTeacherList({ current: 1, size: 200 }, token),
    ])
      .then(([bedResult, userResult]) => {
        setAssignBeds(bedResult.records ?? []);
        setAssignUsers(userResult.records ?? []);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "床位分配数据加载失败"));
  }, [assignType, token]);

  const stats = useMemo(
    () => ({
      campuses: records.campus.length,
      classrooms: records.classroom.length,
      buildings: records.building.length,
      beds: records.bed.length,
    }),
    [records],
  );

  const updateBuildingPosition = useCallback((id: string, position: VisualPosition) => {
    setBuildingPositions((current) => {
      const next = { ...current, [id]: position };
      persistBuildingPositions(next);
      return next;
    });
  }, []);

  const openCreate = (key: EntityKey) => {
    const targetKey = key === "floor" && selected.building?.visualKind === "teaching" ? "classroom" : key;
    const defaults = getCreateDefaults(targetKey, selected);
    if (targetKey === "classroom") defaults.name = suggestClassroomName(selected, records.classroom);
    setEditing({ key: targetKey, record: null, defaults });
  };

  const createTeachingBuilding = async () => {
    if (!token) return;
    if (!selected.campus?.id) {
      toast.error("请先选择校区，再新增教学大楼。");
      return;
    }
    try {
      const buildingName = nextTeachingBuildingName(records.classroom, selected);
      const classroomName = `${buildingName}-1层-101`;
      await createClassroom({ name: classroomName }, token);
      toast.success(`${buildingName}已创建，默认教室 ${classroomName}`);
      await loadEntity("classroom");
      setActiveKey("building");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "教学大楼创建失败");
    }
  };

  const handleSelectRecord = (key: EntityKey, record: RowRecord) => {
    let nextSelected: Partial<Record<EntityKey, RowRecord>> = {};
    setSelected((current) => {
      if (key === "campus") nextSelected = { ...current, campus: record, building: undefined, floor: undefined, room: undefined, bed: undefined };
      else if (key === "building") nextSelected = { ...current, building: record, floor: undefined, room: undefined, bed: undefined };
      else if (key === "floor") nextSelected = { ...current, floor: record, room: undefined, bed: undefined };
      else if (key === "room") nextSelected = { ...current, room: record, bed: undefined };
      else nextSelected = { ...current, [key]: record };
      return nextSelected;
    });

    const nextKey = nextKeyOf(key, nextSelected);
    if (nextKey) setActiveKey(nextKey);
  };

  const submitEntity = async (payload: Record<string, unknown>) => {
    if (!token || !editing) return;
    const config = entityConfigs[editing.key];
    const submitPayload =
      editing.key === "classroom" && !editing.record
        ? normalizeClassroomCreatePayload(payload, selected, records.classroom)
        : editing.key === "building"
          ? normalizeDormitoryBuildingPayload(payload, selected, schoolProfile.id)
          : payload;
    if (editing.record) {
      await config.update(submitPayload, token);
      toast.success(`${config.title}已更新`);
    } else {
      await config.create(submitPayload, token);
      toast.success(`${config.title}已新增`);
    }
    await loadEntity(editing.key);
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;
    const config = entityConfigs[deleteTarget.key];
    await config.remove(deleteTarget.record.id, token);
    toast.success(`${config.title}已删除`);
    setDeleteTarget(null);
    await loadEntity(deleteTarget.key);
  };

  const submitAssign = async () => {
    if (!token || !assignBedId || !assignUserId) {
      toast.error("请选择床位和分配对象");
      return;
    }
    await assignDormitoryBed({ bedId: assignBedId, userId: assignUserId, userType: assignType }, token);
    toast.success("床位已分配");
  };

  const cancelAssign = async () => {
    if (!token || !assignBedId) {
      toast.error("请选择床位");
      return;
    }
    await cancelAssignDormitoryBed({ bedId: assignBedId }, token);
    toast.success("已取消床位分配");
  };

  const activeConfig = entityConfigs[activeKey];
  const ActiveIcon = activeConfig.icon;
  const selectedCampusName = selected.campus ? displayName(selected.campus, ["name", "campusName"]) : "全部校区";
  const activeSelected = selected[activeKey];
  const nextActiveKey = nextKeyOf(activeKey, selected);
  const activeListRecords = useMemo(() => getSceneRecords(activeKey, records, selected), [activeKey, records, selected]);
  const createKey = activeKey === "floor" && selected.building?.visualKind === "teaching" ? "classroom" : activeKey;
  const createConfig = entityConfigs[createKey];

  return (
    <div className="space-y-4 pb-4 lg:space-y-5 lg:pb-5">
      <section className="rounded-[2rem] border border-[#ece8f8] bg-white px-5 py-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">校园空间管理</Badge>
            <Badge className="rounded-full border border-[#ece8f8] bg-white px-3 py-1 text-foreground hover:bg-white">操作即时调用接口</Badge>
            <Badge className="rounded-full border border-[#ece8f8] bg-white px-3 py-1 text-foreground hover:bg-white">校区 / 教室 / 宿舍</Badge>
          </div>
          <Button variant="outline" className="h-10 rounded-full border-[#ece8f8] bg-white" onClick={loadAll}>
            <RefreshCcw className="size-4" />
            刷新全部
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={School2} label="校区" value={String(stats.campuses)} hint="campus/list" />
        <MetricCard icon={DoorOpen} label="教室" value={String(stats.classrooms)} hint="classroom/list" />
        <MetricCard icon={Building2} label="宿舍楼" value={String(stats.buildings)} hint="building/list" />
        <MetricCard icon={BedDouble} label="床位" value={String(stats.beds)} hint="bed/list" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.34fr_0.66fr]">
        <PanelCard className="space-y-4">
          <SectionHeading title="管理模块" description="选择模块后，在右侧进行单项新增、编辑或删除。" />
          <div className="grid gap-2">
            {entityOrder.map((key) => {
              const config = entityConfigs[key];
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveKey(key)}
                  className={cn(
                    "flex items-center justify-between rounded-[1.2rem] border px-4 py-3 text-left transition-all",
                    activeKey === key ? "border-primary/25 bg-primary/10 text-primary" : "border-[#eef0f8] bg-white hover:bg-[#fbfaff]",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4" />
                    <span className="font-medium">{config.title}</span>
                  </span>
                  <span className="text-xs">{getSceneRecords(key, records, selected).length}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-[1.5rem] border border-[#eef0f8] bg-[#fcfcfe] p-4">
            <p className="mb-3 text-sm font-medium text-foreground">当前筛选链路</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>校区：{selected.campus ? displayName(selected.campus, ["name", "campusName"]) : "未选择"}</p>
              <p>宿舍楼：{selected.building ? displayName(selected.building, ["name", "buildingName"]) : "未选择"}</p>
              <p>楼层：{selected.floor ? displayName(selected.floor, ["name", "floorName"]) : "未选择"}</p>
              <p>房间：{selected.room ? displayName(selected.room, ["name", "roomName"]) : "未选择"}</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#eef0f8] bg-[linear-gradient(135deg,#ffffff,#f8f5ff)] p-4">
            <p className="text-sm font-medium text-foreground">校区快捷创建</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">选中校区后，可分别创建真实宿舍大楼，或通过默认教室名生成教学大楼。</p>
            <div className="mt-3 grid gap-2">
              <Button
                type="button"
                variant="outline"
                className="justify-start rounded-2xl border-[#e8e4f3] bg-white/90"
                disabled={!selected.campus}
                onClick={() => {
                  setActiveKey("building");
                  openCreate("building");
                }}
              >
                <Building2 className="size-4" />
                新增宿舍大楼
              </Button>
              <Button
                type="button"
                className="justify-start rounded-2xl"
                disabled={!selected.campus}
                onClick={() => void createTeachingBuilding()}
              >
                <DoorOpen className="size-4" />
                新增教学大楼
              </Button>
            </div>
          </div>
        </PanelCard>

        <PanelCard className="overflow-hidden p-0">
          <div className="border-b border-[#eeeaf7] px-5 py-5">
            <SectionHeading
              title="模拟 3D 校区画布"
              description="点击宿舍楼模型选择对象，楼层、房间、床位会按所选对象继续筛选。"
              action={
                <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">{selectedCampusName}</Badge>
              }
            />
          </div>
          <div className="grid gap-4 p-5 2xl:grid-cols-[1fr_0.32fr]">
            <div className="rounded-[1.8rem] border border-[#eef0f8] bg-gradient-to-br from-[#f8f6ff] via-white to-[#f2fbff] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-white px-3 py-1">3D 视图来自当前模块接口组合</span>
                <span className="rounded-full bg-white px-3 py-1">当前模块：{activeConfig.title}</span>
                <span className="rounded-full bg-white px-3 py-1">{selectionLabel(activeKey, selected)}</span>
              </div>
              <CampusScene
                activeKey={activeKey}
                records={records}
                selected={selected}
                loading={loading}
                buildingPositions={buildingPositions}
                onSelect={handleSelectRecord}
                onBuildingPositionChange={updateBuildingPosition}
              />
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-[#eef0f8] bg-[#fcfcfe] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ActiveIcon className="size-4 text-primary" />
                  当前 3D 对象
                </div>
                {activeSelected ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-lg font-semibold text-foreground">{displayName(activeSelected, ["name", "campusName", "classroomName", "buildingName", "floorName", "roomName", "bedName"])}</p>
                    <p className="text-xs text-muted-foreground">ID {activeSelected.id}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <button type="button" className="rounded-[1rem] bg-white p-3 text-left" onClick={() => openCreate(activeKey)}>
                        <p className="text-xs text-muted-foreground">快速新增</p>
                        <p className="mt-1 font-semibold text-foreground">{createConfig.title}</p>
                      </button>
                      <button type="button" className="rounded-[1rem] bg-white p-3 text-left" onClick={() => nextActiveKey && setActiveKey(nextActiveKey)} disabled={!nextActiveKey}>
                        <p className="text-xs text-muted-foreground">下一层级</p>
                        <p className="mt-1 font-semibold text-foreground">{nextActiveKey ? entityConfigs[nextActiveKey].title : "已到底"}</p>
                      </button>
                      <button type="button" className="col-span-2 rounded-[1rem] bg-white p-3 text-left" onClick={() => loadEntity(activeKey)}>
                        <p className="text-xs text-muted-foreground">接口数据</p>
                        <p className="mt-1 font-semibold text-foreground">{activeListRecords.length} 条</p>
                      </button>
                    </div>
                    {activeSelected.synthetic === true ? (
                      <div className="rounded-[1rem] bg-primary/10 px-3 py-2 text-xs leading-5 text-primary">
                        该对象由教室名称自动合成，请进入下级教室列表修改具体教室。
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 rounded-full" onClick={() => setEditing({ key: activeKey, record: activeSelected })}>
                          <Edit3 className="size-4" />
                          编辑
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-full border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" onClick={() => setDeleteTarget({ key: activeKey, record: activeSelected })}>
                          <Trash2 className="size-4" />
                          删除
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">点击画布中的{activeConfig.title}模型即可选中。新增时会自动带入当前筛选链路。</p>
                    <Button className="w-full rounded-full" onClick={() => openCreate(activeKey)}>
                      <Plus className="size-4" />
                      新增{createConfig.title}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PanelCard>
      </section>

      <PanelCard className="p-0">
        <div className="border-b border-[#eeeaf7] px-5 py-5">
          <SectionHeading
            title={`${activeConfig.title}列表`}
            description="新增、编辑、删除都会直接调用当前模块接口。"
            action={
              <Button className="rounded-full" onClick={() => openCreate(activeKey)}>
                <Plus className="size-4" />
                新增{createConfig.title}
              </Button>
            }
          />
        </div>
        <EntityTable
          config={activeConfig}
          records={activeListRecords}
          loading={loading[activeKey]}
          active={selected[activeKey]?.id}
          onSelect={(record) => handleSelectRecord(activeKey, record)}
          onEdit={(record) => setEditing({ key: activeKey, record })}
          onDelete={(record) => setDeleteTarget({ key: activeKey, record })}
        />
      </PanelCard>

      <PanelCard>
        <SectionHeading title="宿舍床位分配" description="选择床位与学生/老师后直接调用分配或取消接口。" />
        <div className="grid gap-3 md:grid-cols-[0.7fr_0.7fr_0.7fr_auto_auto] md:items-end">
          <div className="space-y-2">
            <Label>分配类型</Label>
            <CinematicSelect
              value={assignType}
              onValueChange={(value) => setAssignType(value as DormUserType)}
              options={[
                { value: "student", label: "学生" },
                { value: "teacher", label: "老师" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>床位</Label>
            <CinematicSelect value={assignBedId} onValueChange={setAssignBedId} options={toOptions(assignBeds, ["name", "bedName", "roomName"])} placeholder="选择床位" />
          </div>
          <div className="space-y-2">
            <Label>{assignType === "student" ? "学生" : "老师"}</Label>
            <CinematicSelect value={assignUserId} onValueChange={setAssignUserId} options={toOptions(assignUsers, ["realname", "name", "nickname", "mobile"])} placeholder="选择用户" />
          </div>
          <Button className="h-11 rounded-xl" onClick={submitAssign}>
            分配床位
          </Button>
          <Button variant="outline" className="h-11 rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" onClick={cancelAssign}>
            取消分配
          </Button>
        </div>
      </PanelCard>

      {editing ? (
        <EntityDialog
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          config={entityConfigs[editing.key]}
          context={context}
          record={editing.record}
          defaults={editing.defaults}
          onSubmit={submitEntity}
        />
      ) : null}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除该{deleteTarget ? entityConfigs[deleteTarget.key].title : "记录"}，此操作会立即调用删除接口。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-700" onClick={confirmDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
