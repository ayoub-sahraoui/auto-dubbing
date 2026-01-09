# 🚀 Quick Start Guide

**For absolute beginners** - Get Auto-Dubbing running in 10 minutes!

## ⚡ Step 1: Install Required Software (One-time setup)

### 1.1 Install Node.js
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS version** (v18 or higher)
3. Run the installer
4. Accept all defaults and click "Next" → "Install"
5. Wait for installation to complete

**Verify**: Open a new terminal/PowerShell and run:
```bash
node --version
```
You should see something like `v18.x.x` or higher ✅

### 1.2 Install Python
1. Go to [python.org](https://www.python.org/downloads/)
2. Download **Python 3.11** (recommended)
3. **IMPORTANT**: Check ☑️ "Add Python to PATH" during installation
4. Run the installer
5. Click "Install Now"

**Verify**: Open a new terminal/PowerShell and run:
```bash
python --version
```
You should see `Python 3.11.x` or similar ✅

### 1.3 Install FFmpeg

#### Windows
1. Go to [ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Click "Windows" → Download "ffmpeg-release-essentials.zip"
3. Extract to `C:\ffmpeg`
4. Add to PATH:
   - Search "Environment Variables" in Windows
   - Click "Environment Variables"
   - Under "System Variables", find "Path", click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin`
   - Click "OK" on all windows
5. **Restart your computer** (important!)

**Verify**: After restart, open PowerShell and run:
```bash
ffmpeg -version
```
You should see FFmpeg version info ✅

#### macOS
1. Install Homebrew first (if not installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install FFmpeg:
   ```bash
   brew install ffmpeg
   ```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

## ⚡ Step 2: Download the Project

### Option A: Using Git (Recommended)
```bash
# Install Git if you don't have it: https://git-scm.com/

# Clone the repository
git clone https://github.com/yourusername/auto-dubbing.git
cd auto-dubbing
```

### Option B: Download ZIP
1. Go to the GitHub repository
2. Click green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP file
5. Open terminal/PowerShell in the extracted folder

## ⚡ Step 3: Setup Frontend (5 minutes)

Open terminal in the project folder:

```bash
# Install dependencies
npm install
```

This will take ~3-5 minutes. ☕ Grab a coffee!

## ⚡ Step 4: Setup Backend (10 minutes)

### Windows PowerShell
```powershell
# Go to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# If you get error about execution policy, run this:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then try activating again

# Install Python packages
pip install -r requirements.txt
```

### macOS/Linux Terminal
```bash
# Go to backend folder
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

**Note**: First time will download ~2-4GB of AI models. This is normal!

## ⚡ Step 5: Configure (1 minute)

Check if `backend/.env` file exists. It should have:

```env
WHISPER_MODEL=large-v3-turbo
WHISPER_DEVICE=auto
WHISPER_COMPUTE_TYPE=auto
CORS_ORIGINS=http://localhost:5173
```

If the file doesn't exist, copy `.env.example` to `.env`

## ⚡ Step 6: Run the Application (2 terminals needed!)

### Terminal 1: Start Backend

```bash
# Navigate to backend folder
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Start server
uvicorn main:app --reload
```

**Expected output**:
```
INFO:     🚀 Auto-Dubbing API starting up...
INFO:     Uvicorn running on http://127.0.0.1:8000
```

✅ Backend is running! Leave this terminal open.

### Terminal 2: Start Frontend

Open a **NEW** terminal in the project root:

```bash
# Start frontend
npm run dev
```

**Expected output**:
```
  VITE v7.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

✅ Frontend is running! Leave this terminal open.

## ⚡ Step 7: Open the Application

Open your browser and go to:
```
http://localhost:5173
```

You should see the Auto-Dubbing interface! 🎉

## 🎬 Step 8: Try It Out!

1. **Upload a video** (MP4, MKV, AVI - max 500MB)
2. **Click "Transcribe"** - Wait for AI to transcribe (2-15 min depending on video length)
3. **Review transcript** - Edit if needed
4. **Select language & voice** - Choose your target language
5. **Generate voiceover** - Wait for TTS (1-5 min)
6. **Merge & Download** - Get your dubbed video!

## 🐛 Quick Troubleshooting

### "Command not found" errors
- Make sure you installed Node.js, Python, and FFmpeg
- **Restart your computer** after installing FFmpeg
- Open a **new** terminal window

### "Module not found" in Python
```bash
# Make sure virtual environment is activated
# You should see (venv) at the start of your command line
cd backend
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # macOS/Linux

# Reinstall if needed
pip install -r requirements.txt
```

### "Port already in use"
```bash
# Kill the process using the port
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9
```

### Slow transcription
- This is normal on CPU! 
- For 5-min video: 10-15 minutes on CPU
- Use smaller model for faster results: Edit `backend/.env`:
  ```env
  WHISPER_MODEL=base
  ```

## 📝 Development Workflow

Every time you want to use the application:

1. **Open 2 terminals**
2. **Terminal 1** (Backend):
   ```bash
   cd backend
   .\venv\Scripts\Activate.ps1  # or source venv/bin/activate
   uvicorn main:app --reload
   ```
3. **Terminal 2** (Frontend):
   ```bash
   npm run dev
   ```
4. **Open browser**: http://localhost:5173

## 💡 Tips

- ✅ Keep both terminals open while using the app
- ✅ First run downloads AI models (~2-4GB) - be patient
- ✅ Smaller videos process faster (try 1-2 min videos first)
- ✅ GPU acceleration makes it 5-10x faster
- ✅ You can edit transcripts before generating voiceover
- ✅ SRT format tab lets you copy subtitles

## 🎓 Next Steps

Once you're comfortable:
- Try different voices and languages
- Experiment with longer videos
- Read the full [README.md](README.md) for advanced features
- Check [WHISPER_ACCURACY_GUIDE.md](backend/WHISPER_ACCURACY_GUIDE.md) to improve transcription quality

## 🆘 Need Help?

1. Check the [main README](README.md) Troubleshooting section
2. Make sure you followed ALL steps above
3. Restart your computer after installing FFmpeg
4. Use a new terminal window after installations

---

**You're all set! Happy dubbing! 🎬🎉**
