import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "\u97f3\u4e50\u4e4b\u8def",
  subtitle: "Arts Management Console",
  version: packageJson.version,
  copyright: `\u00a9 ${currentYear} \u97f3\u4e50\u4e4b\u8def`,
  meta: {
    title: "\u97f3\u4e50\u4e4b\u8def 2.0 \u6821\u56ed\u7ba1\u7406\u7aef",
    description:
      "\u97f3\u4e50\u4e4b\u8def 2.0 \u6821\u56ed\u7ba1\u7406\u7aef\uff0c\u4ee5\u6d45\u8272\u827a\u672f\u5316\u4ea4\u4e92\u4e0e\u7edf\u4e00\u4ea7\u54c1\u6846\u67b6\u91cd\u65b0\u6784\u5efa\u3002",
  },
};
