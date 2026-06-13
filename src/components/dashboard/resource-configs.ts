import type { ResourceModuleConfig } from "@/components/dashboard/resource-manager";

function createTextbookModule(config: ResourceModuleConfig) {
  return config;
}

export const theoryModuleConfig = createTextbookModule({
  title: "乐理管理",
  description: "统一维护乐理教材、章节讲义、专项练习与音乐常识内容，支持图文、作业图和答案图的完整编辑。",
  eyebrow: "教材资源",
  listLabel: "乐理资源列表",
  categoryLabel: "所属分类",
  type: 2,
  firstMenuOptions: [
    { label: "章节讲义", value: "5" },
    { label: "专项练习", value: "6" },
    { label: "音乐常识", value: "7" },
  ],
  features: {
    seriesTitle: true,
    image1: true,
    image2: true,
    richText: true,
  },
  image1Label: "作业图",
  image2Label: "答案图",
  listPath: "/school/yl-textbook/list",
  createPath: "/school/yl-textbook/save",
  updatePath: "/school/yl-textbook/update",
  deletePath: "/school/yl-textbook/delete",
});

export const dictationModuleConfig = createTextbookModule({
  title: "听写管理",
  description: "整理听写训练素材，支持标题、分类、音频、五线谱图与补充副标题的统一维护。",
  eyebrow: "听写素材",
  listLabel: "听写资源列表",
  categoryLabel: "所属分类",
  type: 3,
  firstMenuOptions: [
    { label: "单音", value: "8" },
    { label: "音组", value: "9" },
    { label: "音程", value: "10" },
    { label: "和弦", value: "11" },
    { label: "节奏", value: "12" },
    { label: "旋律", value: "13" },
  ],
  secondMenuOptions: {
    "12": [
      { label: "四分音符为单位拍", value: "14" },
      { label: "八分音符为单位拍", value: "15" },
    ],
  },
  features: {
    subtitle: true,
    secondCategory: true,
    seriesTitle: true,
    audio: true,
    image1: true,
  },
  image1Label: "五线谱",
  audioLabel: "音频文件",
  listPath: "/school/tx-textbook/list",
  createPath: "/school/tx-textbook/save",
  updatePath: "/school/tx-textbook/update",
  deletePath: "/school/tx-textbook/delete",
});

export const sightSingingModuleConfig = createTextbookModule({
  title: "视唱管理",
  description: "整理视唱训练素材，支持标题、分类、音频、五线谱图与补充副标题的统一维护。",
  eyebrow: "视唱素材",
  listLabel: "视唱资源列表",
  categoryLabel: "所属分类",
  type: 7,
  firstMenuOptions: [
    { label: "单音", value: "8" },
    { label: "音组", value: "9" },
    { label: "音程", value: "10" },
    { label: "和弦", value: "11" },
    { label: "节奏", value: "12" },
    { label: "旋律", value: "13" },
  ],
  secondMenuOptions: {
    "12": [
      { label: "四分音符为单位拍", value: "14" },
      { label: "八分音符为单位拍", value: "15" },
    ],
  },
  features: {
    subtitle: true,
    secondCategory: true,
    seriesTitle: true,
    audio: true,
    image1: true,
  },
  image1Label: "五线谱",
  audioLabel: "音频文件",
  listPath: "/school/sc-textbook/list",
  createPath: "/school/sc-textbook/save",
  updatePath: "/school/sc-textbook/update",
  deletePath: "/school/sc-textbook/delete",
});

export const instrumentalModuleConfig = createTextbookModule({
  title: "器乐管理",
  description: "为器乐内容维护图文、音频、五线谱与简谱资源，适合做完整的器乐教材与示范内容沉淀。",
  eyebrow: "器乐素材",
  listLabel: "器乐资源列表",
  categoryLabel: "所属分类",
  type: 5,
  firstMenuOptions: [
    { label: "中国乐器", value: "20" },
    { label: "西洋乐器", value: "21" },
    { label: "键盘", value: "22" },
    { label: "打击乐", value: "23" },
  ],
  features: {
    seriesTitle: true,
    audio: true,
    image1: true,
    image2: true,
    richText: true,
  },
  image1Label: "五线谱",
  image2Label: "简谱",
  audioLabel: "音频文件",
  listPath: "/school/qy-textbook/list",
  createPath: "/school/qy-textbook/save",
  updatePath: "/school/qy-textbook/update",
  deletePath: "/school/qy-textbook/delete",
});

export const vocalModuleConfig = createTextbookModule({
  title: "声乐管理",
  description: "集中管理声乐作品与训练内容，支持副标题、系列标题、音频、谱面图和详情文案。",
  eyebrow: "声乐素材",
  listLabel: "声乐资源列表",
  categoryLabel: "所属分类",
  type: 4,
  firstMenuOptions: [
    { label: "中国作品", value: "16" },
    { label: "外国作品", value: "17" },
    { label: "外国作品语言范读", value: "18" },
    { label: "自主练声", value: "19" },
  ],
  features: {
    subtitle: true,
    seriesTitle: true,
    audio: true,
    image1: true,
    image2: true,
    richText: true,
  },
  image1Label: "五线谱",
  image2Label: "简谱",
  audioLabel: "音频文件",
  listPath: "/school/sy-textbook/list",
  createPath: "/school/sy-textbook/save",
  updatePath: "/school/sy-textbook/update",
  deletePath: "/school/sy-textbook/delete",
});

export const answerModuleConfig = createTextbookModule({
  title: "答题管理",
  description: "管理题库与配套音频素材，支持按学科与题型分类，统一上传答案图与题目详情。",
  eyebrow: "题库资源",
  listLabel: "题库资源列表",
  categoryLabel: "所属分类",
  type: 10,
  firstMenuOptions: [
    { label: "乐理", value: "62" },
    { label: "听写", value: "63" },
    { label: "视唱", value: "64" },
  ],
  secondMenuOptions: {
    "62": [
      { label: "阶段测试题", value: "65" },
      { label: "模拟试题", value: "66" },
      { label: "冲刺试题", value: "67" },
      { label: "历年真题", value: "68" },
    ],
    "63": [
      { label: "阶段测试题", value: "65" },
      { label: "模拟试题", value: "66" },
      { label: "冲刺试题", value: "67" },
      { label: "历年真题", value: "68" },
    ],
  },
  features: {
    secondCategory: true,
    audio: true,
    image1: true,
    richText: true,
  },
  image1Label: "答案图",
  audioLabel: "配套音频",
  listPath: "/school/dt-textbook/list",
  createPath: "/school/dt-textbook/save",
  updatePath: "/school/dt-textbook/update",
  deletePath: "/school/dt-textbook/delete",
});
