-- Three-Layer ASCII Art Security System Database Setup

CREATE DATABASE IF NOT EXISTS ascii_security_db;
USE ascii_security_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ASCII artifacts table with three-layer security tracking
CREATE TABLE IF NOT EXISTS ascii_artifacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    ascii_content LONGTEXT NOT NULL,
    watermark_hash VARCHAR(255) NOT NULL,
    encryption_key_hash VARCHAR(255) NOT NULL,
    integrity_score INT DEFAULT 100,
    tamper_status ENUM('INTACT', 'MINOR_TAMPERING', 'MODERATE_TAMPERING', 'MAJOR_TAMPERING', 'CORRUPTED') DEFAULT 'INTACT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Verification logs for tracking integrity checks
CREATE TABLE IF NOT EXISTS verification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artifact_id INT,
    verification_result JSON,
    integrity_score INT,
    tamper_detected BOOLEAN,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artifact_id) REFERENCES ascii_artifacts(id) ON DELETE CASCADE
);

-- Insert demo user
INSERT INTO users (username, email, password_hash) VALUES 
('demo_user', 'demo@example.com', SHA2('demo123', 256))
ON DUPLICATE KEY UPDATE username=username;

-- Create indexes for better performance
CREATE INDEX idx_artifacts_user_id ON ascii_artifacts(user_id);
CREATE INDEX idx_artifacts_tamper_status ON ascii_artifacts(tamper_status);
CREATE INDEX idx_verification_logs_artifact_id ON verification_logs(artifact_id);
CREATE INDEX idx_verification_logs_verified_at ON verification_logs(verified_at);