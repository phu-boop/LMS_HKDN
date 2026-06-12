-- ============================================================
-- Create provinces and wards tables
-- ============================================================

CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    province_id INTEGER NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(province_id, name)
);

CREATE INDEX idx_wards_province_id ON wards(province_id);
