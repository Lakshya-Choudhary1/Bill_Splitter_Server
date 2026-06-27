
-- =========================
-- GROUP MEMBERS
-- =========================

CREATE TABLE IF NOT EXISTS group_members(
     id SERIAL PRIMARY KEY,

     group_id INT NOT NULL
     REFERENCES groups(id)
     ON DELETE CASCADE,

     user_id INT NOT NULL
     REFERENCES users(id)
     ON DELETE CASCADE,

     role VARCHAR(20) DEFAULT 'member'
     CHECK(role IN ('admin','member')),

     joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

     UNIQUE(group_id,user_id)
);


