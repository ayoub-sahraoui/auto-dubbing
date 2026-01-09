# SRT Format Viewer - Feature Update

## What Changed

The **"Full Text"** tab has been replaced with an **"SRT Format"** tab that displays the transcript in standard SubRip subtitle format.

## SRT Format Tab Features

### 📄 **Standard SRT Display**
The transcript is now displayed in the industry-standard SRT (SubRip) format:

```
1
00:00:00,000 --> 00:00:05,120
First segment of transcribed text

2
00:00:05,120 --> 00:00:10,450
Second segment of transcribed text

3
00:00:10,450 --> 00:00:15,890
Third segment of transcribed text
```

### 🎯 **SRT Format Structure**
Each subtitle entry contains:
1. **Sequence number** (1, 2, 3, ...)
2. **Timestamp** in format: `HH:MM:SS,mmm --> HH:MM:SS,mmm`
3. **Subtitle text**
4. **Blank line separator**

### ✨ **Key Features**

#### 📋 **Easy Copy**
- One-click "Copy SRT" button
- Copies the entire SRT content to your clipboard
- Ready to paste into video players or editing software

#### 👁️ **Read-Only Display**
- The SRT view is read-only (no accidental edits)
- Always stays in sync with your segments
- Edit in "Segments" tab, view SRT in "SRT Format" tab

#### 📊 **File Statistics**
- **Subtitles**: Total number of subtitle entries
- **Characters**: Total character count
- **Format**: Shows "SubRip (.srt)" format indicator

### 🎬 **Use Cases**

✅ **Export for Video Players**
Copy the SRT and save it as a `.srt` file to use with video players like VLC, Windows Media Player, etc.

✅ **Import to Video Editors**
Paste into professional video editing software (Premiere, Final Cut, DaVinci Resolve)

✅ **Subtitle Services**
Upload to subtitle platforms or YouTube

✅ **Quality Review**
Check timing and text formatting in the standard subtitle format

✅ **Archive/Backup**
Save the SRT format for future use or documentation

### 🔧 **Technical Details**

**Time Format**: `HH:MM:SS,mmm`
- Hours: 2 digits (00-99)
- Minutes: 2 digits (00-59)
- Seconds: 2 digits (00-59)
- Milliseconds: 3 digits (000-999)

**Encoding**: UTF-8 (supports all languages)

**Line Endings**: Standard format compatible with all video players

### 💡 **Tips**

**Tip 1**: After making edits in the "Segments" tab, the SRT automatically updates

**Tip 2**: Use the "Copy SRT" button instead of manually selecting all text

**Tip 3**: Save the copied SRT with a `.srt` extension (e.g., `my_video.srt`)

**Tip 4**: Place the SRT file in the same folder as your video with the same name for auto-detection

**Tip 5**: Most video players will automatically load `video.srt` for `video.mp4`

## Workflow

1. **Review Transcript** → Go to Review Transcript step
2. **Edit if Needed** → Use "Segments" tab to fix any errors
3. **View SRT** → Switch to "SRT Format" tab
4. **Copy** → Click "Copy SRT" button
5. **Save** → Paste into a text file and save as `.srt`
6. **Use** → Import into your video player or editing software

## Benefits Over Plain Text

✅ **Industry Standard**: SRT is universally recognized
✅ **Includes Timing**: Shows exact start/end times for each subtitle
✅ **Video Player Compatible**: Works with all major video players
✅ **Professional**: Proper formatting for video production
✅ **Easy Export**: Copy and save directly as `.srt` file

---

**Note**: The SRT format is automatically generated from your segments. Any edits should be made in the "Segments" tab, and the SRT will update automatically.
