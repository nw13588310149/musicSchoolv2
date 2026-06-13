"use client";

import type {
  ExamClassRecord,
  ExamRecord,
  MenuNode,
  NamedOption,
  PaginatedResult,
  RealNameRecord,
  ResourceRecord,
  SchoolCampusRecord,
  SchoolBannerRecord,
  SchoolClassroomRecord,
  SchoolDormitoryBuildingRecord,
  SchoolDormitoryBedRecord,
  SchoolDormitoryFloorRecord,
  SchoolDormitoryRoomRecord,
  SchoolManagerRecord,
  SchoolNewsRecord,
  SchoolStudentRecord,
  SchoolSubjectRecord,
  SchoolTeacherRecord,
  SchoolUserAuditRecord,
  SchoolCourseTimeRecord,
  VideoSeriesRecord,
  VideoTutorialRecord,
} from "@/lib/api/contracts";
import { apiPost, apiPostFormData, apiPostRaw, getApiBaseUrl, uploadFile } from "@/lib/api/client";

type PageQuery = Record<string, unknown> & {
  current?: number;
  size?: number;
};

function toNumber(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeNamedOptions(payload: unknown): NamedOption[] {
  if (!Array.isArray(payload)) return [];

  const normalized: NamedOption[] = [];

  payload.forEach((item, index) => {
    if (typeof item === "string" || typeof item === "number") {
      normalized.push({
        id: String(item),
        name: String(item),
      });
      return;
    }

    if (!item || typeof item !== "object") return;

    const record = item as Record<string, unknown>;
    normalized.push({
      id: (record.id ?? record.value ?? record.name ?? index) as string | number,
      name: String(record.name ?? record.label ?? record.title ?? record.value ?? `选项 ${index + 1}`),
    });
  });

  return normalized;
}

function normalizeMenuTree(payload: unknown): MenuNode[] {
  if (!Array.isArray(payload)) return [];

  const normalized: MenuNode[] = [];

  payload.forEach((item, index) => {
    if (!item || typeof item !== "object") return;

    const record = item as Record<string, unknown>;
    normalized.push({
      id: (record.id ?? record.value ?? index) as string | number,
      name: String(record.name ?? record.label ?? record.title ?? `分类 ${index + 1}`),
      children: normalizeMenuTree(record.children),
    });
  });

  return normalized;
}

function normalizeListPayload<T>(payload: unknown, query: PageQuery): PaginatedResult<T> {
  const source = Array.isArray(payload) ? { records: payload } : ((payload ?? {}) as Record<string, unknown>);
  const records = Array.isArray(source.records)
    ? (source.records as T[])
    : Array.isArray(source.items)
      ? (source.items as T[])
      : [];
  const total = toNumber(source.total, records.length);
  const current = toNumber(source.current ?? query.current, Number(query.current ?? 1));
  const size = toNumber(source.size ?? query.size, Number(query.size ?? Math.max(records.length, 1)));
  const pages = toNumber(source.pages, Math.max(1, Math.ceil(total / Math.max(size, 1))));

  return {
    code: 0,
    records,
    total,
    current,
    size,
    pages,
  };
}

async function listRequest<T>(path: string, query: PageQuery, token: string) {
  const payload = await apiPost<unknown>(path, query, token);
  return normalizeListPayload<T>(payload, query);
}

function mutationRequest(path: string, payload: Record<string, unknown>, token: string) {
  return apiPostRaw(path, payload, token);
}

export function uploadSchoolAsset(file: File, token: string) {
  return uploadFile(file, token);
}

export function getExamExportUrl(examId: string | number, token: string) {
  const base = getApiBaseUrl();
  return `${base}/school/exam/exportTemplate?examId=${examId}&token=${token}`;
}

export function fetchRealNameList(query: PageQuery, token: string) {
  return listRequest<RealNameRecord>("/school/user-verify/list", query, token);
}

export function reviewRealName(payload: { id: string | number; reviewStatus: number; reason?: string }, token: string) {
  return mutationRequest("/school/user-verify/review", { schoolId: 0, reason: "", ...payload }, token);
}

export function fetchUserAuditList(query: PageQuery, token: string) {
  return listRequest<SchoolUserAuditRecord>("/school/v2/user/list", query, token);
}

export function fetchUserAuditDetail(id: string | number, token: string) {
  return apiPost<SchoolUserAuditRecord>("/school/v2/user/detail", { id }, token);
}

export function auditSchoolUsers(
  payload: { ids: Array<string | number>; reason?: string; role: "student" | "teacher" | string; status: number },
  token: string,
) {
  return mutationRequest(
    "/school/v2/user/audit",
    {
      reason: payload.status === 1 ? (payload.reason || "ok") : (payload.reason ?? ""),
      ...payload,
    },
    token,
  );
}

export function fetchCourseScheduleList(query: PageQuery, token: string) {
  return listRequest<SchoolCourseTimeRecord>("/school/school-course-time-config/list", query, token);
}

export function fetchSubjectList(query: PageQuery, token: string) {
  return listRequest<SchoolSubjectRecord>("/school/subject/list", query, token);
}

export function fetchManagerList(query: PageQuery, token: string) {
  return listRequest<SchoolManagerRecord>("/school/v2/manger/list", query, token);
}

export function fetchManagerDetail(id: string | number, token: string) {
  return apiPost<SchoolManagerRecord>("/school/v2/manger/detail", { id }, token);
}

export function createManager(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/manger/save", payload, token);
}

export function updateManager(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/manger/update", payload, token);
}

export function fetchBannerList(query: PageQuery, token: string) {
  return listRequest<SchoolBannerRecord>("/school/v2/banner/list", query, token);
}

export function fetchBannerDetail(id: string | number, token: string) {
  return apiPost<SchoolBannerRecord>("/school/v2/banner/detail", { id }, token);
}

export function createBanner(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/banner/save", payload, token);
}

export function updateBanner(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/banner/update", payload, token);
}

export async function deleteBanner(id: string | number, token: string) {
  try {
    return await mutationRequest("/school/v2/banner/delete", { id: [id] }, token);
  } catch {
    return mutationRequest("/school/v2/banner/delete", { id }, token);
  }
}

export function fetchNewsList(query: PageQuery, token: string) {
  return listRequest<SchoolNewsRecord>("/school/zx-textbook/list", query, token);
}

export function fetchNewsDetail(id: string | number, token: string) {
  return apiPost<SchoolNewsRecord>("/school/zx-textbook/detail", { id }, token);
}

export function createNews(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/zx-textbook/save", payload, token);
}

export function updateNews(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/zx-textbook/update", payload, token);
}

export function deleteNews(id: string | number, token: string) {
  return mutationRequest("/school/zx-textbook/delete", { id: [id] }, token);
}

export function fetchCampusList(query: PageQuery, token: string) {
  return listRequest<SchoolCampusRecord>("/school/v2/campus/list", query, token);
}

export function fetchCampusDetail(id: string | number, token: string) {
  return apiPost<SchoolCampusRecord>("/school/v2/campus/detail", { id }, token);
}

export function createCampus(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/campus/save", payload, token);
}

export function updateCampus(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/campus/update", payload, token);
}

export function deleteCampus(id: string | number, token: string) {
  return mutationRequest("/school/v2/campus/delete", { id: [id] }, token);
}

export function fetchClassroomList(query: PageQuery, token: string) {
  return listRequest<SchoolClassroomRecord>("/school/v2/classroom/list", query, token);
}

export function fetchClassroomDetail(id: string | number, token: string) {
  return apiPost<SchoolClassroomRecord>("/school/v2/classroom/detail", { id }, token);
}

export function createClassroom(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/classroom/save", payload, token);
}

export function updateClassroom(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/classroom/update", payload, token);
}

export function deleteClassroom(id: string | number, token: string) {
  return mutationRequest("/school/v2/classroom/delete", { id }, token);
}

export function fetchDormitoryBuildingList(query: PageQuery, token: string) {
  return listRequest<SchoolDormitoryBuildingRecord>("/school/v2/dormitory/building/list", query, token);
}

export function fetchDormitoryBuildingDetail(id: string | number, token: string) {
  return apiPost<SchoolDormitoryBuildingRecord>("/school/v2/dormitory/building/detail", { id }, token);
}

export function createDormitoryBuilding(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/building/save", payload, token);
}

export function updateDormitoryBuilding(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/building/update", payload, token);
}

export function deleteDormitoryBuilding(id: string | number, token: string) {
  return mutationRequest("/school/v2/dormitory/building/delete", { id }, token);
}

export function fetchDormitoryFloorList(query: PageQuery, token: string) {
  return listRequest<SchoolDormitoryFloorRecord>("/school/v2/dormitory/floor/list", query, token);
}

export function fetchDormitoryFloorDetail(id: string | number, token: string) {
  return apiPost<SchoolDormitoryFloorRecord>("/school/v2/dormitory/floor/detail", { id }, token);
}

export function createDormitoryFloor(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/floor/save", payload, token);
}

export function updateDormitoryFloor(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/floor/update", payload, token);
}

export function deleteDormitoryFloor(id: string | number, token: string) {
  return mutationRequest("/school/v2/dormitory/floor/delete", { id }, token);
}

export function fetchDormitoryRoomList(query: PageQuery, token: string) {
  return listRequest<SchoolDormitoryRoomRecord>("/school/v2/dormitory/room/list", query, token);
}

export function fetchDormitoryRoomDetail(id: string | number, token: string) {
  return apiPost<SchoolDormitoryRoomRecord>("/school/v2/dormitory/room/detail", { id }, token);
}

export function createDormitoryRoom(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/room/save", payload, token);
}

export function updateDormitoryRoom(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/room/update", payload, token);
}

export function deleteDormitoryRoom(id: string | number, token: string) {
  return mutationRequest("/school/v2/dormitory/room/delete", { id }, token);
}

export function fetchDormitoryBedList(query: PageQuery, token: string) {
  return listRequest<SchoolDormitoryBedRecord>("/school/v2/dormitory/bed/list", query, token);
}

export function fetchDormitoryBedDetail(id: string | number, token: string) {
  return apiPost<SchoolDormitoryBedRecord>("/school/v2/dormitory/bed/detail", { id }, token);
}

export function createDormitoryBed(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/bed/save", payload, token);
}

export function updateDormitoryBed(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/bed/update", payload, token);
}

export function deleteDormitoryBed(id: string | number, token: string) {
  return mutationRequest("/school/v2/dormitory/bed/delete", { id }, token);
}

export function fetchDormitoryAssignBedList(query: PageQuery, token: string) {
  return listRequest<SchoolDormitoryBedRecord>("/school/v2/dormitory/user/bedList", query, token);
}

export function fetchDormitoryStudentList(query: PageQuery, token: string) {
  return listRequest<SchoolStudentRecord>("/school/v2/dormitory/user/studentList", query, token);
}

export function fetchDormitoryTeacherList(query: PageQuery, token: string) {
  return listRequest<SchoolTeacherRecord>("/school/v2/dormitory/user/teacherList", query, token);
}

export function assignDormitoryBed(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/user/assignBed", payload, token);
}

export function cancelAssignDormitoryBed(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/v2/dormitory/user/cancelAssignBed", payload, token);
}

export function fetchSubjectDetail(id: string | number, token: string) {
  return apiPost<SchoolSubjectRecord>("/school/subject/detail", { id }, token);
}

export function createSubject(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/subject/save", payload, token);
}

export function updateSubject(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/subject/update", payload, token);
}

export function fetchTeacherList(query: PageQuery, token: string) {
  return listRequest<SchoolTeacherRecord>("/school/teacher/list", query, token);
}

export function fetchTeacherDetail(id: string | number, token: string) {
  return apiPost<SchoolTeacherRecord>("/school/teacher/detail", { id }, token);
}

export function updateTeacher(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/teacher/update", payload, token);
}

export function updateTeacherStatus(payload: { id: string | number; status: number }, token: string) {
  return mutationRequest("/school/teacher/updateStatus", payload, token);
}

export function fetchStudentList(query: PageQuery, token: string) {
  return listRequest<SchoolStudentRecord>("/school/student/list", query, token);
}

export function fetchStudentDetail(id: string | number, token: string) {
  return apiPost<SchoolStudentRecord>("/school/student/detail", { id }, token);
}

export function updateStudent(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/student/update", payload, token);
}

export function updateStudentStatus(payload: { id: string | number; status: number }, token: string) {
  return mutationRequest("/school/student/updateStatus", payload, token);
}

export function createCourseSchedule(payload: Partial<SchoolCourseTimeRecord>, token: string) {
  return mutationRequest("/school/school-course-time-config/save", payload, token);
}

export function updateCourseSchedule(payload: Partial<SchoolCourseTimeRecord>, token: string) {
  return mutationRequest("/school/school-course-time-config/update", payload, token);
}

export function deleteCourseSchedule(id: string | number, token: string) {
  return mutationRequest("/school/school-course-time-config/delete", { id: [id] }, token);
}

export function fetchExamList(query: PageQuery, token: string) {
  return listRequest<ExamRecord>("/school/exam/list", query, token);
}

export function createExam(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/exam/save", payload, token);
}

export function updateExam(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/exam/update", payload, token);
}

export function deleteExam(id: string | number, token: string) {
  return mutationRequest("/school/exam/delete", { id: [id] }, token);
}

export function fetchExamSubjects(token: string) {
  return apiPost<unknown[]>("/school/exam/subjectList", {}, token).then((payload) => normalizeNamedOptions(payload));
}

export function fetchExamClasses(token: string) {
  return apiPost<unknown[]>("/school/exam/classList", {}, token).then(
    (payload) => normalizeNamedOptions(payload) as ExamClassRecord[],
  );
}

export function importExamScores(examId: string | number, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("examId", String(examId));
  return apiPostFormData("/school/exam/importData", formData, token);
}

export function fetchResourceList(path: string, query: PageQuery, token: string) {
  return listRequest<ResourceRecord>(path, query, token);
}

export function createResource(path: string, payload: Record<string, unknown>, token: string) {
  return mutationRequest(path, payload, token);
}

export function updateResource(path: string, payload: Record<string, unknown>, token: string) {
  return mutationRequest(path, payload, token);
}

export function deleteResource(path: string, id: string | number, token: string) {
  return mutationRequest(path, { id: [id] }, token);
}

export function fetchVideoSeriesList(query: PageQuery, token: string) {
  return listRequest<VideoSeriesRecord>("/school/app-video-series/list", query, token);
}

export function createVideoSeries(payload: { name: string }, token: string) {
  return mutationRequest("/school/app-video-series/save", payload, token);
}

export function updateVideoSeries(payload: { id: string | number; name: string }, token: string) {
  return mutationRequest("/school/app-video-series/update", payload, token);
}

export function deleteVideoSeries(id: string | number, token: string) {
  return mutationRequest("/school/app-video-series/delete", { id: [id] }, token);
}

export function fetchVideoTutorialList(query: PageQuery, token: string) {
  return listRequest<VideoTutorialRecord>("/school/app-video-tutorial/list", query, token);
}

export function createVideoTutorial(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/app-video-tutorial/save", payload, token);
}

export function updateVideoTutorial(payload: Record<string, unknown>, token: string) {
  return mutationRequest("/school/app-video-tutorial/update", payload, token);
}

export function deleteVideoTutorial(id: string | number, token: string) {
  return mutationRequest("/school/app-video-tutorial/delete", { id: [id] }, token);
}

export function fetchVideoMenuTree(token: string) {
  return apiPost<unknown[]>("/school/common/menuList", { type: 6 }, token).then((payload) => normalizeMenuTree(payload));
}
