

-- =========================
-- GROUPS
-- =========================

CREATE TABLE IF NOT EXISTS groups(
     id SERIAL PRIMARY KEY,

     name VARCHAR(100) NOT NULL,
     description TEXT,

     created_by INT NOT NULL
     REFERENCES users(id)
     ON DELETE RESTRICT,

     currency VARCHAR(10) DEFAULT 'INR',

     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

