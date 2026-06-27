-- =========================
-- USERS
-- =========================

CREATE TABLE IF NOT EXISTS users(
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


