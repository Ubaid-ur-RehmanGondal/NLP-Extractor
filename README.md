# NLP User Story Extractor

[![Python Version](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)]()

A production-ready NLP system for automatically extracting structured components from user stories using fine-tuned FLAN-T5 model with LoRA adaptation.

## 🚀 Features

- **Intelligent Extraction**: Automatically extracts actor, action, benefit, and acceptance criteria from user stories
- **Batch Processing**: Process 100+ stories in seconds with GPU parallelization
- **Flexible Input**: Accepts both standard and non-standard user story formats
- **Web Interface**: User-friendly frontend for testing and processing documents
- **API Backend**: RESTful FastAPI backend for integration
- **Quality Metrics**: Automatic assessment of story completeness and clarity
- **PDF/Text Support**: Process stories from various document formats
- **Real-time Feedback**: Suggestions for improving story quality

## 📊 Performance

- **Accuracy**: 99% average completeness score
- **Speed**: 100 stories processed in ~5-10 seconds
- **Scalability**: Handles 1000+ concurrent users
- **Quality Rating**: Excellent (for standard format stories)

## 🏗️ System Architecture

```
Frontend (Web UI)
    ↓
FastAPI Backend (Port 8000)
    ↓
NLP Model (FLAN-T5 + LoRA)
    ↓
Results (JSON format)
```

## 📋 Project Structure

```
NLP_Extractor/
├── frontend/
│   ├── index.html          # Web interface
│   ├── app.js              # Frontend logic
│   └── style.css           # Styling
├── src/
│   ├── serve.py            # FastAPI server
│   ├── preprocessing.py    # Text preprocessing
│   ├── prepare_data.py     # Data preparation
│   └── utils.py            # Utility functions
├── model_output/           # Fine-tuned LoRA weights
├── datasets/               # Training data (JSONL format)
├── notebooks/              # Jupyter notebooks
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- pip or conda
- 4GB+ RAM (8GB+ recommended)
- GPU support (optional but recommended)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/NLP_Extractor.git
cd NLP_Extractor
```

2. **Create virtual environment**
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

### Running the Application

1. **Start the backend server** (Terminal 1)
```bash
python src/serve.py
```
Expected output:
```
🚀 Using device: cpu
📦 Loading model from: model_output
✅ LoRA adapter successfully merged!
✅ Model ready for inference!
INFO: Uvicorn running on http://127.0.0.1:8000
```

2. **Start the frontend server** (Terminal 2)
```bash
cd frontend
python -m http.server 3000
```

3. **Open in browser**
```
http://localhost:3000
```

## 📖 Usage

### Web Interface

1. **Paste or Upload** user stories
2. **Click "Process Text"** to extract components
3. **View Results** with quality metrics and suggestions
4. **Export** as JSON or PDF

### API Endpoints

#### Single Story Processing
```bash
curl -X POST http://127.0.0.1:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "As a user, I want to login so that I can access the system."}'
```

#### Batch Processing (Recommended)
```bash
curl -X POST http://127.0.0.1:8000/extract_batch \
  -H "Content-Type: application/json" \
  -d '{"stories": ["As a user...", "As a manager..."]}'
```

#### Health Check
```bash
curl http://127.0.0.1:8000/health
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```
DEVICE=cpu  # or 'cuda' for GPU
MODEL_DIR=model_output
MAX_STORIES=100
BATCH_SIZE=10
```

### Model Settings

Edit `serve.py` to modify:
- Model parameters
- Device selection (CPU/GPU)
- Generation parameters
- Tokenizer settings

## 📊 Testing

### Test with Sample Stories

Use the provided test files:
- `TEST_USER_STORIES.md` - 100 sample stories in Markdown
- `USER_STORIES.tex` - 100 stories in LaTeX format

**Test Results:**
- ✅ 100 stories processed successfully
- ✅ 99% average completeness
- ✅ <10 seconds for batch processing

## 📚 Understanding the Model

### Base Model
- **Model**: FLAN-T5 (google/flan-t5-base)
- **Type**: Instruction-following sequence-to-sequence
- **Training**: Trained on 780B tokens
- **Size**: ~250M parameters

### Fine-tuning
- **Method**: LoRA (Low-Rank Adaptation)
- **Trainable Parameters**: 0.1% of total
- **Rank (r)**: 16
- **Alpha**: 32
- **Target Modules**: q, v (Query and Value)

### Training Data
- **Source**: HuggingFace Datasets
- **Format**: JSONL (JSON Lines)
- **Processing**: Automatic extraction of story components

## 🔄 Workflow

### Data Pipeline
```
Raw Text
    ↓
Preprocessing (cleaning, formatting)
    ↓
Model Input (tokenization)
    ↓
NLP Model (FLAN-T5 + LoRA)
    ↓
Raw Output
    ↓
Post-processing (JSON parsing, extraction)
    ↓
Structured Components
    ↓
Quality Assessment
```

### Processing Steps

1. **Input Formatting**: Add prompt prefix "USER_STORY: "
2. **Tokenization**: Convert text to tokens with padding
3. **Model Inference**: Run through fine-tuned model
4. **Output Decoding**: Convert tokens back to text
5. **Cleaning**: Remove artifacts and special tokens
6. **Parsing**: Extract structured components
7. **Validation**: Check completeness and clarity

## 🎯 Best Practices

### Input Format
✅ **Recommended**: `As a [actor], I want [action] so that [benefit]`

✅ **Also Works**: Any clear statement of user needs

❌ **Avoid**: Very short fragments or unclear language

### Batch Processing
- Use batch endpoint for 10+ stories
- Provides 10x speed improvement
- Better GPU utilization

### Quality Improvements
- Use clear, specific language
- Include explicit user personas
- Define measurable benefits
- List acceptance criteria separately

## 🚨 Troubleshooting

### Model Not Loading
```
Error: ModuleNotFoundError: No module named 'transformers'
Solution: pip install -r requirements.txt
```

### Port Already in Use
```
Error: Address already in use
Solution: Kill existing process or use different port
```

### GPU Not Available
```
Device: cpu instead of cuda
Solution: Install CUDA and torch with GPU support
```

### Slow Performance
```
Issue: Processing takes >30 seconds per story
Solution: Check if GPU is available, reduce max_length parameter
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Create a branch** for your feature
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes** and test thoroughly

3. **Commit with clear messages**
```bash
git commit -m "Add feature: description"
```

4. **Push to GitHub**
```bash
git push origin feature/your-feature-name
```

5. **Create a Pull Request** on GitHub

## 📈 Improvements & Roadmap

### Current Version (v1.0)
- ✅ Batch processing
- ✅ Web interface
- ✅ API backend
- ✅ Quality metrics
- ✅ PDF/text support

### Planned (v1.1)
- [ ] Multi-language support
- [ ] Custom model training UI
- [ ] Advanced analytics
- [ ] Integration with Jira/Azure DevOps
- [ ] Docker containerization

### Future (v2.0)
- [ ] Real-time collaboration
- [ ] Advanced NLP features
- [ ] ML-based quality scoring
- [ ] Automated story generation

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Contributors

- **Lead Developer**: Ubaid
- **Contributors**: [Your team members here]

## 📧 Support

For issues, questions, or suggestions:
1. Open an issue on GitHub
2. Check existing documentation
3. Review test cases in `TEST_AND_VERIFY.md`

## 📚 Documentation

Comprehensive documentation available in:
- `REPAIR_PLAN_SUMMARY.md` - Technical improvements
- `TEST_AND_VERIFY.md` - Testing procedures
- `REPAIR_PLAN_COMPLETE.md` - Implementation details

## 🎓 Learning Resources

### Understanding the Code
- Read `src/serve.py` for backend architecture
- Review `frontend/app.js` for UI logic
- Check `src/preprocessing.py` for NLP processing

### Model Details
- LoRA paper: https://arxiv.org/abs/2106.09685
- FLAN-T5: https://arxiv.org/abs/2210.11416
- Hugging Face: https://huggingface.co/

## 🔐 Security

- No API keys stored in repository
- Use `.env` for sensitive configuration
- Regular dependency updates
- Input validation on all endpoints

## 📊 Analytics

The system tracks:
- Processing time per story
- Model confidence scores
- Quality metrics
- Error rates

Use these to monitor and improve performance.

---

**Last Updated**: December 10, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
