"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Activity,
  AlertCircle,
  Ban,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  HardDrive,
  KeyRound,
  Lock,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import type { SystemTelemetry } from "@/lib/server/telemetry";

type TabKey = "cockpit" | "chats" | "letgos" | "users";

interface ChatLogItem {
  id: number;
  anonId: string;
  ip: string;
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
  createdAt: string;
}

interface UserRegistryItem {
  anonId: string;
  firstIp: string;
  lastIp: string;
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
  if (bytes === 0) return "0 B";
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
      } else if (res.status === 401) {
        setAuthenticated(false);
      }
    } catch {
      /* 静默处理 */
    }
  };

  // 加载对话列表
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
      /* 静默处理 */
    }
  };

  // 加载纸篓列表
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
      /* 静默处理 */
    }
  };

  // 加载缘友列表
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
      /* 静默处理 */
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
    }, 15000);
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
      <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12 text-ink selection:bg-seal/15">
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

  // 鉴权通过：进入掌阁内阁主控制台
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-seal/15">
      {/* 顶部常驻导航栏 */}
      <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur-md">
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
              <p className="text-[11px] text-mute">合规审查流水 · 服务器遥测 · 双服务商熔断</p>
            </div>
          </div>

          {/* 实时状态指示胶囊 */}
          <div className="hidden items-center gap-3 md:flex">
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
              title={autoRefresh ? "自动轮询中 (15s)" : "已暂停自动轮询"}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] transition ${
                autoRefresh
                  ? "border-sage/40 bg-sage/10 text-sage"
                  : "border-line bg-paper text-mute hover:text-ink"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{autoRefresh ? "15s轮询" : "定格"}</span>
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
        {activeTab === "cockpit" && telemetry && (
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
                  {/* CPU 水位 */}
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
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper-2">
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
                  </div>

                  {/* 物理内存水位 */}
                  <div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-ink-2">宿主物理内存水位</span>
                      <span className="font-mono font-medium text-ink">
                        {formatBytes(telemetry.server.memory.usedBytes)} / {formatBytes(telemetry.server.memory.totalBytes)} (
                        {telemetry.server.memory.usedPercent}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          telemetry.server.memory.usedPercent > 85 ? "bg-seal" : "bg-sage"
                        }`}
                        style={{ width: `${telemetry.server.memory.usedPercent}%` }}
                      />
                    </div>
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
                    </div>
                  )}

                  {/* Node.js 进程轻量画像 */}
                  <div className="mt-4 rounded-xl border border-line bg-paper p-3 text-[11.5px] text-mute">
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
                        <span>chat_logs (对话审查日志)</span>
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
              </div>
            </div>

            {/* 案卷列表 */}
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-line bg-paper-2 text-[11.5px] font-medium text-mute">
                    <tr>
                      <th className="py-3 pl-4 pr-2">时刻</th>
                      <th className="px-3 py-3">缘友 / IP</th>
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
                              <div
                                onClick={() => {
                                  setChatSearch(item.anonId);
                                  void loadChats(1, item.anonId, chatModelFilter);
                                }}
                                title="点击过滤此缘友"
                                className="cursor-pointer font-mono text-[11px] font-medium text-ink hover:underline"
                              >
                                {item.anonId.slice(0, 10)}…
                              </div>
                              <div className="text-[10px] text-mute">{item.ip}</div>
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
                            <td className="max-w-[220px] truncate px-3 py-3 text-ink" title={item.userPrompt}>
                              {item.userPrompt}
                            </td>
                            <td className="max-w-[280px] truncate px-3 py-3 text-mute" title={item.assistantReply}>
                              {item.assistantReply.replace(/\n+/g, " ").slice(0, 80)}
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

              {/* 展开的详情展示 */}
              {expandedChatId !== null && (
                <div className="border-t border-line bg-paper-2/40 p-5">
                  {(() => {
                    const item = chats.items.find((c) => c.id === expandedChatId);
                    if (!item) return null;
                    return (
                      <div className="space-y-4 rounded-xl border border-line bg-card p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 text-[12px] text-mute">
                          <div className="flex items-center gap-3">
                            <span>
                              缘友：<b className="font-mono text-ink">{item.anonId}</b>
                            </span>
                            <span>
                              IP：<b className="font-mono text-ink">{item.ip}</b>
                            </span>
                            <span>
                              模型：<b className="font-mono text-ink">{item.model}</b>
                            </span>
                          </div>
                          <div>时刻：{formatTime(item.createdAt)}</div>
                        </div>

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

                        <div>
                          <div className="text-[12px] font-bold text-ink">提问全文：</div>
                          <div className="mt-1.5 whitespace-pre-wrap rounded-xl border border-line bg-paper p-3.5 text-[13px] leading-relaxed text-ink">
                            {item.userPrompt}
                          </div>
                        </div>

                        <div>
                          <div className="text-[12px] font-bold text-ink">AI 回复全文：</div>
                          <div className="mt-1.5 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-paper p-3.5 font-song text-[13.5px] leading-relaxed text-ink-2">
                            {item.assistantReply}
                          </div>
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
            {/* 搜索 */}
            <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-4">
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

              <div className="flex items-center gap-3">
                <span className="text-[12px] text-mute">
                  累计丢弃 <b className="font-song text-ink">{letgos.total}</b> 件放不下的事
                </span>
                <button
                  onClick={() => void loadLetgos(1, letgoSearch)}
                  className="rounded-xl bg-ink px-4 py-2 text-[13px] font-medium text-paper transition hover:bg-ink/90"
                >
                  检索
                </button>
              </div>
            </div>

            {/* 心事便签瀑布流 */}
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
                        <span>{item.ip}</span>
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[9.5px] text-mute/80">
                        {item.anonId || "游客"}
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
            {/* 搜索 */}
            <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-mute" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void loadUsers(1, userSearch)}
                  placeholder="搜索 anonId、初访 IP 或最近活跃 IP，回车确认……"
                  className="w-full rounded-xl border border-line bg-paper py-2 pl-10 pr-4 text-[13px] text-ink outline-none transition focus:border-ink/40"
                />
              </div>

              <button
                onClick={() => void loadUsers(1, userSearch)}
                className="rounded-xl bg-ink px-4 py-2 text-[13px] font-medium text-paper transition hover:bg-ink/90"
              >
                检索
              </button>
            </div>

            {/* 用户列表 */}
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-line bg-paper-2 text-[11.5px] font-medium text-mute">
                    <tr>
                      <th className="py-3 pl-4 pr-2">缘友标识 (anonId)</th>
                      <th className="px-3 py-3">风控态势</th>
                      <th className="px-3 py-3 text-right">对话量</th>
                      <th className="px-3 py-3 text-right">丢纸篓</th>
                      <th className="px-3 py-3 text-right">消耗 Tokens</th>
                      <th className="px-3 py-3 text-right">随喜功德</th>
                      <th className="px-3 py-3">IP 足迹</th>
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
                          <td className="py-3 pl-4 pr-2 font-mono text-[11px] font-medium text-ink">
                            {u.anonId}
                          </td>
                          <td className="px-3 py-3">
                            {u.isBlocked ? (
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
                            <div>初访：{u.firstIp || "未知"}</div>
                            <div>最近：{u.lastIp || "未知"}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-mute">
                            {formatTime(u.lastActiveAt)}
                          </td>
                          <td className="py-3 pl-2 pr-4 text-right">
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
