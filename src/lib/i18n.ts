export type Locale = "en" | "zh";

export const defaultLocale: Locale = "en";

export const dictionaries = {
  en: {
    shell: {
      brand: "Knowledge Base",
      subtitle: "Project foundation",
      languageLabel: "Language",
      navigation: {
        overview: "Overview",
        upload: "File upload",
        chat: "Chat",
        admin: "Admin",
      },
    },
    home: {
      eyebrow: "Knowledge operations",
      title: "AI Knowledge Base",
      description:
        "A clean Next.js foundation for uploading content, preparing a chat experience, and managing knowledge-base operations. AI integrations are intentionally left out for the next phase.",
      addFiles: "Add files",
      openChat: "Open chat",
      statusLabel: "Project status",
      statusTitle: "Foundation phase",
      ready: "Ready",
      readinessItems: [
        "Next.js App Router",
        "TypeScript",
        "Tailwind CSS",
        "Static route shell",
      ],
      modules: [
        {
          title: "Upload",
          href: "/upload",
          description: "Stage documents and prepare ingestion workflows.",
          status: "Foundation ready",
        },
        {
          title: "Chat",
          href: "/chat",
          description:
            "Reserve the conversational interface for future AI retrieval.",
          status: "UI placeholder",
        },
        {
          title: "Admin",
          href: "/admin",
          description:
            "Organize operational settings, content review, and access.",
          status: "Structure ready",
        },
      ],
    },
    upload: {
      eyebrow: "File upload",
      title: "Upload knowledge files",
      description:
        "Upload a single knowledge file into local project storage. Parsing, chunking, indexing, and AI responses are reserved for a later phase.",
      formTitle: "Upload one file",
      formDescription:
        "PDF, PPT, PPTX, images, DOCX, and XLSX files are supported up to 20MB.",
      chooseFile: "Choose file",
      idle: "Choose one supported file to upload.",
      missingFile: "Please choose a file first.",
      sizeError: "File size must be 20MB or less.",
      unsupportedType: "Unsupported file type.",
      uploading: "Uploading file...",
      uploadFailed: "Upload failed.",
      uploadedPrefix: "Uploaded",
      uploadButton: "Upload file",
      uploadingButton: "Uploading...",
    },
    chat: {
      eyebrow: "Chat",
      title: "Ask the knowledge base",
      description:
        "The chat page is ready for the future retrieval and AI layer. For now, it only shows the planned conversation layout.",
      sessions: "Sessions",
      newConversation: "New conversation",
      inputPlaceholder: "Chat input disabled until AI functionality is added",
      send: "Send",
      sampleMessages: [
        {
          role: "System",
          body: "Chat interface placeholder. Retrieval and AI responses are not wired yet.",
        },
        {
          role: "User",
          body: "Where will answers from uploaded documents appear?",
        },
      ],
    },
    admin: {
      eyebrow: "Admin",
      title: "Manage the knowledge base",
      description:
        "Review files stored in the local uploads directory. Persistence, permissions, deletion, and AI provider settings are not active yet.",
      uploadedFiles: "Uploaded files",
      fileSingular: "file",
      filePlural: "files",
      available: "available",
      empty: "No files have been uploaded yet.",
      fileName: "File name",
      size: "Size",
      uploaded: "Uploaded",
      dateLocale: "en",
    },
  },
  zh: {
    shell: {
      brand: "知识库",
      subtitle: "项目基础版",
      languageLabel: "语言",
      navigation: {
        overview: "概览",
        upload: "文件上传",
        chat: "对话",
        admin: "后台",
      },
    },
    home: {
      eyebrow: "知识运营",
      title: "AI 知识库",
      description:
        "一个干净的 Next.js 基础应用，用于上传内容、准备对话体验并管理知识库运营。AI 集成会留到下一阶段。",
      addFiles: "添加文件",
      openChat: "打开对话",
      statusLabel: "项目状态",
      statusTitle: "基础阶段",
      ready: "就绪",
      readinessItems: [
        "Next.js App Router",
        "TypeScript",
        "Tailwind CSS",
        "静态路由外壳",
      ],
      modules: [
        {
          title: "上传",
          href: "/upload",
          description: "暂存文档，并为后续摄取流程做准备。",
          status: "基础已就绪",
        },
        {
          title: "对话",
          href: "/chat",
          description: "为未来的 AI 检索问答预留对话界面。",
          status: "界面占位",
        },
        {
          title: "后台",
          href: "/admin",
          description: "组织运营设置、内容审阅和访问管理基础结构。",
          status: "结构已就绪",
        },
      ],
    },
    upload: {
      eyebrow: "文件上传",
      title: "上传知识文件",
      description:
        "将单个知识文件上传到项目本地存储。解析、切分、索引和 AI 回复会留到后续阶段。",
      formTitle: "上传一个文件",
      formDescription:
        "支持 PDF、PPT、PPTX、图片、DOCX 和 XLSX 文件，单个文件不超过 20MB。",
      chooseFile: "选择文件",
      idle: "请选择一个支持的文件进行上传。",
      missingFile: "请先选择文件。",
      sizeError: "文件大小必须小于或等于 20MB。",
      unsupportedType: "不支持的文件类型。",
      uploading: "正在上传文件...",
      uploadFailed: "上传失败。",
      uploadedPrefix: "已上传",
      uploadButton: "上传文件",
      uploadingButton: "上传中...",
    },
    chat: {
      eyebrow: "对话",
      title: "向知识库提问",
      description:
        "对话页面已为后续检索和 AI 层做好准备。当前仅展示规划中的对话布局。",
      sessions: "会话",
      newConversation: "新会话",
      inputPlaceholder: "AI 功能添加前，对话输入暂不可用",
      send: "发送",
      sampleMessages: [
        {
          role: "系统",
          body: "对话界面占位。检索和 AI 回复尚未接入。",
        },
        {
          role: "用户",
          body: "上传文档后的答案会显示在哪里？",
        },
      ],
    },
    admin: {
      eyebrow: "后台",
      title: "管理知识库",
      description:
        "查看本地 uploads 目录中保存的文件。持久化、权限、删除和 AI 服务商设置暂未启用。",
      uploadedFiles: "已上传文件",
      fileSingular: "个文件",
      filePlural: "个文件",
      available: "可用",
      empty: "还没有上传任何文件。",
      fileName: "文件名",
      size: "大小",
      uploaded: "上传时间",
      dateLocale: "zh-CN",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
