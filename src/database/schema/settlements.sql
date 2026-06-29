-- =========================
-- SETTLEMENTS
-- =========================
CREATE TABLE IF NOT EXISTS settlements (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL
        REFERENCES groups(id)
        ON DELETE CASCADE,
    expense_id INT
        REFERENCES expenses(id)
        ON DELETE SET NULL,
    from_user INT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,
    to_user INT NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL
        CHECK(amount > 0),
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(20)
        CHECK(payment_method IN ('upi', 'cash', 'bank', 'other')),
    status VARCHAR(20) DEFAULT 'completed'
        CHECK(status IN ('pending', 'completed', 'failed')),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    paid_at TIMESTAMP,
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK(from_user <> to_user)
);
