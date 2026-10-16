-- PostgreSQL initialization script for 《算了 · Suanle》

CREATE TABLE IF NOT EXISTS letgo_events (
    id SERIAL PRIMARY KEY,
    anon_id TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS letgo_events_created_idx ON letgo_events(created_at);

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
