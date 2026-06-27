
-- =========================
-- EXPENSES
-- =========================

CREATE TABLE IF NOT EXISTS expenses(
     id SERIAL PRIMARY KEY,

     group_id INT NOT NULL
     REFERENCES groups(id)
     ON DELETE CASCADE,

     paid_by INT NOT NULL
     REFERENCES users(id)
     ON DELETE RESTRICT,

     title VARCHAR(150) NOT NULL,

     description TEXT,

     amount NUMERIC(12,2) NOT NULL
     CHECK(amount > 0),

     currency VARCHAR(10) DEFAULT 'INR',

     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

