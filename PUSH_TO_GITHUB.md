# PUSH TO GITHUB - STEP BY STEP

## ⚡ Quick Push Instructions (Copy & Paste)

### Step 1: Verify Git Configuration (One-time)
```powershell
# Set your GitHub username and email
git config --global user.name "Your Name"
git config --global user.email "your.email@github.com"

# Verify (should show your username and email)
git config --global --list
```

### Step 2: Create Repository on GitHub
1. Go to https://github.com/new
2. **Repository name**: `NLP_Extractor`
3. **Description**: "Production-ready NLP system for extracting user story components"
4. **Visibility**: Choose **Private** (for team) or **Public**
5. **DO NOT** check "Initialize this repository with a README"
6. Click **Create repository**

### Step 3: Copy Your Repository URL
After creating the repository, GitHub shows you commands. Copy the HTTPS URL:
- Looks like: `https://github.com/YOUR_USERNAME/NLP_Extractor.git`

### Step 4: Run These Commands in PowerShell

Open PowerShell and navigate to your project:
```powershell
cd c:\Users\ubaid\OneDrive\Desktop\NLP_Extractor\NLP_Extractor
```

Then run these commands one by one:

```powershell
# 1. Add all files to git
git add .

# 2. Create initial commit
git commit -m "Initial commit: NLP User Story Extractor with batch processing, web interface, and LoRA fine-tuning"

# 3. Add remote repository (replace URL with YOUR repository URL)
git remote add origin https://github.com/YOUR_USERNAME/NLP_Extractor.git

# 4. Verify remote was added correctly
git remote -v

# 5. Set main branch and push
git branch -M main
git push -u origin main
```

If you get authentication errors:
- Use GitHub Personal Access Token instead of password
- Go to https://github.com/settings/tokens
- Create new token with `repo` scope
- Use token as password

## ✅ Verification

After pushing, verify on GitHub:
1. Go to https://github.com/YOUR_USERNAME/NLP_Extractor
2. You should see all these files:
   - ✅ frontend/ (app.js, index.html, style.css)
   - ✅ src/ (serve.py, preprocessing.py, etc.)
   - ✅ datasets/ (train.jsonl, test.jsonl, validation.jsonl)
   - ✅ notebooks/ (colab_finetune.ipynb)
   - ✅ README.md
   - ✅ requirements.txt
   - ✅ GITHUB_SETUP.md
   - ✅ .gitignore

## 🤝 Add Team Members (After Initial Push)

### Share with Your 2 Team Members:

1. **On GitHub**, go to **Settings** → **Collaborators** → **Add people**
2. Enter their GitHub usernames
3. Set permission to **Write** (allows pushing changes)
4. They'll get an invite

OR simply share the repository link:
```
https://github.com/YOUR_USERNAME/NLP_Extractor
```

## 👥 For Your Team Members (Clone Instructions)

Share this with them:

```powershell
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/NLP_Extractor.git
cd NLP_Extractor

# 2. Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the application
python src/serve.py

# 5. In another terminal, start frontend
cd frontend
python -m http.server 3000

# 6. Open browser to http://localhost:3000
```

## 📊 What Gets Uploaded

### Files Included ✅
- All Python code (src/)
- Frontend files (HTML, JS, CSS)
- Training datasets (JSONL)
- Notebooks
- Documentation (README, guides)
- Requirements.txt
- .gitignore

### Files Excluded ❌ (Too Large)
- `model_output/` - Model weights (~500MB+)
- `__pycache__/` - Python cache
- `.venv/` - Virtual environment
- `.ipynb_checkpoints/` - Notebook cache

**Note**: Team members can download the model on first run (it will be auto-downloaded from HuggingFace).

## 🎯 Complete Push Checklist

Before you push, verify:

- [ ] Git is installed: `git --version`
- [ ] You have GitHub account
- [ ] You created repository on GitHub
- [ ] You copied the repository URL
- [ ] You ran `git add .`
- [ ] You ran `git commit -m "..."`
- [ ] You ran `git remote add origin <URL>`
- [ ] You ran `git push -u origin main`
- [ ] Files appear on GitHub
- [ ] Team members can clone

## 🆘 Troubleshooting

### Error: "fatal: not a git repository"
```powershell
# Navigate to correct directory
cd c:\Users\ubaid\OneDrive\Desktop\NLP_Extractor\NLP_Extractor
git status
```

### Error: "fatal: No configured push destination"
```powershell
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/NLP_Extractor.git
git push -u origin main
```

### Error: "Authentication failed"
```powershell
# Use GitHub Personal Access Token
# 1. Go to https://github.com/settings/tokens
# 2. Click "Generate new token"
# 3. Select "repo" scope
# 4. Copy token
# 5. Use token as password when pushing
```

### Error: "remote: Repository not found"
```powershell
# Make sure:
# 1. Repository exists on GitHub
# 2. URL is correct
# 3. You have access to the repository
# Run: git remote -v  (to verify URL)
```

## 📝 After First Push - Regular Workflow

For future updates:

```powershell
# 1. Make changes to files

# 2. Check what changed
git status

# 3. Add changes
git add .

# 4. Commit
git commit -m "Description of changes"

# 5. Push to GitHub
git push origin main
```

## 🔒 Team Collaboration Best Practices

1. **Always pull before working**
   ```powershell
   git pull origin main
   ```

2. **Create branch for features**
   ```powershell
   git checkout -b feature/your-feature-name
   ```

3. **Keep commits small and clear**
   ```powershell
   git commit -m "Add specific feature"
   ```

4. **Push regularly**
   ```powershell
   git push origin feature/your-feature-name
   ```

5. **Use Pull Requests for code review**
   - Push to feature branch
   - Create Pull Request on GitHub
   - Team reviews
   - Merge when approved

---

## 📞 Need Help?

See `GITHUB_SETUP.md` for detailed instructions and team collaboration guide.

Ready? Let's push! 🚀
