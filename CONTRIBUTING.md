# 🤝 Contributing to Auto-Dubbing

Thank you for your interest in contributing to Auto-Dubbing! This guide will help you get started.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/auto-dubbing.git
   cd auto-dubbing
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/auto-dubbing.git
   ```
4. **Follow the setup** in [README.md](README.md)

## 💻 Development Setup

### Frontend Development

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Development

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
.\venv\Scripts\Activate.ps1  # Windows

# Install dev dependencies
pip install -r requirements.txt
pip install black flake8 mypy  # Code formatting and linting

# Run with auto-reload
uvicorn main:app --reload --log-level debug

# Format code
black .

# Lint code
flake8 .
```

## 📁 Project Structure

```
auto-dubbing/
├── src/                      # Frontend React app
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── TranscriptEditor.tsx
│   │   └── ...
│   ├── api.ts              # API client
│   └── App.tsx             # Main app component
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI app entry
│   ├── config.py           # Configuration
│   ├── routers/            # API routes
│   ├── services/           # Business logic
│   │   ├── transcription.py
│   │   ├── tts.py
│   │   └── video.py
│   └── models/             # Data models
└── public/                 # Static assets
```

## 🔧 Making Changes

### 1. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Follow the [Style Guidelines](#style-guidelines)
- Write clear, commented code
- Add tests if applicable
- Update documentation

### 3. Commit Your Changes

```bash
# Add files
git add .

# Commit with a clear message
git commit -m "feat: add new feature X"
# or
git commit -m "fix: resolve issue with Y"

# Commit message format:
# - feat: New feature
# - fix: Bug fix
# - docs: Documentation changes
# - style: Code style changes (formatting)
# - refactor: Code refactoring
# - test: Adding tests
# - chore: Maintenance tasks
```

## 🧪 Testing

### Frontend Testing
```bash
# Run linter
npm run lint

# Build to check for errors
npm run build
```

### Backend Testing
```bash
cd backend

# Check code style
black --check .
flake8 .

# Type checking (if mypy is installed)
mypy .

# Manual testing
# Start the server and test endpoints with the frontend
```

### Manual Testing Checklist
Before submitting:
- [ ] Upload a video successfully
- [ ] Transcription completes without errors
- [ ] Transcript editor works (both tabs)
- [ ] Voice generation completes
- [ ] Video merge works
- [ ] Download works
- [ ] No console errors in browser
- [ ] No errors in backend logs

## 📤 Submitting Changes

### 1. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 2. Create a Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template:
   - **Title**: Clear, descriptive title
   - **Description**: What changes you made and why
   - **Related Issue**: Link to any related issues
   - **Testing**: How you tested the changes
   - **Screenshots**: If UI changes, include before/after

### 3. PR Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tested thoroughly
- [ ] PR description is clear

## 🎨 Style Guidelines

### TypeScript/React

```typescript
// Use functional components with hooks
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  const [state, setState] = useState<string>('');
  
  // Clear function names
  const handleClick = () => {
    // Implementation
  };
  
  return (
    <div className="container">
      {/* Clear, semantic JSX */}
    </div>
  );
}

// Use TypeScript types
interface MyComponentProps {
  prop1: string;
  prop2?: number;  // Optional props
}

// Use descriptive variable names
const transcriptionResult = await api.transcribe(videoId);
```

### Python/FastAPI

```python
"""Clear module docstrings."""

from typing import Optional, List
from fastapi import APIRouter, HTTPException

# Constants in UPPER_CASE
MAX_FILE_SIZE = 500 * 1024 * 1024

# Classes in PascalCase
class TranscriptionService:
    """Service for handling transcription logic."""
    
    def __init__(self, model_name: str):
        """Initialize with clear docstrings."""
        self.model_name = model_name
    
    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> dict:
        """
        Transcribe audio file.
        
        Args:
            audio_path: Path to audio file
            language: Optional language code
            
        Returns:
            Dictionary with transcription results
        """
        # Implementation with clear comments
        logger.info(f"Transcribing: {audio_path}")
        return result

# Functions in snake_case
def format_time(seconds: float) -> str:
    """Convert seconds to formatted time string."""
    # Implementation
    return formatted_time
```

### Commit Messages

```bash
# Good commit messages:
git commit -m "feat: add SRT export functionality"
git commit -m "fix: resolve CORS issue with frontend"
git commit -m "docs: update installation instructions"
git commit -m "refactor: improve transcription error handling"

# Bad commit messages:
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

## 🎯 Areas for Contribution

### 🐛 Bug Fixes
- Check [Issues](https://github.com/yourusername/auto-dubbing/issues)
- Look for "good first issue" label

### ✨ Features
High-priority features:
- [ ] User authentication
- [ ] Batch video processing
- [ ] Real-time translation
- [ ] Custom voice training
- [ ] Multi-speaker detection
- [ ] Progress notifications
- [ ] Dark/Light theme persistence
- [ ] More language support

### 📚 Documentation
- Improve README
- Add code comments
- Create tutorials
- Translate documentation

### 🧪 Testing
- Add unit tests
- Add integration tests
- Improve test coverage

### 🎨 UI/UX
- Improve design
- Add animations
- Enhance accessibility
- Mobile responsiveness

## 💬 Communication

- **Issues**: For bugs, feature requests, questions
- **Discussions**: For general discussion, ideas
- **Pull Requests**: For code contributions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- CHANGELOG.md for significant contributions
- GitHub contributors page

## ❓ Questions?

- Check existing [Issues](https://github.com/yourusername/auto-dubbing/issues)
- Start a [Discussion](https://github.com/yourusername/auto-dubbing/discussions)
- Read the [README](README.md)

---

Thank you for contributing to Auto-Dubbing! 🎉

Every contribution, no matter how small, makes a difference! 💪
