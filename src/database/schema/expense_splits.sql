-- =========================
-- EXPENSE SPLITS
-- =========================
CREATE TABLE IF NOT EXISTS expense_splits (
    id SERIAL PRIMARY KEY,
    expense_id INT NOT NULL
        REFERENCES expenses(id)
        ON DELETE CASCADE,
    user_id INT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,
    amount_owed NUMERIC(12,2) NOT NULL
        CHECK(amount_owed > 0),
    razorpay_order_id VARCHAR(255),
    settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(expense_id, user_id)
);
