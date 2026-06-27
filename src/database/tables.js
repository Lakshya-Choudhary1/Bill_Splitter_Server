const tables = `

-- ======================
-- DROP TABLE
-- ======================
-- DROP TABLE IF EXISTS settlements;
-- DROP TABLE IF EXISTS expense_splits;
-- DROP TABLE IF EXISTS expenses;
-- DROP TABLE IF EXISTS group_invitations;
-- DROP TABLE IF EXISTS group_members;
-- DROP TABLE IF EXISTS groups;
-- DROP TABLE IF EXISTS users;

-- =========================
-- USERS
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE,

    password_hashed TEXT,

    upi_id VARCHAR(100) UNIQUE,

    avatar_url TEXT,

    auth_provider VARCHAR(20) DEFAULT 'local',
    google_id VARCHAR(255) UNIQUE,

    is_verified BOOLEAN DEFAULT FALSE,

    verification_token TEXT,
    verification_token_expiry TIMESTAMP,

    reset_password_token TEXT,
    reset_password_token_expiry TIMESTAMP,

    currency VARCHAR(10) DEFAULT 'INR',

    invite_code VARCHAR(20) UNIQUE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);



-- =========================
-- GROUPS
-- =========================

CREATE TABLE IF NOT EXISTS groups (
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



-- =========================
-- GROUP MEMBERS
-- =========================

CREATE TABLE IF NOT EXISTS group_members (
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

    UNIQUE(group_id, user_id)
);



-- =========================
-- GROUP INVITATIONS
-- =========================

CREATE TABLE IF NOT EXISTS group_invitations (
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
    CHECK(status IN ('pending','accepted','rejected')),

    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(group_id, invited_user)
);



-- =========================
-- EXPENSES
-- =========================

CREATE TABLE IF NOT EXISTS expenses (
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

    settled BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(expense_id, user_id)
);



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
    CHECK(payment_method IN ('upi','cash','bank','other')),

    status VARCHAR(20) DEFAULT 'completed'
    CHECK(status IN ('pending','completed','failed')),

    transaction_id VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK(from_user <> to_user)
);
`;

export default tables;