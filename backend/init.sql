-- Initialize Database Schema for Multi-Tenant Conference System

CREATE TABLE conferences (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    venue_info TEXT,
    wifi_ssid VARCHAR(100),
    wifi_wpa VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'organizer', -- 'superadmin', 'organizer'
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE speakers (
    id SERIAL PRIMARY KEY,
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    speaker_ref VARCHAR(100) NOT NULL, -- e.g., 'sp1' from original JSON
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    institution VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    bio TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conference_id, speaker_ref)
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    session_ref VARCHAR(100) NOT NULL, -- e.g., 's1' from original JSON
    title_tr VARCHAR(255),
    title_en VARCHAR(255),
    description_tr TEXT,
    description_en TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    room VARCHAR(100),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conference_id, session_ref)
);

CREATE TABLE session_speakers (
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, speaker_id)
);

CREATE TABLE attendees (
    device_id UUID NOT NULL,
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    institution VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, conference_id)
);

-- Insert Default Super Admin (password: admin123 -> you should change this later)
-- Using bcrypt hash for 'admin123'
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$wE/.7x41L6Jb9iXhGWe5wObiZ8xO8s.RQKz3B/5E1bC6qO0r1G4sW', 'superadmin');
