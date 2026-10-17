-- PostgreSQL initialization script for 《算了 · Suanle》

CREATE TABLE IF NOT EXISTS letgo_events (
    id SERIAL PRIMARY KEY,
    anon_id TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS letgo_events_created_idx ON letgo_events(created_at DESC);

CREATE TABLE IF NOT EXISTS chat_logs (
    id SERIAL PRIMARY KEY,
    anon_id TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    user_prompt TEXT NOT NULL DEFAULT '',
    assistant_reply TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    tokens INTEGER NOT NULL DEFAULT 0,
    is_deep BOOLEAN NOT NULL DEFAULT false,
    profile_name TEXT NOT NULL DEFAULT '',
    profile_birth TEXT NOT NULL DEFAULT '',
    profile_gender TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_logs_created_idx ON chat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS chat_logs_anon_idx ON chat_logs(anon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_logs_ip_idx ON chat_logs(ip);

CREATE TABLE IF NOT EXISTS users_registry (
    anon_id TEXT PRIMARY KEY,
    first_ip TEXT NOT NULL DEFAULT '',
    last_ip TEXT NOT NULL DEFAULT '',
    total_chats INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    total_letgos INTEGER NOT NULL DEFAULT 0,
    total_merit_cents INTEGER NOT NULL DEFAULT 0,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    blocked_reason TEXT NOT NULL DEFAULT '',
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_registry_last_active_idx ON users_registry(last_active_at DESC);
CREATE INDEX IF NOT EXISTS users_registry_blocked_idx ON users_registry(is_blocked);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    anon_id TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL,
    tier TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    channel TEXT NOT NULL DEFAULT 'wechat',
    status TEXT NOT NULL DEFAULT 'claimed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_anon_idx ON orders(anon_id);

CREATE TABLE IF NOT EXISTS usage_log (
    id SERIAL PRIMARY KEY,
    anon_id TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'chat',
    tokens INTEGER NOT NULL DEFAULT 0,
    model TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS usage_log_anon_idx ON usage_log(anon_id, created_at);

CREATE TABLE IF NOT EXISTS cloud_backups (
    code TEXT PRIMARY KEY,
    anon_id TEXT NOT NULL DEFAULT '',
    payload TEXT NOT NULL DEFAULT '{}',
    ip TEXT NOT NULL DEFAULT '',
    claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_by TEXT NOT NULL DEFAULT '',
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cloud_backups_anon_idx ON cloud_backups(anon_id);
CREATE INDEX IF NOT EXISTS cloud_backups_expires_idx ON cloud_backups(expires_at);


