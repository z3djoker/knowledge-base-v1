export const metadataVersion = "1.0";

export const metadataOptions = {
  category: [
    "\u4ea7\u54c1\u8d44\u6599",
    "\u9879\u76ee\u6848\u4f8b",
    "\u62db\u6807\u6587\u4ef6",
    "\u552e\u524d\u6c9f\u901a",
    "\u552e\u540e\u6c9f\u901a",
    "\u5b9e\u65bd\u65b9\u6848",
    "\u62a5\u4ef7\u8d44\u6599",
    "\u6cd5\u89c4\u6807\u51c6",
    "\u5176\u4ed6",
  ],
  businessDirection: [
    "\u53cd\u5236",
    "\u8fd0\u8f93",
    "\u5de1\u68c0",
    "\u5e94\u6025",
    "\u6d4b\u7ed8",
    "\u57f9\u8bad",
    "\u5176\u4ed6",
  ],
  projectStage: [
    "\u552e\u524d",
    "\u6295\u6807",
    "\u5b9e\u65bd",
    "\u4ea4\u4ed8",
    "\u552e\u540e",
    "\u590d\u76d8",
    "\u5176\u4ed6",
  ],
  visibility: [
    "\u516c\u5f00",
    "\u5ba2\u6237\u53ef\u89c1",
    "\u5185\u90e8\u53ef\u89c1",
    "\u7ba1\u7406\u5458\u53ef\u89c1",
  ],
  industry: [
    "\u653f\u5e9c",
    "\u516c\u5b89",
    "\u6d88\u9632",
    "\u5e94\u6025",
    "\u673a\u573a",
    "\u80fd\u6e90",
    "\u7535\u529b",
    "\u56ed\u533a",
    "\u6559\u80b2",
    "\u4f01\u4e1a",
    "\u4e2a\u4eba",
    "\u5176\u4ed6",
  ],
  importance: ["\u4f4e", "\u4e2d", "\u9ad8", "\u5173\u952e"],
  status: ["\u8349\u7a3f", "\u53ef\u7528", "\u5f52\u6863", "\u5e9f\u5f03"],
} as const;

export type MetadataOptionField = {
  value: string;
  customValue?: string;
};

export type FileMetadata = {
  metadataVersion: typeof metadataVersion;
  fileName: string;
  originalName: string;
  category: MetadataOptionField;
  businessDirection: MetadataOptionField;
  projectStage: MetadataOptionField;
  visibility: string;
  industry: MetadataOptionField;
  importance: string;
  version: string;
  status: string;
  customerName: string;
  projectName: string;
  tags: string[];
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type FileMetadataInput = Partial<
  Omit<FileMetadata, "metadataVersion" | "createdAt" | "updatedAt">
> & {
  fileName: string;
  originalName: string;
};

export function getEffectiveMetadataValue(field: MetadataOptionField) {
  return field.value === "\u5176\u4ed6" && field.customValue
    ? field.customValue
    : field.value;
}
