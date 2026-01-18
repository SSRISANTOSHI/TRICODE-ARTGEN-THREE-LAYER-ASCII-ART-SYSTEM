from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import hashlib
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'ascii_security_db',
    'user': 'root',
    'password': '',
    'port': 3306
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None

def init_database():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create ascii_artifacts table
        cursor.execute('''
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
            )
        ''')
        
        # Create verification_logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS verification_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                artifact_id INT,
                verification_result JSON,
                integrity_score INT,
                tamper_detected BOOLEAN,
                verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (artifact_id) REFERENCES ascii_artifacts(id) ON DELETE CASCADE
            )
        ''')
        
        connection.commit()
        cursor.close()
        connection.close()
        print("Database initialized successfully")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

@app.route('/api/store-artifact', methods=['POST'])
def store_artifact():
    data = request.get_json()
    user_id = data.get('user_id', 1)  # Default user for demo
    title = data.get('title')
    ascii_content = data.get('ascii_content')
    watermark_hash = data.get('watermark_hash')
    encryption_key = data.get('encryption_key')
    
    if not all([title, ascii_content, watermark_hash, encryption_key]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    encryption_key_hash = hashlib.sha256(encryption_key.encode()).hexdigest()
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute('''
            INSERT INTO ascii_artifacts 
            (user_id, title, ascii_content, watermark_hash, encryption_key_hash) 
            VALUES (%s, %s, %s, %s, %s)
        ''', (user_id, title, ascii_content, watermark_hash, encryption_key_hash))
        
        connection.commit()
        artifact_id = cursor.lastrowid
        
        return jsonify({
            'message': 'Artifact stored successfully',
            'artifact_id': artifact_id
        }), 201
        
    except Error as e:
        return jsonify({'error': f'Storage failed: {str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/verify-artifact', methods=['POST'])
def verify_artifact():
    data = request.get_json()
    artifact_id = data.get('artifact_id')
    verification_result = data.get('verification_result')
    
    if not all([artifact_id, verification_result]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Store verification log
        cursor.execute('''
            INSERT INTO verification_logs 
            (artifact_id, verification_result, integrity_score, tamper_detected) 
            VALUES (%s, %s, %s, %s)
        ''', (
            artifact_id, 
            json.dumps(verification_result),
            verification_result.get('score', 0),
            verification_result.get('tamperDetected', True)
        ))
        
        # Update artifact status
        cursor.execute('''
            UPDATE ascii_artifacts 
            SET integrity_score = %s, tamper_status = %s, last_verified = CURRENT_TIMESTAMP
            WHERE id = %s
        ''', (
            verification_result.get('score', 0),
            verification_result.get('status', 'CORRUPTED'),
            artifact_id
        ))
        
        connection.commit()
        
        return jsonify({
            'message': 'Verification recorded successfully',
            'verification_result': verification_result
        }), 200
        
    except Error as e:
        return jsonify({'error': f'Verification failed: {str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    # Skip database init for demo
    app.run(debug=True, host='0.0.0.0', port=5002)