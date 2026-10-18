"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowRightLeft,
  Ban,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Copy,
  Cpu,
  Database,
  Eye,
  FileText,
  Globe2,
  HardDrive,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Network,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Unlock,
  Users,
} from "lucide-react";
import type { SystemTelemetry } from "@/lib/server/telemetry";

type TabKey = "cockpit" | "chats" | "letgos" | "users";

interface ChatLogItem {
  id: number;
  anonId: string;
  ip: string;
  geo?: string;
  userAgent: string;
  userPrompt: string;
  assistantReply: string;
  model: string;
  tokens: number;
  isDeep: boolean;
  profileName: string;
  profileBirth: string;
  profileGender: string;
  createdAt: string;
}

interface LetgoItem {
  id: number;
  anonId: string;
  content: string;
  ip: string;
  geo?: string;
  createdAt: string;
}

interface UserRegistryItem {
  anonId: string;
  profileName?: string;
  profileBirth?: string;
  profileGender?: string;
  profileCity?: string;
  firstIp: string;
  firstGeo?: string;
  lastIp: string;
  lastGeo?: string;
  totalChats: number;
  totalTokens: number;
  totalLetgos: number;
  totalMeritCents: number;
  isBlocked: boolean;
  blockedReason: string;
  lastActiveAt: string;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / (24 * 3600));
  const h = Math.floor((seconds % (24 * 3600)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}天 ${h}时 ${m}分`;
  if (h > 0) return `${h}时 ${m}分`;
  return `${m}分`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

const TRIGRAM_NAMES = ["乾天", "坤地", "震木", "巽风", "坎水", "离火", "艮山", "兑泽"];
const COURTESY_NAMES = [
  "澄怀", "抱朴", "守拙", "忘机", "清安", "静笃", "和光", "同尘",
  "枕流", "漱石", "素问", "灵枢", "沧浪", "归舟", "明远", "子逸",
  "怀仁", "听泉", "望舒", "微澜", "知非", "致远", "问心", "观复"
];

function getUserAlias(anonId: string, profileName?: string): { name: string; isReal: boolean; tag: string } {
  if (profileName && profileName.trim()) {
    return { name: profileName.trim(), isReal: true, tag: "名" };
  }
  if (!anonId) return { name: "无名缘友", isReal: false, tag: "客" };

  let hash = 0;
  for (let i = 0; i < anonId.length; i++) {
    hash = (hash << 5) - hash + anonId.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);
  const tri = TRIGRAM_NAMES[posHash % TRIGRAM_NAMES.length];
  const courtesy = COURTESY_NAMES[(posHash >> 3) % COURTESY_NAMES.length];
  const shortId = anonId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  return {
    name: `${tri}·${courtesy}`,
    isReal: false,
    tag: shortId || "缘",
  };
}

// 简易 SVG 实时趋势面积图组件 (借鉴 Beszel / Ward 轻量绘图设计)
function SparklineArea({
  data,
  color = "#74866a",
  height = 42,
  width = 160,
  minVal = 0,
  maxVal = 100,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  minVal?: number;
  maxVal?: number;
}) {
  const pointsData = !data || data.length === 0 ? [0, 0] : data.length === 1 ? [data[0], data[0]] : data;
  const span = Math.max(1, maxVal - minVal);
  const step = width / Math.max(1, pointsData.length - 1);
  const points = pointsData.map((val, i) => {
    const norm = Math.max(0, Math.min(1, (val - minVal) / span));
    const y = height - norm * (height - 6) - 3;
    return `${i * step},${y}`;
  });

  const lineD = `M ${points.join(" L ")}`;
  const areaD = `${lineD} L ${width},${height} L 0,${height} Z`;
  const gradId = `spark-${color.replace(/[^a-zA-Z0-9]/g, "")}-${width}-${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible block">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={lineD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 24小时小时级走势图 (24小时完整槽位补齐 + 双轨平滑 SVG 面积折线 + 双轨柱状微交互)
function HourlyTrendChart({
  chats,
  tokens,
}: {
  chats: { hour: string; count: number }[];
  tokens: { hour: string; count: number }[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // 1. 过去 24 小时槽位完整补齐 (确保时序连续等距，彻底杜绝数据空白与断裂)
  const full24Hours = useMemo(() => {
    const chatMap = new Map<string, number>();
    chats.forEach((c) => chatMap.set(c.hour, c.count));

    const tokenMap = new Map<string, number>();
    tokens.forEach((t) => tokenMap.set(t.hour, t.count));

    const now = new Date();
    const slots: { hour: string; label: string; chats: number; tokens: number }[] = [];

    // 从 23 小时前推演至当前小时
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      const hStr = `${String(d.getHours()).padStart(2, "0")}:00`;
      slots.push({
        hour: hStr,
        label: hStr,
        chats: chatMap.get(hStr) || 0,
        tokens: tokenMap.get(hStr) || 0,
      });
    }
    return slots;
  }, [chats, tokens]);

  const totalChats = useMemo(() => full24Hours.reduce((acc, c) => acc + c.chats, 0), [full24Hours]);
  const totalTokens = useMemo(() => full24Hours.reduce((acc, c) => acc + c.tokens, 0), [full24Hours]);

  const maxChats = Math.max(3, ...full24Hours.map((m) => m.chats));
  const maxTokens = Math.max(300, ...full24Hours.map((m) => m.tokens));

  // 2. 构造 24 个采样点的 SVG 平滑贝塞尔曲线
  const svgW = 760;
  const svgH = 100;
  const padX = 14;
  const padY = 12;
  const usableW = svgW - padX * 2;
  const usableH = svgH - padY * 2;

  const chatPoints = full24Hours.map((item, idx) => {
    const x = padX + (idx / (full24Hours.length - 1)) * usableW;
    const y = svgH - padY - (item.chats / maxChats) * usableH;
    return { x, y, ...item };
  });

  const tokenPoints = full24Hours.map((item, idx) => {
    const x = padX + (idx / (full24Hours.length - 1)) * usableW;
    const y = svgH - padY - (item.tokens / maxTokens) * usableH;
    return { x, y, ...item };
  });

  const makeSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const lineChat = makeSmoothPath(chatPoints);
  const areaChat = `${lineChat} L ${chatPoints[chatPoints.length - 1].x} ${svgH - padY} L ${chatPoints[0].x} ${svgH - padY} Z`;

  const lineToken = makeSmoothPath(tokenPoints);
  const areaToken = `${lineToken} L ${tokenPoints[tokenPoints.length - 1].x} ${svgH - padY} L ${tokenPoints[0].x} ${svgH - padY} Z`;

  const active = hoveredIdx !== null ? full24Hours[hoveredIdx] : null;

  return (
    <div className="space-y-3">
      {/* 图例与即时状态看板 */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-sage shadow-sm shadow-sage/30" />
            <span>问卜对话：</span>
            <b className="font-mono text-sage">{hoveredIdx !== null ? active?.chats : totalChats}</b>
            <span className="text-[11px] text-mute">{hoveredIdx !== null ? "次 (当点)" : "次 (24h累积)"}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-sm shadow-gold/30" />
            <span>算力吞吐：</span>
            <b className="font-mono text-gold">{hoveredIdx !== null ? active?.tokens.toLocaleString() : totalTokens.toLocaleString()}</b>
            <span className="text-[11px] text-mute">{hoveredIdx !== null ? "Tokens" : "Tokens (24h)"}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-mute">
          {active ? (
            <span className="rounded bg-paper-2 px-2 py-0.5 text-ink font-medium">
              时段：{active.hour} ~ {String((parseInt(active.hour, 10) + 1) % 24).padStart(2, "0")}:00
            </span>
          ) : (
            <span>过去 24 小时连续时间序列 · 悬停可透视每小时吞吐</span>
          )}
        </div>
      </div>

      {/* SVG 平滑双轨渐变面积图 + 柱状复合走势容器 */}
      <div className="relative overflow-hidden rounded-xl border border-line/70 bg-paper p-3 shadow-sm">
        {/* 背景轻量水平参考刻度线 */}
        <div className="absolute inset-x-3 top-3 bottom-8 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-dashed border-ink/40 w-full" />
          <div className="border-b border-dashed border-ink/40 w-full" />
          <div className="border-b border-dashed border-ink/40 w-full" />
        </div>

        {/* 双轨面积折线图 */}
        <div className="relative h-28 w-full">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="gradSage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38761d" stopOpacity="0.32" />
                <stop offset="85%" stopColor="#38761d" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#38761d" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.28" />
                <stop offset="85%" stopColor="#d97706" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 算力 Token 吞吐面积与折线 (底轨) */}
            <path d={areaToken} fill="url(#gradGold)" />
            <path d={lineToken} fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

            {/* 问卜对话频次面积与折线 (顶轨) */}
            <path d={areaChat} fill="url(#gradSage)" />
            <path d={lineChat} fill="none" stroke="#38761d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

            {/* 悬停时的垂直切线与焦点光圈 */}
            {hoveredIdx !== null && (
              <g pointerEvents="none">
                <line
                  x1={chatPoints[hoveredIdx].x}
                  y1={padY}
                  x2={chatPoints[hoveredIdx].x}
                  y2={svgH - padY}
                  stroke="#8f3a2c"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
                <circle cx={chatPoints[hoveredIdx].x} cy={chatPoints[hoveredIdx].y} r="4" fill="#38761d" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={tokenPoints[hoveredIdx].x} cy={tokenPoints[hoveredIdx].y} r="3.5" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            )}
          </svg>
        </div>

        {/* 24 小时微交互柱条与时间标尺栏 */}
        <div className="mt-2.5 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px] pt-1 border-t border-line/40">
          {full24Hours.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const hasData = item.chats > 0 || item.tokens > 0;
            // 保证有固定的最小柱条高度，绝不塌缩为 0px
            const chatH = item.chats > 0 ? Math.max(6, Math.min(36, Math.round((item.chats / maxChats) * 36))) : 2;
            const tokH = item.tokens > 0 ? Math.max(4, Math.min(36, Math.round((item.tokens / maxTokens) * 36))) : 2;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`group flex h-14 cursor-pointer flex-col items-center justify-end rounded-md transition-all ${
                  isHovered ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"
                }`}
              >
                {/* 双柱对齐容器 */}
                <div className="flex items-end justify-center gap-[2px] pb-1">
                  <div
                    style={{ height: `${chatH}px` }}
                    className={`w-[4px] rounded-t transition-all ${
                      hasData && item.chats > 0 ? "bg-sage group-hover:bg-sage/80" : "bg-ink/10"
                    }`}
                  />
                  <div
                    style={{ height: `${tokH}px` }}
                    className={`w-[4px] rounded-t transition-all ${
                      hasData && item.tokens > 0 ? "bg-gold group-hover:bg-gold/80" : "bg-ink/10"
                    }`}
                  />
                </div>

                {/* 仅在关键时间点显示时标，避免拥挤 */}
                <span className="font-mono text-[8.5px] leading-none text-mute truncate select-none">
                  {idx % 4 === 0 || idx === full24Hours.length - 1 ? item.hour.slice(0, 2) : "·"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 案卷 Markdown 优雅富文本渲染组件
const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mt-3 mb-1.5 font-song text-[16px] font-bold text-ink">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-2.5 mb-1 font-song text-[15px] font-bold text-ink">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-2 mb-1 font-song text-[14px] font-semibold text-ink">{children}</h3>,
  p: ({ children }) => <p className="my-1.5 leading-relaxed text-ink/90">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="my-2.5 rounded-xl border-l-4 border-seal/50 bg-seal/[0.05] p-3 font-song text-[13.5px] italic leading-relaxed text-ink-2">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-semibold text-seal">{children}</strong>,
  ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-3 border-line" />,
  code: ({ children }) => (
    <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-ink">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-xl border border-line bg-paper p-3 font-mono text-[12px] text-ink">
      {children}
    </pre>
  ),
};

export default function CuratorPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<TabKey>("cockpit");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 遥测数据
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);

  // 对话审计数据
  const [chats, setChats] = useState<{ items: ChatLogItem[]; total: number; page: number; totalPages: number }>({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [chatSearch, setChatSearch] = useState("");
  const [chatModelFilter, setChatModelFilter] = useState("");
  const [expandedChatId, setExpandedChatId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"markdown" | "raw">("markdown");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // 纸篓心事数据
  const [letgos, setLetgos] = useState<{ items: LetgoItem[]; total: number; page: number; totalPages: number }>({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [letgoSearch, setLetgoSearch] = useState("");

  // 缘友台账数据
  const [users, setUsers] = useState<{ items: UserRegistryItem[]; total: number; page: number; totalPages: number }>({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [userSearch, setUserSearch] = useState("");

  // 初始验证登录态
  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data: { authenticated?: boolean }) => {
        setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingAuth(false));
  }, []);

  // 加载遥测数据
  const loadTelemetry = async () => {
    try {
      const res = await fetch("/api/admin/telemetry");
      if (res.ok) {
        const data = (await res.json()) as SystemTelemetry;
        setTelemetry(data);
        if (data.server.cpuHistory && data.server.cpuHistory.length > 0) {
          setCpuHistory(data.server.cpuHistory);
        } else {
          setCpuHistory((prev) => [...prev.slice(-19), data.server.cpu.loadPercent1m]);
        }
        if (data.server.memHistory && data.server.memHistory.length > 0) {
          setMemHistory(data.server.memHistory);
        } else {
          setMemHistory((prev) => [...prev.slice(-19), data.server.memory.usedPercent]);
        }
      } else if (res.status === 401) {
        setAuthenticated(false);
      }
    } catch {
      /* 静默 */
    }
  };

  // 加载对话列表 (带 IP 归属地)
  const loadChats = async (page = 1, q = chatSearch, model = chatModelFilter) => {
    try {
      const p = new URLSearchParams({ page: String(page), limit: "15" });
      if (q) p.set("q", q);
      if (model) p.set("model", model);
      const res = await fetch(`/api/admin/chats?${p.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { items: ChatLogItem[]; total: number; page: number; totalPages: number };
        setChats(data);
      }
    } catch {
      /* 静默 */
    }
  };

  // 加载纸篓列表 (带 IP 归属地)
  const loadLetgos = async (page = 1, q = letgoSearch) => {
    try {
      const p = new URLSearchParams({ page: String(page), limit: "16" });
      if (q) p.set("q", q);
      const res = await fetch(`/api/admin/letgos?${p.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { items: LetgoItem[]; total: number; page: number; totalPages: number };
        setLetgos(data);
      }
    } catch {
      /* 静默 */
    }
  };

  // 加载缘友列表 (带 IP 归属地)
  const loadUsers = async (page = 1, q = userSearch) => {
    try {
      const p = new URLSearchParams({ page: String(page), limit: "15" });
      if (q) p.set("q", q);
      const res = await fetch(`/api/admin/users?${p.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { items: UserRegistryItem[]; total: number; page: number; totalPages: number };
        setUsers(data);
      }
    } catch {
      /* 静默 */
    }
  };

  // 刷新当前活动数据
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      loadTelemetry(),
      activeTab === "chats" ? loadChats(chats.page) : Promise.resolve(),
      activeTab === "letgos" ? loadLetgos(letgos.page) : Promise.resolve(),
      activeTab === "users" ? loadUsers(users.page) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!authenticated) return;
    void refreshAll();
  }, [authenticated, activeTab]);

  // 自动轮询遥测
  useEffect(() => {
    if (!authenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      void loadTelemetry();
    }, 12000);
    return () => clearInterval(interval);
  }, [authenticated, autoRefresh]);

  // 登录提交
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (res.ok && json.ok) {
          setAuthenticated(true);
          setPassword("");
        } else {
          setAuthError(json.error || "口令有误，无权开启内阁");
        }
      } catch {
        setAuthError("网络连接异常");
      }
    });
  };

  // 登出提交
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setAuthenticated(false);
    }
  };

  // 封禁/解封用户
  const toggleBlockUser = async (anonId: string, currentBlocked: boolean) => {
    const reason = currentBlocked ? "" : window.prompt("请输入风控封禁缘由（可留空）：", "合规审查风控限制") ?? "";
    try {
      const res = await fetch("/api/admin/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonId,
          isBlocked: !currentBlocked,
          reason,
        }),
      });
      if (res.ok) {
        await loadUsers(users.page);
        await loadTelemetry();
      }
    } catch {
      alert("操作失败，请重试");
    }
  };

  // 复制文本
  const copyToClipboard = (text: string, id: number) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // 导出 JSON 数据文件
  const exportJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="flex items-center gap-3 font-song text-[15px] text-mute">
          <RefreshCw className="h-4 w-4 animate-spin text-ink" />
          <span>正在探寻掌阁令符……</span>
        </div>
      </div>
    );
  }

  // 鉴权未通过：展示极简古典登录卡片
  if (!authenticated) {
    return (
      <div data-curator-root="true" className="flex min-h-screen items-center justify-center bg-paper px-4 py-12 text-ink selection:bg-seal/15">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card p-8 shadow-[0_20px_50px_rgba(60,40,10,0.06)]">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-seal to-transparent opacity-80" />

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-paper-2 text-seal shadow-inner">
              <Shield className="h-7 w-7 stroke-[1.6]" />
            </div>
            <h1 className="mt-4 font-song text-[24px] font-bold tracking-wider text-ink">算了 · 掌阁内阁</h1>
            <p className="mt-1 text-[13px] text-mute">神枢监控、问卜案卷合规与风控总览</p>
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <div>
              <label className="block text-[12px] font-medium tracking-wider text-mute">掌阁令符 (ADMIN PASSWORD)</label>
              <div className="relative mt-1.5">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入管理口令……"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 pl-10 text-[14px] text-ink outline-none transition focus:border-ink/50 focus:ring-1 focus:ring-ink/20"
                />
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-mute" />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-xl border border-seal/30 bg-seal/10 px-3.5 py-2.5 text-[13px] text-seal">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-[14px] font-medium text-paper transition hover:bg-ink/90 disabled:opacity-50"
            >
              {isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>开启内阁</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-line/60 pt-4 text-center">
            <span className="text-[11px] text-mute">内部受限系统 · 全操作轨迹已被密码学审计</span>
          </div>
        </div>
      </div>
    );
  }

  // 鉴权通过：进入掌阁内阁主控制台 (支持纵向平滑滚动到底)
  return (
    <div data-curator-root="true" className="min-h-screen w-full overflow-y-auto bg-paper pb-28 text-ink selection:bg-seal/15">
      {/* 顶部常驻导航栏 */}
      <header className="sticky top-0 z-30 border-b border-line bg-card/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-paper-2 text-seal">
              <Shield className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-song text-[17px] font-bold tracking-wide text-ink">算了 · 掌阁内阁</h1>
                <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10.5px] font-medium text-sage">
                  CURATOR CONSOLE
                </span>
              </div>
              <p className="text-[11px] text-mute">合规审查流水 · IP归属地溯源 · 服务器遥测 · 双服务商熔断</p>
            </div>
          </div>

          {/* 实时状态指示胶囊 */}
          <div className="hidden items-center gap-2.5 md:flex">
            {telemetry && (
              <>
                <div className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] text-ink-2">
                  <Cpu className="h-3.5 w-3.5 text-mute" />
                  <span>负载 {telemetry.server.cpu.loadPercent1m}%</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] text-ink-2">
                  <HardDrive className="h-3.5 w-3.5 text-mute" />
                  <span>内存 {telemetry.server.memory.usedPercent}%</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px]">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      telemetry.database.status === "connected" ? "bg-sage animate-pulse" : "bg-seal"
                    }`}
                  />
                  <span>PG {telemetry.database.status === "connected" ? "连通" : "断开"}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px]">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      telemetry.llm.providers[0]?.pingStatus === "ok" ? "bg-sage" : "bg-seal"
                    }`}
                  />
                  <span>
                    LLM {telemetry.llm.providers[0]?.pingMs ? `${telemetry.llm.providers[0].pingMs}ms` : "在线"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 右侧动作 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? "自动轮询中 (12s)" : "已暂停自动轮询"}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] transition ${
                autoRefresh
                  ? "border-sage/40 bg-sage/10 text-sage"
                  : "border-line bg-paper text-mute hover:text-ink"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{autoRefresh ? "12s轮询" : "定格"}</span>
            </button>

            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-1.5 text-[12px] text-ink-2 transition hover:bg-paper-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">刷新</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-seal/30 bg-seal/10 px-3 py-1.5 text-[12px] text-seal transition hover:bg-seal/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">退阁</span>
            </button>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab("cockpit")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${
              activeTab === "cockpit"
                ? "border-ink text-ink"
                : "border-transparent text-mute hover:border-line hover:text-ink-2"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>神枢总览</span>
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${
              activeTab === "chats"
                ? "border-ink text-ink"
                : "border-transparent text-mute hover:border-line hover:text-ink-2"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>问卜案卷 (对话审查)</span>
          </button>
          <button
            onClick={() => setActiveTab("letgos")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${
              activeTab === "letgos"
                ? "border-ink text-ink"
                : "border-transparent text-mute hover:border-line hover:text-ink-2"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>纸篓心事 (归档)</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${
              activeTab === "users"
                ? "border-ink text-ink"
                : "border-transparent text-mute hover:border-line hover:text-ink-2"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>缘友台账 (风控)</span>
          </button>
        </div>
      </header>

      {/* 主工作区 */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ==================== TAB 1: 神枢总览 (COCKPIT) ==================== */}
        {activeTab === "cockpit" && (
          !telemetry ? (
            <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-card/60 p-8 text-mute">
              <RefreshCw className="h-6 w-6 animate-spin text-ink-2" />
              <span className="text-[13px]">正在同步神枢遥测与服务器物理资源指标……</span>
            </div>
          ) : (
          <div className="space-y-6">
            {/* 4 枚核心业务 KPI 卡片 */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-line bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between text-mute">
                  <span className="text-[12px]">24小时对话量</span>
                  <MessageSquare className="h-4 w-4 text-ink-2" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-song text-[28px] font-bold text-ink">
                    {telemetry.database.tables.chatsToday}
                  </span>
                  <span className="text-[12px] text-mute">/ 累计 {telemetry.database.tables.chatsTotal}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between text-mute">
                  <span className="text-[12px]">24小时放下心事</span>
                  <Trash2 className="h-4 w-4 text-seal" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-song text-[28px] font-bold text-ink">
                    {telemetry.database.tables.letgosToday}
                  </span>
                  <span className="text-[12px] text-mute">/ 累计 {telemetry.database.tables.letgosTotal}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between text-mute">
                  <span className="text-[12px]">注册缘友总计</span>
                  <Users className="h-4 w-4 text-sage" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-song text-[28px] font-bold text-ink">
                    {telemetry.database.tables.usersTotal}
                  </span>
                  {telemetry.database.tables.usersBlocked > 0 && (
                    <span className="rounded-full bg-seal/15 px-2 py-0.5 text-[10px] font-medium text-seal">
                      {telemetry.database.tables.usersBlocked} 封禁
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between text-mute">
                  <span className="text-[12px]">功德随喜累计</span>
                  <Sparkles className="h-4 w-4 text-gold" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-song text-[28px] font-bold text-ink">
                    ¥{(telemetry.database.tables.meritTotalCents / 100).toFixed(2)}
                  </span>
                  <span className="text-[12px] text-mute">
                    ({Math.round(telemetry.database.tables.tokensTotal / 1000)}k Token)
                  </span>
                </div>
              </div>
            </div>

            {/* 24 小时走势图 */}
            <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-sage" />
                  <h2 className="font-song text-[16px] font-bold text-ink">业务吞吐走势 (24小时波动分析)</h2>
                </div>
                <span className="text-[11px] text-mute">按整点聚合</span>
              </div>
              <div className="mt-4">
                <HourlyTrendChart
                  chats={telemetry.database.hourlyTrends.chats}
                  tokens={telemetry.database.hourlyTrends.tokens}
                />
              </div>
            </div>

            {/* 服务器资源监控仪表盘 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 节点硬件态势 */}
              <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper-2 text-ink">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-song text-[16px] font-bold text-ink">服务器硬件与资源水位</h2>
                      <p className="text-[11px] text-mute">
                        {telemetry.server.hostname} · {telemetry.server.platform} ({telemetry.server.arch})
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-ink-2">
                    Uptime {formatDuration(telemetry.server.uptimeSeconds)}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {/* CPU 水位 + Sparkline 趋势 */}
                  <div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-ink-2">
                        CPU 负载率 ({telemetry.server.cpu.cores} 核心 · {telemetry.server.cpu.model.slice(0, 24)})
                      </span>
                      <span className="font-mono font-medium text-ink">
                        {telemetry.server.cpu.loadPercent1m}% (1m: {telemetry.server.cpu.loadAvg[0]}, 5m:{" "}
                        {telemetry.server.cpu.loadAvg[1]})
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
                        <div
                          className={`h-full transition-all duration-500 ${
                            telemetry.server.cpu.loadPercent1m > 80
                              ? "bg-seal"
                              : telemetry.server.cpu.loadPercent1m > 50
                              ? "bg-gold"
                              : "bg-sage"
                          }`}
                          style={{ width: `${Math.min(100, telemetry.server.cpu.loadPercent1m)}%` }}
                        />
                      </div>
                      <div className="shrink-0" title="1分钟内实时走势">
                        <SparklineArea data={cpuHistory} color="#74866a" width={110} height={24} />
                      </div>
                    </div>

                    {/* 多核心明细 */}
                    {telemetry.server.cpu.coresDetail && telemetry.server.cpu.coresDetail.length > 0 && (
                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10.5px] text-mute">
                        {telemetry.server.cpu.coresDetail.map((core) => (
                          <div key={core.index} className="flex items-center justify-between rounded bg-paper px-2 py-1">
                            <span>Core #{core.index}</span>
                            <span className="font-mono text-ink">{core.speed} MHz</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 物理内存水位 + Sparkline */}
                  <div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-ink-2">宿主物理内存水位 (Linux MemAvailable)</span>
                      <span className="font-mono font-medium text-ink">
                        {formatBytes(telemetry.server.memory.usedBytes)} / {formatBytes(telemetry.server.memory.totalBytes)} (
                        {telemetry.server.memory.usedPercent}%)
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
                        <div
                          className={`h-full transition-all duration-500 ${
                            telemetry.server.memory.usedPercent > 85 ? "bg-seal" : "bg-sage"
                          }`}
                          style={{ width: `${telemetry.server.memory.usedPercent}%` }}
                        />
                      </div>
                      <div className="shrink-0" title="物理内存占用走势">
                        <SparklineArea data={memHistory} color="#5a7186" width={110} height={24} />
                      </div>
                    </div>

                    {/* 细粒度内存缓存组成 */}
                    {(telemetry.server.memory.cachedBytes || telemetry.server.memory.buffersBytes) && (
                      <div className="mt-2 flex items-center gap-3 text-[10.5px] text-mute">
                        {telemetry.server.memory.cachedBytes && (
                          <span>PageCache: {formatBytes(telemetry.server.memory.cachedBytes)}</span>
                        )}
                        {telemetry.server.memory.buffersBytes && (
                          <span>Buffers: {formatBytes(telemetry.server.memory.buffersBytes)}</span>
                        )}
                        {telemetry.server.memory.swapTotalBytes && (
                          <span>
                            Swap: {formatBytes(telemetry.server.memory.swapUsedBytes || 0)} /{" "}
                            {formatBytes(telemetry.server.memory.swapTotalBytes)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 磁盘空间水位 */}
                  {telemetry.server.disk && (
                    <div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-ink-2">根分区挂载点 (/) 磁盘水位</span>
                        <span className="font-mono font-medium text-ink">
                          {formatBytes(telemetry.server.disk.usedBytes)} / {formatBytes(telemetry.server.disk.totalBytes)} (
                          {telemetry.server.disk.usedPercent}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper-2">
                        <div
                          className="h-full bg-mist transition-all duration-500"
                          style={{ width: `${telemetry.server.disk.usedPercent}%` }}
                        />
                      </div>
                      <div className="mt-1 text-right text-[10.5px] text-mute">
                        剩余可用空间：{formatBytes(telemetry.server.disk.freeBytes)}
                      </div>
                    </div>
                  )}

                  {/* 网络传输流量 */}
                  {telemetry.server.network && (
                    <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-3 py-2 text-[11px] text-mute">
                      <div className="flex items-center gap-2">
                        <Network className="h-3.5 w-3.5 text-ink-2" />
                        <span>容器网络累计吞吐</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-ink">
                        <span>↓ RX: {formatBytes(telemetry.server.network.rxBytes)}</span>
                        <span>↑ TX: {formatBytes(telemetry.server.network.txBytes)}</span>
                      </div>
                    </div>
                  )}

                  {/* Node.js 进程轻量画像 */}
                  <div className="rounded-xl border border-line bg-paper p-3 text-[11.5px] text-mute">
                    <div className="flex items-center justify-between">
                      <span>Node.js 运行时：{telemetry.server.nodeVersion}</span>
                      <span>进程持续：{formatDuration(telemetry.server.processUptimeSeconds)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span>进程 RSS 驻留内存：{formatBytes(telemetry.server.memory.processRssBytes)}</span>
                      <span>堆内存使用：{formatBytes(telemetry.server.memory.processHeapUsedBytes)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 数据库与存储态势 */}
              <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper-2 text-ink">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-song text-[16px] font-bold text-ink">PostgreSQL 核心数据库</h2>
                      <p className="text-[11px] text-mute">高可靠持久化连接池状态与物理落盘规模</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      telemetry.database.status === "connected"
                        ? "bg-sage/15 text-sage"
                        : "bg-seal/15 text-seal"
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {telemetry.database.status === "connected" ? "活跃连接正常" : "连接中断"}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-line bg-paper p-3">
                      <span className="text-[11px] text-mute">数据库物理大小</span>
                      <div className="mt-1 font-mono text-[16px] font-bold text-ink">
                        {telemetry.database.dbSize}
                      </div>
                    </div>
                    <div className="rounded-xl border border-line bg-paper p-3">
                      <span className="text-[11px] text-mute">活跃连接数</span>
                      <div className="mt-1 font-mono text-[16px] font-bold text-ink">
                        {telemetry.database.activeConnections} 线程
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-line p-3">
                    <span className="text-[12px] font-medium text-ink-2">核心数据表账本盘点</span>
                    <div className="mt-2 space-y-1.5 text-[12px]">
                      <div className="flex justify-between border-b border-line/50 pb-1 text-mute">
                        <span>chat_logs (对话审查流水)</span>
                        <span className="font-mono text-ink">{telemetry.database.tables.chatsTotal} 行</span>
                      </div>
                      <div className="flex justify-between border-b border-line/50 pb-1 text-mute">
                        <span>letgo_events (纸篓心事归档)</span>
                        <span className="font-mono text-ink">{telemetry.database.tables.letgosTotal} 行</span>
                      </div>
                      <div className="flex justify-between border-b border-line/50 pb-1 text-mute">
                        <span>users_registry (缘友台账档案)</span>
                        <span className="font-mono text-ink">{telemetry.database.tables.usersTotal} 户</span>
                      </div>
                      <div className="flex justify-between border-b border-line/50 pb-1 text-mute">
                        <span>orders (随喜功德订单)</span>
                        <span className="font-mono text-ink">{telemetry.database.tables.ordersTotal} 笔</span>
                      </div>
                      <div className="flex justify-between text-mute">
                        <span>usage_log (算力 Token 记账)</span>
                        <span className="font-mono text-ink">{telemetry.database.tables.tokensTotal} Tokens</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 大模型服务商集群态势卡片 */}
            <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper-2 text-ink">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-song text-[16px] font-bold text-ink">大模型双服务商与分档路由态势</h2>
                    <p className="text-[11px] text-mute">跨服务商毫秒探针、多线路容灾与 5 分钟自动熔断保护</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {telemetry.llm.activeCoolings.length > 0 ? (
                    <span className="rounded-full bg-seal/15 px-2.5 py-1 text-[11px] font-medium text-seal">
                      熔断冷却中 ({telemetry.llm.activeCoolings.length} 项)
                    </span>
                  ) : (
                    <span className="rounded-full bg-sage/15 px-2.5 py-1 text-[11px] font-medium text-sage">
                      全链路健康
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {telemetry.llm.providers.map((p, idx) => (
                  <div key={idx} className="rounded-xl border border-line bg-paper p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            p.pingStatus === "ok" ? "bg-sage" : p.pingStatus === "degraded" ? "bg-gold" : "bg-seal"
                          }`}
                        />
                        <span className="font-medium text-[13px] text-ink">{p.name}</span>
                      </div>
                      <span className="font-mono text-[12px] text-ink-2">
                        {p.pingMs ? `${p.pingMs} ms` : p.errorMsg || "未就绪"}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-mute">
                      <div className="truncate">主端点：{p.base}</div>
                      {p.backupBases.length > 0 && (
                        <div className="truncate mt-0.5">
                          备用端点：{p.backupBases.join(" · ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 路由策略与模型树 */}
              <div className="mt-4 rounded-xl border border-line/60 bg-paper-2/50 p-4 text-[12px]">
                <div className="font-medium text-ink-2">模型分档路由级联规则 (Tier Routing)：</div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-card p-3 border border-line">
                    <div className="text-[11px] font-bold text-ink">旗舰深度推理档（聊天问答、年度大盘）</div>
                    <div className="mt-1 font-mono text-[11px] text-mute">
                      {telemetry.llm.modelTiers.flagship.join(" → ")}
                    </div>
                  </div>
                  <div className="rounded-lg bg-card p-3 border border-line">
                    <div className="text-[11px] font-bold text-ink">轻量极速档（标题生成、算力类比）</div>
                    <div className="mt-1 font-mono text-[11px] text-mute">
                      {telemetry.llm.modelTiers.lightweight.join(" → ")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* ==================== TAB 2: 问卜案卷 (CHAT LOGS) ==================== */}
        {activeTab === "chats" && (
          <div className="space-y-4">
            {/* 顶部搜索与筛选 */}
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-mute" />
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void loadChats(1, chatSearch, chatModelFilter)}
                  placeholder="搜索提问、AI解盘、anonId或IP，回车确认……"
                  className="w-full rounded-xl border border-line bg-paper py-2 pl-10 pr-4 text-[13px] text-ink outline-none transition focus:border-ink/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatModelFilter}
                  onChange={(e) => setChatModelFilter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void loadChats(1, chatSearch, chatModelFilter)}
                  placeholder="过滤模型名称…"
                  className="w-36 rounded-xl border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-ink/40"
                />
                <button
                  onClick={() => void loadChats(1, chatSearch, chatModelFilter)}
                  className="rounded-xl bg-ink px-4 py-2 text-[13px] font-medium text-paper transition hover:bg-ink/90"
                >
                  检索
                </button>
                <button
                  onClick={() => exportJson(chats.items, `suanle_chats_page${chats.page}.json`)}
                  className="flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-2 text-[12px] text-ink-2 transition hover:bg-paper-2"
                  title="导出当前页记录为 JSON 文件"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  <span>导出JSON</span>
                </button>
              </div>
            </div>

            {/* 案卷列表 */}
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-line bg-paper-2 text-[11.5px] font-medium text-mute">
                    <tr>
                      <th className="py-3 pl-4 pr-2">时刻</th>
                      <th className="px-3 py-3">缘友 / 归属地溯源</th>
                      <th className="px-3 py-3">模型 / Tokens</th>
                      <th className="px-3 py-3">提问概要</th>
                      <th className="px-3 py-3">解盘点拨</th>
                      <th className="py-3 pl-2 pr-4 text-right">明细</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {chats.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-mute">
                          暂无符合条件的对话审计案卷
                        </td>
                      </tr>
                    ) : (
                      chats.items.map((item) => {
                        const isExpanded = expandedChatId === item.id;
                        return (
                          <tr
                            key={item.id}
                            className={`transition hover:bg-paper/80 ${isExpanded ? "bg-paper/60" : ""}`}
                          >
                            <td className="whitespace-nowrap py-3 pl-4 pr-2 font-mono text-[11px] text-mute">
                              {formatTime(item.createdAt)}
                            </td>
                            <td className="px-3 py-3">
                              {(() => {
                                const alias = getUserAlias(item.anonId, item.profileName);
                                return (
                                  <div>
                                    <div
                                      onClick={() => {
                                        setChatSearch(item.anonId);
                                        void loadChats(1, item.anonId, chatModelFilter);
                                      }}
                                      title={`点击过滤此缘友 (${item.anonId})`}
                                      className="cursor-pointer flex items-center gap-1.5 hover:underline"
                                    >
                                      <span className={`text-[12.5px] font-medium ${alias.isReal ? "text-ink font-semibold" : "text-ink"}`}>
                                        {alias.name}
                                      </span>
                                      <span className={`rounded px-1 py-0.2 text-[9.5px] font-mono ${alias.isReal ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : "bg-ink/5 text-mute"}`}>
                                        #{alias.tag}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-mute font-mono mt-0.5">
                                      <span>{item.anonId.slice(0, 8)}…</span>
                                      <span>·</span>
                                      <MapPin className="h-2.5 w-2.5 text-seal/80 shrink-0" />
                                      <span className="truncate max-w-[100px]" title={`${item.ip} (${item.geo || "未知"})`}>
                                        {item.geo || item.ip}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] text-ink-2">{item.model || "local"}</span>
                                {item.isDeep && (
                                  <span className="rounded bg-seal/15 px-1 py-0.2 text-[9.5px] font-medium text-seal">
                                    深度
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[10px] text-mute">{item.tokens} tok</div>
                            </td>
                            <td className="max-w-[200px] truncate px-3 py-3 text-ink" title={item.userPrompt}>
                              {item.userPrompt}
                            </td>
                            <td className="max-w-[260px] truncate px-3 py-3 text-mute" title={item.assistantReply}>
                              {item.assistantReply.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/\n+/g, " ").trim().slice(0, 80)}
                            </td>
                            <td className="py-3 pl-2 pr-4 text-right">
                              <button
                                onClick={() => setExpandedChatId(isExpanded ? null : item.id)}
                                className="rounded-lg border border-line bg-paper px-2.5 py-1 text-[11px] text-ink-2 transition hover:bg-paper-2"
                              >
                                {isExpanded ? "收起" : "展开"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 展开的详情展示：支持 Markdown 富文本解析与 Raw 视图切换 */}
              {expandedChatId !== null && (
                <div className="border-t border-line bg-paper-2/40 p-5">
                  {(() => {
                    const item = chats.items.find((c) => c.id === expandedChatId);
                    if (!item) return null;
                    return (
                      <div className="space-y-4 rounded-xl border border-line bg-card p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 text-[12px] text-mute">
                          <div className="flex flex-wrap items-center gap-3">
                            <span>
                              缘友：<b className="text-ink font-semibold">{getUserAlias(item.anonId, item.profileName).name}</b>
                              <span className="font-mono text-mute text-[10.5px] ml-1.5">({item.anonId})</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-seal" />
                              <b className="font-mono text-ink">{item.ip}</b>
                              <span>({item.geo || "未知归属"})</span>
                            </span>
                            <span>
                              模型：<b className="font-mono text-ink">{item.model}</b>
                            </span>
                            <span>
                              算力：<b className="font-mono text-ink">{item.tokens} tok</b>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Markdown / Raw 切换 */}
                            <div className="flex items-center rounded-lg border border-line bg-paper p-0.5 text-[11px]">
                              <button
                                onClick={() => setViewMode("markdown")}
                                className={`flex items-center gap-1 rounded-md px-2 py-1 transition ${
                                  viewMode === "markdown"
                                    ? "bg-card font-medium text-ink shadow-xs"
                                    : "text-mute hover:text-ink"
                                }`}
                              >
                                <Eye className="h-3 w-3" />
                                <span>排版视图</span>
                              </button>
                              <button
                                onClick={() => setViewMode("raw")}
                                className={`flex items-center gap-1 rounded-md px-2 py-1 transition ${
                                  viewMode === "raw"
                                    ? "bg-card font-medium text-ink shadow-xs"
                                    : "text-mute hover:text-ink"
                                }`}
                              >
                                <Code className="h-3 w-3" />
                                <span>源码视图</span>
                              </button>
                            </div>

                            {/* 复制全文 */}
                            <button
                              onClick={() => copyToClipboard(`提问：\n${item.userPrompt}\n\n回答：\n${item.assistantReply}`, item.id)}
                              className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2 py-1 text-[11px] text-mute hover:text-ink"
                            >
                              {copiedId === item.id ? <Check className="h-3 w-3 text-sage" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedId === item.id ? "已复制" : "复制案卷"}</span>
                            </button>

                            {/* 单条导出 */}
                            <button
                              onClick={() => exportJson(item, `chat_${item.id}_${item.anonId.slice(0, 8)}.json`)}
                              className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2 py-1 text-[11px] text-mute hover:text-ink"
                            >
                              <FileText className="h-3 w-3" />
                              <span>导出JSON</span>
                            </button>
                          </div>
                        </div>

                        {/* 命盘背景档案 */}
                        {(item.profileName || item.profileBirth || item.profileGender) && (
                          <div className="rounded-lg border border-line/60 bg-paper p-3 text-[12px]">
                            <span className="font-medium text-ink">盘面背景档案：</span>
                            <span className="ml-2 text-mute">
                              {[
                                item.profileName && `姓名：${item.profileName}`,
                                item.profileBirth && `生辰：${item.profileBirth}`,
                                item.profileGender && `性别：${item.profileGender}`,
                              ]
                                .filter(Boolean)
                                .join(" ｜ ")}
                            </span>
                          </div>
                        )}

                        {/* 提问全文 */}
                        <div>
                          <div className="text-[12px] font-bold text-ink">提问全文：</div>
                          <div className="mt-1.5 whitespace-pre-wrap rounded-xl border border-line bg-paper p-3.5 text-[13px] leading-relaxed text-ink">
                            {item.userPrompt}
                          </div>
                        </div>

                        {/* AI 回复全文 (支持 Markdown 解析与思维链折叠) */}
                        <div>
                          {(() => {
                            const thinkMatch = item.assistantReply.match(/<think>([\s\S]*?)<\/think>/i);
                            const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
                            const cleanReply = thinkMatch
                              ? item.assistantReply.replace(/<think>[\s\S]*?<\/think>/i, "").trim()
                              : item.assistantReply;

                            return (
                              <>
                                <div className="flex items-center justify-between text-[12px] font-bold text-ink">
                                  <span>AI 回复全文：</span>
                                  <span className="text-[11px] font-normal text-mute">
                                    {viewMode === "markdown" ? "已启用 Markdown 语法高亮排版" : "纯文本原始内容"}
                                  </span>
                                </div>

                                {thinkContent && (
                                  <details className="mt-2 mb-2 rounded-xl border border-line/70 bg-paper-2 p-3 text-[12px] text-mute group">
                                    <summary className="cursor-pointer font-medium text-ink flex items-center justify-between select-none">
                                      <span className="flex items-center gap-1.5 text-sage font-medium">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>推演心智链 (CoT 依据)</span>
                                      </span>
                                      <span className="text-[11px] text-mute group-open:hidden">点击展开审查</span>
                                      <span className="text-[11px] text-mute hidden group-open:inline">收起</span>
                                    </summary>
                                    <div className="mt-2 whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-ink/80 border-t border-line/40 pt-2">
                                      {thinkContent}
                                    </div>
                                  </details>
                                )}

                                {viewMode === "markdown" ? (
                                  <div className="mt-1.5 max-h-[480px] overflow-y-auto rounded-xl border border-line bg-paper p-4 font-song text-[13.5px] leading-relaxed text-ink-2">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                      {cleanReply}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <pre className="mt-1.5 max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-paper p-4 font-mono text-[12px] leading-relaxed text-ink-2">
                                    {cleanReply}
                                  </pre>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {item.userAgent && (
                          <div className="truncate text-[10.5px] text-mute">User-Agent: {item.userAgent}</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 分页控制器 */}
              <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[12px] text-mute">
                <div>
                  共 <b className="text-ink">{chats.total}</b> 条问卜记录 · 第 {chats.page} / {chats.totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={chats.page <= 1}
                    onClick={() => void loadChats(chats.page - 1)}
                    className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 transition hover:bg-paper-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>上一页</span>
                  </button>
                  <button
                    disabled={chats.page >= chats.totalPages}
                    onClick={() => void loadChats(chats.page + 1)}
                    className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 transition hover:bg-paper-2 disabled:opacity-40"
                  >
                    <span>下一页</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: 纸篓心事 (LET-GO ARCHIVE) ==================== */}
        {activeTab === "letgos" && (
          <div className="space-y-4">
            {/* 搜索与导出 */}
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-mute" />
                <input
                  type="text"
                  value={letgoSearch}
                  onChange={(e) => setLetgoSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void loadLetgos(1, letgoSearch)}
                  placeholder="搜索纸篓心事文字、anonId或IP，回车确认……"
                  className="w-full rounded-xl border border-line bg-paper py-2 pl-10 pr-4 text-[13px] text-ink outline-none transition focus:border-ink/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[12px] text-mute">
                  累计丢弃 <b className="font-song text-ink">{letgos.total}</b> 件放不下的事
                </span>
                <button
                  onClick={() => void loadLetgos(1, letgoSearch)}
                  className="rounded-xl bg-ink px-4 py-2 text-[13px] font-medium text-paper transition hover:bg-ink/90"
                >
                  检索
                </button>
                <button
                  onClick={() => exportJson(letgos.items, `suanle_letgos_page${letgos.page}.json`)}
                  className="flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-2 text-[12px] text-ink-2 transition hover:bg-paper-2"
                  title="导出本页纸篓心事"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  <span>导出JSON</span>
                </button>
              </div>
            </div>

            {/* 心事便签瀑布流 (带 IP 归属地) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {letgos.items.length === 0 ? (
                <div className="col-span-full py-16 text-center text-mute">纸篓中暂无记录</div>
              ) : (
                letgos.items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-line bg-card p-5 shadow-xs transition hover:shadow-md"
                  >
                    <div className="absolute top-3 right-3 text-[10px] font-mono text-mute/60">
                      #{item.id}
                    </div>

                    <div className="font-song text-[14.5px] leading-relaxed text-ink">
                      {item.content ? (
                        item.content
                      ) : (
                        <span className="italic text-mute/70">（未填写文字，仅点击揉纸入篓）</span>
                      )}
                    </div>

                    <div className="mt-5 border-t border-line/60 pt-3 text-[10.5px] text-mute">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{formatTime(item.createdAt)}</span>
                        <div className="flex items-center gap-1" title={item.geo || item.ip}>
                          <MapPin className="h-3 w-3 text-seal/70" />
                          <span className="truncate max-w-[100px]">{item.geo || item.ip}</span>
                        </div>
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-mute/80 flex items-center gap-1.5">
                        <span className="font-medium text-ink-2">{getUserAlias(item.anonId).name}</span>
                        <span className="font-mono text-[9px] text-mute">{item.anonId ? `${item.anonId.slice(0, 8)}…` : "游客"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 分页 */}
            <div className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-[12px] text-mute">
              <div>
                共 <b className="text-ink">{letgos.total}</b> 条记录 · 第 {letgos.page} / {letgos.totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={letgos.page <= 1}
                  onClick={() => void loadLetgos(letgos.page - 1)}
                  className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 transition hover:bg-paper-2 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>上一页</span>
                </button>
                <button
                  disabled={letgos.page >= letgos.totalPages}
                  onClick={() => void loadLetgos(letgos.page + 1)}
                  className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 transition hover:bg-paper-2 disabled:opacity-40"
                >
                  <span>下一页</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: 缘友台账与风控 (USERS REGISTRY) ==================== */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* 搜索与导出 */}
            <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-mute" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void loadUsers(1, userSearch)}
                  placeholder="搜索缘友称呼、常在城市、anonId 或 IP，回车确认……"
                  className="w-full rounded-xl border border-line bg-paper py-2 pl-10 pr-4 text-[13px] text-ink outline-none transition focus:border-ink/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadUsers(1, userSearch)}
                  className="rounded-xl bg-ink px-4 py-2 text-[13px] font-medium text-paper transition hover:bg-ink/90"
                >
                  检索
                </button>
                <button
                  onClick={() => exportJson(users.items, `suanle_users_page${users.page}.json`)}
                  className="flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-2 text-[12px] text-ink-2 transition hover:bg-paper-2"
                  title="导出缘友台账"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  <span>导出JSON</span>
                </button>
              </div>
            </div>

            {/* 用户列表 (带详细 IP 归属地) */}
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-line bg-paper-2 text-[11.5px] font-medium text-mute">
                    <tr>
                      <th className="py-3 pl-4 pr-2">缘友雅称与标识</th>
                      <th className="px-3 py-3">风控态势</th>
                      <th className="px-3 py-3 text-right">对话量</th>
                      <th className="px-3 py-3 text-right">丢纸篓</th>
                      <th className="px-3 py-3 text-right">消耗 Tokens</th>
                      <th className="px-3 py-3 text-right">随喜功德</th>
                      <th className="px-3 py-3">IP 足迹与归属地</th>
                      <th className="px-3 py-3">最近活跃</th>
                      <th className="py-3 pl-2 pr-4 text-right">风控处置</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {users.items.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-mute">
                          暂无符合条件的缘友台账
                        </td>
                      </tr>
                    ) : (
                      users.items.map((u) => (
                        <tr key={u.anonId} className="transition hover:bg-paper/80">
                          <td className="py-3 pl-4 pr-2">
                            {(() => {
                              const alias = getUserAlias(u.anonId, u.profileName);
                              const hasProfileMeta = Boolean(u.profileBirth || u.profileCity || u.profileGender);
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[13.5px] ${alias.isReal ? "font-semibold text-ink" : "font-medium text-ink-2"}`}>
                                      {alias.name}
                                    </span>
                                    {alias.isReal ? (
                                      <span className="rounded bg-sage/20 px-1.5 py-0.5 text-[9.5px] font-medium text-sage">
                                        自填称呼
                                      </span>
                                    ) : (
                                      <span className="rounded bg-ink/5 px-1 py-0.2 text-[9.5px] font-mono text-mute">
                                        #{alias.tag}
                                      </span>
                                    )}
                                  </div>
                                  {hasProfileMeta && (
                                    <div className="flex items-center gap-1.5 text-[10.5px] text-mute flex-wrap">
                                      {u.profileBirth && <span className="font-mono text-ink-2">{u.profileBirth}</span>}
                                      {u.profileGender && <span>({u.profileGender})</span>}
                                      {u.profileCity && <span>· {u.profileCity}</span>}
                                    </div>
                                  )}
                                  <div
                                    onClick={() => {
                                      void navigator.clipboard.writeText(u.anonId);
                                    }}
                                    title="点击复制完整 anonId"
                                    className="cursor-pointer font-mono text-[10.5px] text-mute hover:text-ink truncate max-w-[130px]"
                                  >
                                    {u.anonId.slice(0, 12)}…
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-3">
                            {u.isBlocked && u.blockedReason?.startsWith("MIGRATED") ? (
                              <span
                                title={u.blockedReason}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-medium text-amber-600 dark:text-amber-400"
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                                已换机迁出
                              </span>
                            ) : u.isBlocked ? (
                              <span
                                title={u.blockedReason || "风控限制"}
                                className="inline-flex items-center gap-1 rounded-full bg-seal/15 px-2 py-0.5 text-[10.5px] font-medium text-seal"
                              >
                                <Ban className="h-3 w-3" />
                                封禁中
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5 text-[10.5px] font-medium text-sage">
                                <CheckCircle2 className="h-3 w-3" />
                                正常
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-ink">{u.totalChats}</td>
                          <td className="px-3 py-3 text-right font-mono text-ink">{u.totalLetgos}</td>
                          <td className="px-3 py-3 text-right font-mono text-mute">{u.totalTokens}</td>
                          <td className="px-3 py-3 text-right font-mono text-gold font-medium">
                            {u.totalMeritCents > 0 ? `¥${(u.totalMeritCents / 100).toFixed(2)}` : "—"}
                          </td>
                          <td className="px-3 py-3 text-[11px] text-mute">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-mute/80">最近：</span>
                              <span className="font-mono text-ink">{u.lastIp || "未知"}</span>
                              <span className="text-mute truncate max-w-[120px]" title={u.lastGeo}>
                                ({u.lastGeo || "未知"})
                              </span>
                            </div>
                            {u.firstIp && u.firstIp !== u.lastIp && (
                              <div className="flex items-center gap-1 text-[10px] text-mute/70">
                                <span>初访：</span>
                                <span>{u.firstIp}</span>
                                <span>({u.firstGeo || "未知"})</span>
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-mute">
                            {formatTime(u.lastActiveAt)}
                          </td>
                          <td className="py-3 pl-2 pr-4 text-right">
                            {u.isBlocked && u.blockedReason?.startsWith("MIGRATED") ? (
                              <button
                                onClick={() => void toggleBlockUser(u.anonId, true)}
                                title="点击可重新解禁此设备"
                                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 transition hover:bg-amber-500/20"
                              >
                                <span className="flex items-center gap-1">
                                  <Unlock className="h-3 w-3" /> 重启
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={() => void toggleBlockUser(u.anonId, u.isBlocked)}
                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                                  u.isBlocked
                                    ? "border-sage/40 bg-sage/10 text-sage hover:bg-sage/20"
                                    : "border-seal/30 bg-seal/10 text-seal hover:bg-seal/20"
                                }`}
                              >
                                {u.isBlocked ? (
                                  <span className="flex items-center gap-1">
                                    <Unlock className="h-3 w-3" /> 解除
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Ban className="h-3 w-3" /> 封禁
                                  </span>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[12px] text-mute">
                <div>
                  共 <b className="text-ink">{users.total}</b> 位缘友 · 第 {users.page} / {users.totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={users.page <= 1}
                    onClick={() => void loadUsers(users.page - 1)}
                    className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 transition hover:bg-paper-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>上一页</span>
                  </button>
                  <button
                    disabled={users.page >= users.totalPages}
                    onClick={() => void loadUsers(users.page + 1)}
                    className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 transition hover:bg-paper-2 disabled:opacity-40"
                  >
                    <span>下一页</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
