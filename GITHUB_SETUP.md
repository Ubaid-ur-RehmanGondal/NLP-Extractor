# GitHub Setup & Collaboration Guide

## 🚀 Step-by-Step: Push to GitHub & Share with Team

### Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Enter Repository Name: `NLP_Extractor` (or your preferred name)
3. Add Description: "Production-ready NLP system for extracting user story components"
4. Choose **Public** or **Private** (Private recommended for team)
5. Do NOT initialize with README (we already have one)
6. Click **Create Repository**

### Step 2: Configure Git (First Time Only)

```powershell
# Set your GitHub username and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```

### Step 3: Add Remote and Push

```powershell
# Navigate to project
cd c:\Users\ubaid\OneDrive\Desktop\NLP_Extractor\NLP_Extractor

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/NLP_Extractor.git

# Verify remote
git remote -v

# Add all files
git add .

# Commit with message
git commit -m "Initial commit: NLP User Story Extractor with batch processing and web interface"

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Share with Team Members

#### Option A: Invite as Collaborators (Recommended)
1. Go to GitHub repository → **Settings** → **Collaborators**
2. Click **Add people**
3. Enter team member's GitHub username
4. Set permission level (**Write** recommended)
5. Send invite

#### Option B: Share Repository Link
Send this to your team members:
```
https://github.com/YOUR_USERNAME/NLP_Extractor
```

### Step 5: Team Members Clone the Repository

Each team member should run:

```powershell
# Clone repository
git clone https://github.com/YOUR_USERNAME/NLP_Extractor.git

# Navigate to project
cd NLP_Extractor

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python src/serve.py
```

## 📋 Collaboration Workflow

### For All Team Members

#### Working on a Feature

```powershell
# 1. Update local repository
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes...

# 4. Check what changed
git status

# 5. Stage changes
git add .

# 6. Commit changes
git commit -m "Add feature: clear description of changes"

# 7. Push to GitHub
git push origin feature/your-feature-name

# 8. Create Pull Request on GitHub
```

#### Reviewing Code

1. Go to GitHub → **Pull Requests**
2. Review code changes
3. Comment on specific lines
4. Approve or request changes
5. Merge when ready

#### Staying Synchronized

```powershell
# Get latest changes
git pull origin main

# Check branch status
git status

# See commit history
git log --oneline -10
```

## 🔧 Important: Handling Large Files

The `model_output/` directory is in `.gitignore` because model files are too large for GitHub.

### For Team Members Getting Model Files

**Option 1: Download Pre-trained Model** (Recommended)
```powershell
# Model will be auto-downloaded on first run
python src/serve.py
```

**Option 2: Share Model Files**
- Create a shared Google Drive or OneDrive folder
- Share the `model_output/` directory with team
- Team members copy it to their local repository

**Option 3: Use Git LFS** (Advanced)
```powershell
# Install Git LFS
git lfs install

# Track large files
git lfs track "model_output/*"

# Commit
git add .gitattributes
git commit -m "Add Git LFS tracking for model files"
git push origin main
```

## 📊 Repository Structure for GitHub

```
NLP_Extractor/
├── .git/                    # Git metadata
├── .gitignore               # Files to exclude
├── README.md                # Main documentation ✅
├── CONTRIBUTING.md          # How to contribute (optional)
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── src/
│   ├── serve.py
│   ├── preprocessing.py
│   ├── prepare_data.py
│   └── utils.py
├── datasets/
│   ├── train.jsonl
│   ├── test.jsonl
│   └── validation.jsonl
├── notebooks/
│   └── colab_finetune.ipynb
├── requirements.txt         # Python dependencies ✅
└── Documentation files
    ├── REPAIR_PLAN_SUMMARY.md
    ├── TEST_AND_VERIFY.md
    └── REPAIR_PLAN_COMPLETE.md
```

## ⚙️ Team Member Onboarding

### Checklist for New Team Members

- [ ] Clone repository
  ```powershell
  git clone https://github.com/YOUR_USERNAME/NLP_Extractor.git
  ```

- [ ] Create virtual environment
  ```powershell
  python -m venv .venv
  .venv\Scripts\activate
  ```

- [ ] Install dependencies
  ```powershell
  pip install -r requirements.txt
  ```

- [ ] Verify installation
  ```powershell
  python src/serve.py
  ```

- [ ] Read documentation
  - README.md (overview)
  - REPAIR_PLAN_SUMMARY.md (technical details)
  - TEST_AND_VERIFY.md (testing procedures)

- [ ] Run test
  ```powershell
  # Paste sample story in web UI
  # http://localhost:3000
  ```

- [ ] Create feature branch
  ```powershell
  git checkout -b feature/initial-setup
  ```

## 🚨 Common Git Commands

```powershell
# View status
git status

# View changes
git diff

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- .

# Switch branches
git checkout branch-name

# Delete branch
git branch -d branch-name

# Create and switch branch
git checkout -b feature/name

# Merge feature into main
git checkout main
git merge feature/name

# Resolve conflicts
# 1. Edit conflicting files
# 2. git add .
# 3. git commit -m "Resolved conflicts"
```

## 🔐 Best Practices

### Commit Messages
- Be clear and descriptive
- Use present tense: "Add feature" not "Added feature"
- Reference issues: "Fix #123"
- Keep messages concise

### Branch Naming
- Feature: `feature/add-export-pdf`
- Bug fix: `bugfix/fix-batch-error`
- Documentation: `docs/update-readme`
- Experimental: `exp/new-model`

### Before Pushing
- Run tests locally
- Verify code works
- Check for syntax errors
- Review your changes

### Code Review
- Discuss major changes first
- Get approval before merging
- Test merged code
- Keep main branch stable

## 📞 GitHub Team Features

### Issues
- Report bugs
- Request features
- Track tasks
- Organize work

### Projects
- Create kanban board
- Organize tasks
- Track progress
- Assign work

### Discussions
- Ask questions
- Share ideas
- Collaborate asynchronously

### Wiki
- Write documentation
- Share guides
- Knowledge base

## 🎯 Example: Team Workflow

### Developer 1: Works on Model Improvement
```powershell
git checkout -b feature/improve-model-accuracy
# ... make changes ...
git push origin feature/improve-model-accuracy
# Create PR on GitHub
```

### Developer 2: Reviews Code
- Reviews changes on GitHub
- Leaves comments
- Approves or requests changes

### Developer 3: Works on UI
```powershell
git checkout -b feature/enhance-ui
# ... make changes ...
git push origin feature/enhance-ui
# Create PR on GitHub
```

### When Ready to Release
```powershell
# Update version in files
git commit -m "Version 1.1.0"
git tag v1.1.0
git push origin main --tags
```

## 📚 Resources

- [GitHub Documentation](https://docs.github.com)
- [Git Tutorial](https://git-scm.com/book)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Markdown Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)

## 💡 Tips for Smooth Collaboration

1. **Communicate** - Discuss plans before major changes
2. **Keep Synced** - Pull regularly to avoid conflicts
3. **Small Commits** - Easier to review and revert if needed
4. **Clear Messages** - Help others understand your changes
5. **Test Locally** - Verify everything works before pushing
6. **Code Review** - Get feedback from team members
7. **Document** - Update README when adding features
8. **Issue Tracking** - Use GitHub Issues to organize work

---

**Happy Collaborating!** 🚀

For questions, create an Issue on GitHub or discuss in the team channel.
