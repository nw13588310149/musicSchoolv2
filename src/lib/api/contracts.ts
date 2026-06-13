export interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
  [key: string]: unknown;
}

export interface LegacyApiResponse {
  code: number;
  msg?: string;
  message?: string;
  [key: string]: unknown;
}

export interface PaginatedResult<T> extends LegacyApiResponse {
  records: T[];
  total: number;
  current?: number;
  size?: number;
  pages?: number;
}

export interface RoleInfo {
  roleName?: string;
  value: string;
}

export interface LoginPayload {
  loginUser: string;
  loginPwd: string;
}

export interface LoginResponse {
  userId: string | number;
  token: string;
  roles?: RoleInfo[];
}

export interface SchoolProfile {
  id?: string | number;
  name?: string;
  contact?: string;
  loginUser?: string;
  logo?: string;
  coursewareSwitch?: boolean | number;
  homepage?: string;
  [key: string]: unknown;
}

export interface UserProfile {
  userId?: string | number;
  username?: string;
  realName?: string;
  avatar?: string;
  roles?: RoleInfo[];
  school?: SchoolProfile;
  user?: SchoolManagerRecord;
  homePath?: string;
  [key: string]: unknown;
}

export interface UploadResponse {
  code: number;
  message?: string;
  msg?: string;
  url?: string;
  data?: {
    url?: string;
    [key: string]: unknown;
  };
}

export interface NamedOption {
  id: string | number;
  name: string;
}

export interface MenuNode extends NamedOption {
  children?: MenuNode[];
}

export interface SchoolUserInfo {
  nickname?: string;
  mobile?: string;
  gender?: string;
  headUrl?: string;
  [key: string]: unknown;
}

export interface RealNameRecord {
  id: string | number;
  realname?: string;
  idcard?: string;
  portraitImg?: string;
  nationalImg?: string;
  reviewStatus?: number;
  role?: "student" | "teacher" | string;
  school?: string;
  user?: SchoolUserInfo;
  [key: string]: unknown;
}

export interface SchoolUserAuditRecord {
  id: string | number;
  archiveId?: number;
  createTime?: string;
  deleteTime?: number;
  reason?: string;
  schoolId?: string | number;
  status?: number;
  userId?: string | number;
  role?: "student" | "teacher" | string;
  user?: SchoolUserInfo;
  realname?: string;
  realName?: string;
  nickname?: string;
  mobile?: string;
  [key: string]: unknown;
}

export interface SchoolCourseTimeRecord {
  id: string | number;
  lineNum: number | string;
  timeBegin: string;
  timeEnd: string;
  [key: string]: unknown;
}

export interface ExamClassRecord extends NamedOption {}

export interface ExamRecord {
  id: string | number;
  name: string;
  subjects?: string | string[];
  classIds?: string | number[] | string[];
  classList?: ExamClassRecord[];
  createTime?: string;
  status?: number;
  [key: string]: unknown;
}

export interface ResourceRecord {
  id: string | number;
  title: string;
  shortText1?: string;
  shortText2?: string;
  firstMenu?: string | number;
  secondMenu?: string | number;
  longText1?: string;
  file1?: string | string[];
  img1?: string | string[];
  img2?: string | string[];
  vip?: number;
  updateTime?: string;
  [key: string]: unknown;
}

export interface VideoSeriesRecord {
  id: string | number;
  name: string;
  createTime?: string;
  [key: string]: unknown;
}

export interface VideoTutorialRecord {
  id: string | number;
  name: string;
  coverImg?: string;
  url?: string;
  param1?: string | string[];
  param2?: string | string[];
  param3?: string;
  firstMenu?: string | number;
  firstMenuName?: string;
  secondMenu?: string | number;
  secondMenuName?: string;
  seriesId?: string | number;
  vip?: number;
  showIndex?: number;
  duration?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolSubjectRecord {
  id: string | number;
  name?: string;
  title?: string;
  subjectName?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolCampusRecord {
  id: string | number;
  name?: string;
  campusName?: string;
  schoolId?: string | number;
  status?: number;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolDormitoryBuildingRecord {
  id: string | number;
  name?: string;
  buildingName?: string;
  schoolId?: string | number;
  campusId?: string | number;
  status?: number;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolClassroomRecord {
  id: string | number;
  name?: string;
  classroomName?: string;
  campusId?: string | number;
  campusName?: string;
  capacity?: number | string;
  status?: number;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolDormitoryFloorRecord {
  id: string | number;
  name?: string;
  floorName?: string;
  buildingId?: string | number;
  buildingName?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolDormitoryRoomRecord {
  id: string | number;
  name?: string;
  roomName?: string;
  buildingId?: string | number;
  floorId?: string | number;
  floorName?: string;
  capacity?: number | string;
  gender?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolDormitoryBedRecord {
  id: string | number;
  name?: string;
  bedName?: string;
  roomId?: string | number;
  roomName?: string;
  status?: number;
  userId?: string | number;
  userName?: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolManagerRecord {
  id: string | number;
  loginUser?: string;
  loginPwd?: string;
  nickname?: string;
  permissions?: string;
  enableStatus?: number;
  isSuperAdmin?: number;
  schoolId?: string | number;
  createTime?: string;
  [key: string]: unknown;
}

export interface SchoolBannerRecord {
  id: string | number;
  title?: string;
  img?: string | string[];
  image?: string | string[];
  imageUrl?: string | string[];
  bannerUrl?: string | string[];
  url?: string;
  param1?: string;
  param2?: string;
  param3?: string;
  contentType?: number | string;
  type?: number | string;
  sort?: number | string;
  status?: number | boolean;
  provinces?: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolNewsRecord {
  id: string | number;
  file1?: string | string[];
  file2?: string | string[];
  file3?: string | string[];
  firstMenu?: number | string;
  img1?: string | string[];
  img2?: string | string[];
  img3?: string | string[];
  longText1?: string;
  longText2?: string;
  longText3?: string;
  provinces?: string;
  secondMenu?: number | string;
  shortText1?: string;
  shortText2?: string;
  shortText3?: string;
  sort?: number | string;
  status?: boolean | number;
  subTitle?: string;
  subType?: number | string;
  title?: string;
  type?: number | string;
  vip?: number | string;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SchoolTeacherRecord {
  id: string | number;
  name?: string;
  realname?: string;
  nickname?: string;
  mobile?: string;
  phone?: string;
  status?: number;
  gender?: string | number;
  no?: string;
  teacherStatus?: string;
  roles?: string | null;
  subjectNames?: string | null;
  subjetIds?: string | null;
  schoolCampusName?: string | null;
  campusId?: string | number;
  subjectName?: string;
  subjects?: string | string[];
  createTime?: string;
  updateTime?: string;
  user?: SchoolUserInfo;
  [key: string]: unknown;
}

export interface SchoolStudentRecord {
  id: string | number;
  name?: string;
  realname?: string;
  nickname?: string;
  mobile?: string;
  phone?: string;
  status?: number;
  gender?: string | number;
  no?: string;
  studentStatus?: string;
  campusId?: string | number;
  schoolCampusName?: string | null;
  studentNo?: string;
  studentNumber?: string;
  className?: string;
  createTime?: string;
  updateTime?: string;
  user?: SchoolUserInfo;
  [key: string]: unknown;
}
