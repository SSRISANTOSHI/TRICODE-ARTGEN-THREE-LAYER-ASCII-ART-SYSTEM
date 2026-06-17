# 🔐 Three-Layer ASCII Art Security System

A novel steganographic system that combines ASCII art generation, AES encryption, and fragile watermarking for secure data transmission with tamper detection.

## 🚀 Features

### Layer 1: ASCII Art Generation
- Convert text and images to ASCII art
- Multiple character sets (standard, dense, simple, dots, blocks)
- Customizable output width and styling
- Support for various input formats

### Layer 2: Encrypted Payload Embedding
- AES encryption for secret messages
- Invisible character steganography
- Data embedded in ASCII spacing patterns
- Base64 encoding for binary data

### Layer 3: Fragile Watermark + Tamper Detection ⭐ **NEW**
- Fragile watermark using invisible Unicode characters
- SHA-256 hash-based integrity verification
- Tamper detection with integrity scoring
- Real-time verification status

## 🏗️ Architecture

```
Frontend (React.js + CSS3)
├── ASCII Art Generation
├── Three-Layer Security Processing
├── Watermark Embedding/Verification
└── Tamper Detection UI

Backend (Flask + MySQL)
├── User Management
├── Artifact Storage
├── Watermark Hash Storage
└── Integrity Verification Logs
```

## 📋 Prerequisites

### Frontend
- Node.js 16+
- npm or yarn

### Backend
- Python 3.8+
- MySQL 8.0+
- pip

## 🛠️ Installation

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Setup MySQL database
mysql -u root -p < setup_database.sql

# Start Flask server
python app.py
```

## 🔄 Example Flow

1. **User uploads message** → AES encrypts → ciphertext
2. **ASCII art generated** from text/image input
3. **Ciphertext hidden** in ASCII spacing (Layer 2)
4. **Fragile watermark hash generated** → hidden as invisible markers (Layer 3)
5. **Receiver extracts** → verifies watermark → decrypts only if authentic

## 🎯 Usage

### Encoding (Three-Layer Security)
1. Generate or upload ASCII art
2. Enter secret message
3. Set encryption key
4. Set user key for watermarking
5. Apply three-layer security
6. Share the secured ASCII art

### Decoding (Verification & Extraction)
1. Paste secured ASCII art
2. Enter decryption key
3. Enter user key for verification
4. System verifies watermark integrity
5. Extracts secret data if authentic

## 🛡️ Security Features

### Integrity Scores
- **100%**: INTACT - No tampering detected
- **75%**: MINOR_TAMPERING - Small modifications
- **50%**: MODERATE_TAMPERING - Moderate changes
- **25%**: MAJOR_TAMPERING - Significant alterations
- **0%**: CORRUPTED - Watermark destroyed

### Tamper Detection
- Real-time watermark verification
- Hash-based integrity checking
- Visual integrity status indicators
- Detailed tamper analysis

## 🔧 Configuration

### Database Configuration (backend/app.py)
```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'ascii_security_db',
    'user': 'root',
    'password': 'your_password',
    'port': 3306
}
```

### Security Settings
- Watermark markers: Unicode invisible characters
- Hash algorithm: SHA-256
- Encryption: AES-256
- Steganography: Zero-width characters

## 📊 Database Schema

### ascii_artifacts
- Stores secured ASCII art with metadata
- Tracks integrity scores and tamper status
- Links to user accounts

### verification_logs
- Records all verification attempts
- Maintains audit trail
- Tracks integrity changes over time

## 🎨 UI Features

- **Theme Toggle**: Light/Dark mode
- **Security Toggle**: 2-Layer/3-Layer modes
- **Real-time Status**: Integrity indicators
- **Export Options**: TXT, HTML, JSON formats
- **Responsive Design**: Mobile-friendly interface

## 🔍 Technical Details

### Invisible Characters Used
- `\\u2060`: Word joiner (watermark start)
- `\\u2061`: Function application (watermark end)
- `\\u2062`: Invisible times (bit 0)
- `\\u2063`: Invisible separator (bit 1)
- `\\u200B`: Zero-width space (data bit 0)
- `\\u200C`: Zero-width non-joiner (data bit 1)

### Watermark Distribution
- Chunks distributed across ASCII lines
- Strategic placement for maximum fragility
- Hash verification with user key

## 🚨 Security Considerations

1. **User Key Management**: Keep user keys secure
2. **Watermark Fragility**: Any modification breaks integrity
3. **Hash Verification**: Always verify before decryption
4. **Key Storage**: Backend stores only hashed keys
5. **Audit Trail**: All verifications are logged

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Novelty

This system is no longer just steganography — it now has **integrity protection like a digital signature but inside ASCII art**, making it a unique three-layer security solution for covert communication with tamper detection.