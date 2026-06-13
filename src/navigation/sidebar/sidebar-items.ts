import {
  BadgeInfo,
  Calendar,
  ClipboardList,
  Disc3,
  ListChecks,
  FileText,
  Globe,
  Headphones,
  Image,
  LayoutGrid,
  Music4,
  Newspaper,
  Settings2,
  type LucideIcon,
  Mic2,
  ShieldCheck,
  Users2,
  Video,
} from "lucide-react";

export interface SidebarSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string | string[];
}

export interface SidebarPrimarySection {
  title: string;
  icon: LucideIcon;
  items: SidebarSubItem[];
}

export interface SidebarLinkItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string | string[];
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavMainItem[];
  comingSoon?: boolean;
  newTab?: boolean;
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavMainItem[];
}

export const sidebarPrimarySection: SidebarPrimarySection = {
  title: "\u6821\u56ed\u7ba1\u7406",
  icon: ShieldCheck,
  items: [
    {
      title: "APP\u4fe1\u606f",
      url: "/dashboard/brand/info",
      icon: BadgeInfo,
      permission: ["brand", "campus"],
    },
    {
      title: "\u6821\u56ed\u5fae\u5b98\u7f51",
      url: "/dashboard/brand/site",
      icon: Globe,
      permission: ["site", "campus"],
    },
    {
      title: "Banner管理",
      url: "/dashboard/banner",
      icon: Image,
      permission: ["banner", "campus"],
    },
    {
      title: "资讯列表",
      url: "/dashboard/news",
      icon: Newspaper,
      permission: ["news", "campus"],
    },
    {
      title: "\u6821\u533a\u7ba1\u7406",
      url: "/dashboard/campuses",
      icon: LayoutGrid,
      permission: "campus",
    },
    {
      title: "\u79d1\u76ee\u7ba1\u7406",
      url: "/dashboard/subjects",
      icon: ClipboardList,
      permission: ["subject", "campus"],
    },
    {
      title: "\u6559\u5e08\u7ba1\u7406",
      url: "/dashboard/teachers",
      icon: Users2,
      permission: ["teacher", "campus"],
    },
    {
      title: "\u5b66\u751f\u7ba1\u7406",
      url: "/dashboard/students",
      icon: Users2,
      permission: ["student", "campus"],
    },
  ],
};

export const sidebarMainLinks: SidebarLinkItem[] = [
  {
    title: "\u5de5\u4f5c\u53f0",
    url: "/dashboard/overview",
    icon: LayoutGrid,
  },
  {
    title: "\u8d26\u53f7\u7ba1\u7406",
    url: "/dashboard/accounts",
    icon: Settings2,
    permission: ["manger", "manager", "account"],
  },
  {
    title: "\u5ba1\u6838\u7ba1\u7406",
    url: "/dashboard/real-name",
    icon: ShieldCheck,
    permission: ["audit", "realName"],
  },
  {
    title: "\u8003\u8bd5\u7ba1\u7406",
    url: "/dashboard/exam",
    icon: FileText,
    permission: "exam",
  },
  {
    title: "\u65f6\u95f4\u8868",
    url: "/dashboard/schedule",
    icon: Calendar,
    permission: "schedule",
  },
  {
    title: "\u89c6\u9891\u7ba1\u7406",
    url: "/dashboard/video",
    icon: Video,
    permission: "video",
  },
  {
    title: "\u542c\u5199\u7ba1\u7406",
    url: "/dashboard/dictation",
    icon: Headphones,
    permission: "dictation",
  },
  {
    title: "\u89c6\u5531\u7ba1\u7406",
    url: "/dashboard/sight-singing",
    icon: Music4,
    permission: "sightSinging",
  },
  {
    title: "\u4e50\u7406\u7ba1\u7406",
    url: "/dashboard/theory",
    icon: ClipboardList,
    permission: "theory",
  },
  {
    title: "\u5668\u4e50\u7ba1\u7406",
    url: "/dashboard/instrumental",
    icon: Disc3,
    permission: "instrumental",
  },
  {
    title: "\u58f0\u4e50\u7ba1\u7406",
    url: "/dashboard/vocal",
    icon: Mic2,
    permission: "vocal",
  },
  {
    title: "\u7b54\u9898\u7ba1\u7406",
    url: "/dashboard/answer",
    icon: ClipboardList,
    permission: "answer",
  },
  {
    title: "\u5237\u9898\u7ba1\u7406",
    url: "/dashboard/brush-questions",
    icon: ListChecks,
    permission: "brushQuestions",
  },
];

export const sidebarItems: NavGroup[] = [
  {
    id: "brand-center",
    items: [
      {
        title: sidebarPrimarySection.title,
        url: sidebarPrimarySection.items[0]?.url ?? "/dashboard/brand/info",
        icon: sidebarPrimarySection.icon,
        subItems: sidebarPrimarySection.items.map((item) => ({
          title: item.title,
          url: item.url,
          icon: item.icon,
        })),
      },
    ],
  },
  {
    id: "main-business",
    items: sidebarMainLinks.map((item) => ({
      title: item.title,
      url: item.url,
      icon: item.icon,
    })),
  },
];
