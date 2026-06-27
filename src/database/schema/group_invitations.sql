
-- =========================
-- GROUP INVITATIONS
-- =========================

CREATE TABLE IF NOT EXISTS group_invitations(
     id SERIAL PRIMARY KEY,

     group_id INT NOT NULL
     REFERENCES groups(id)
     ON DELETE CASCADE,

     invited_by INT NOT NULL
     REFERENCES users(id)
     ON DELETE CASCADE,

     invited_user INT NOT NULL
     REFERENCES users(id)
     ON DELETE CASCADE,

     status VARCHAR(20) DEFAULT 'pending'
     CHECK(status IN 
     ('pending','accepted','rejected')),

     expires_at TIMESTAMP,

     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

     UNIQUE(group_id,invited_user)
);

