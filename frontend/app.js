// NLP User Story Extractor - Production Application
// Advanced text processing and analysis engine

class NLPExtractor {
    constructor() {
        this.init();

        // Processing configuration (moved up so listeners/setup can rely on them)
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            supportedFormats: ['txt', 'pdf', 'docx'],
            processingTimeout: 30000, // 30 seconds
            maxStories: 100
        };

        // NLP patterns and rules (moved up)
        this.patterns = {
            userStoryFormats: [
                /As\s+an?\s+([^,]+),\s*I\s+(want|need|can|should|must|will)\s+(.+?)\s+(?:so\s+that|in\s+order\s+to|to\s+enable|because)\s+(.+)/i,
                /As\s+a\s+([^,]+),\s*I\s+(want|need|can|should|must|will)\s+(.+?)\s+(?:so\s+that|in\s+order\s+to|to\s+enable|because)\s+(.+)/i,
                /As\s+([^,]+),\s*I\s+(want|need|can|should|must|will)\s+(.+?)\s+(?:so\s+that|in\s+order\s+to|to\s+enable|because)\s+(.+)/i
            ],
            actorKeywords: ['user', 'customer', 'admin', 'administrator', 'manager', 'developer', 'system', 'client', 'visitor', 'guest', 'employee', 'staff'],
            actionVerbs: ['want', 'need', 'can', 'should', 'must', 'will', 'would', 'could', 'like', 'wish', 'require'],
            benefitIndicators: ['so that', 'in order to', 'to enable', 'because', 'to help', 'to allow', 'to provide'],
            vagueTerms: ['some', 'better', 'improved', 'enhanced', 'optimized', 'good', 'bad', 'nice', 'easy', 'simple', 'fast', 'slow'],
            passiveVoice: ['is done', 'are done', 'was done', 'were done', 'be done', 'being done', 'been done']
        };

        // Results storage
        this.currentResults = null;
        this.processingStats = {
            totalStories: 0,
            processedStories: 0,
            avgCompleteness: 0,
            qualityRating: 'N/A',
            issuesFound: 0
        };

        // Setup listeners after internals are ready
        this.setupEventListeners();
    }

    init() {
        console.log('NLP User Story Extractor initialized');
    }
    // ------------------------------------------------------------
    // 🔥 CALL YOUR PYTHON ML MODEL (FastAPI endpoint)
    // ------------------------------------------------------------
async callMLModel(userStoryText) {
    try {
        const response = await fetch("http://127.0.0.1:8000/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: userStoryText })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();

        // Expected backend output:
        // {
        //   actor: "...",
        //   action: "...",
        //   benefit: "...",
        //   acceptance_criteria: [...]
        // }

        return {
            actor: result.actor || null,
            action: result.action || null,
            benefit: result.benefit || null,
            acceptance_criteria: result.acceptance_criteria || []
        };

    } catch (err) {
        console.error("ML Model Error:", err);
        return { actor: null, action: null, benefit: null, acceptance_criteria: [] };
    }
}


    setupEventListeners() {
        // Helper to get element and warn if missing
        const getEl = (id) => {
            const el = document.getElementById(id);
            if (!el) console.warn(`Element not found: #${id}`);
            return el;
        };

        // File upload events
        const uploadZone = getEl('uploadZone');
        const fileInput = getEl('fileInput');

        if (uploadZone) {
            uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadZone.addEventListener('drop', this.handleFileDrop.bind(this));
        }

        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Text processing
        const processBtn = getEl('processText');
        if (processBtn) processBtn.addEventListener('click', this.processTextInput.bind(this));
        const clearBtn = getEl('clearText');
        if (clearBtn) clearBtn.addEventListener('click', this.clearTextInput.bind(this));

        // Tab navigation (may be zero elements)
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', this.switchTab.bind(this));
        });

        // Export functions
        const exportJsonBtn = getEl('exportJson');
        if (exportJsonBtn) exportJsonBtn.addEventListener('click', this.exportAsJson.bind(this));
        const exportCsvBtn = getEl('exportCsv');
        if (exportCsvBtn) exportCsvBtn.addEventListener('click', this.exportAsCsv.bind(this));
        const copyResultsBtn = getEl('copyResults');
        if (copyResultsBtn) copyResultsBtn.addEventListener('click', this.copyToClipboard.bind(this));
        const copyJsonBtn = getEl('copyJson');
        if (copyJsonBtn) copyJsonBtn.addEventListener('click', this.copyJsonToClipboard.bind(this));
    }

    // File handling methods
    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadZone').classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadZone').classList.remove('drag-over');
    }

    async handleFileDrop(e) {
        e.preventDefault();
        document.getElementById('uploadZone').classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        await this.processFiles(files);
    }

    async handleFileSelect(e) {
        const files = Array.from(e.target.files);
        await this.processFiles(files);
    }

    async processFiles(files) {
        try {
            if (files.length === 0) return;
            
            // Validate files
            const validFiles = this.validateFiles(files);
            if (validFiles.length === 0) {
                this.showError('No valid files selected. Please select TXT, PDF, or DOCX files.');
                return;
            }
            
            this.showFileInfo(validFiles);
            
            // Process each file
            let allText = '';
            for (const file of validFiles) {
                const text = await this.extractTextFromFile(file);
                allText += text + '\n\n';
            }
            
            if (allText.trim()) {
                await this.processUserStories(allText.trim());
            } else {
                this.showError('No text content found in the uploaded files.');
            }
            
        } catch (error) {
            this.showError(`File processing error: ${error.message}`);
        }
    }

    validateFiles(files) {
        return files.filter(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            const isValidFormat = this.config.supportedFormats.includes(extension);
            const isValidSize = file.size <= this.config.maxFileSize;
            
            if (!isValidFormat) {
                console.warn(`Unsupported file format: ${file.name}`);
            }
            if (!isValidSize) {
                console.warn(`File too large: ${file.name}`);
            }
            
            return isValidFormat && isValidSize;
        });
    }

    async extractTextFromFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (extension === 'pdf') {
            return await this.extractTextFromPdf(file);
        }
        if (extension === 'docx') {
            return await this.extractTextFromDocx(file);
        }
        // Fallback for plain text and others
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    resolve(String(e.target.result || ''));
                } catch (error) {
                    reject(new Error(`Failed to read file ${file.name}: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
            reader.readAsText(file);
        });
    }

    async extractTextFromPdf(file) {
        if (typeof window.pdfjsLib === 'undefined') {
            throw new Error('PDF.js not loaded');
        }
        try {
            // Ensure worker is set (needed for some environments)
            if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            return this.simulatePdfExtraction(fullText);
        } catch (err) {
            throw new Error(`PDF extraction failed: ${err.message}`);
        }
    }

    async extractTextFromDocx(file) {
        if (typeof window.mammoth === 'undefined') {
            throw new Error('Mammoth (DOCX) not loaded');
        }
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.extractRawText({ arrayBuffer });
            const raw = (result && result.value) ? result.value : '';
            return this.simulateDocxExtraction(raw);
        } catch (err) {
            throw new Error(`DOCX extraction failed: ${err.message}`);
        }
    }

    simulatePdfExtraction(text) {
        // Simulate PDF text extraction challenges
        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .trim();
    }

    simulateDocxExtraction(text) {
        // Simulate DOCX text extraction
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    showFileInfo(files) {
        const fileInfo = document.getElementById('fileInfo');
        const fileNames = files.map(f => f.name).join(', ');
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        
        fileInfo.innerHTML = `
            <strong>Selected Files:</strong> ${fileNames}<br>
            <strong>Total Size:</strong> ${this.formatFileSize(totalSize)}
        `;
        fileInfo.classList.add('show');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Text processing methods
    async processTextInput() {
        const textInput = document.getElementById('textInput');
        const text = textInput.value.trim();
        
        if (!text) {
            this.showError('Please enter some user stories to process.');
            return;
        }
        
        await this.processUserStories(text);
    }

    clearTextInput() {
        document.getElementById('textInput').value = '';
        document.getElementById('fileInfo').classList.remove('show');
        document.getElementById('fileInput').value = '';
    }

    async processUserStories(text) {
        try {
            this.showProcessingStatus();
            
            // Simulate processing delay for realistic UX
            await this.updateProgress(10, 'Analyzing text structure...');
            await this.delay(500);
            
            // Segment user stories
            const stories = this.segmentUserStories(text);
            const limitedStories = stories.slice(0, this.config.maxStories);
            await this.updateProgress(30, `Found ${limitedStories.length}${stories.length > this.config.maxStories ? ` of ${stories.length}` : ''} potential user stories...`);
            await this.delay(300);
            
            // BATCH PROCESSING: Send all stories at once instead of one-by-one
            console.log(`📦 Sending ${limitedStories.length} stories as a batch...`);
            await this.updateProgress(50, `Sending batch of ${limitedStories.length} stories to AI model...`);
            
            try {
                // Send all stories in ONE request for 10x speed improvement
                const response = await fetch("http://127.0.0.1:8000/extract_batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stories: limitedStories })
                });

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }

                const batchData = await response.json();
                console.log(`✅ Batch processing complete: ${batchData.results.length} stories processed`);
                
                // Convert batch results to processed stories format
                const processedStories = batchData.results.map((result, idx) => {
                    const components = {
                        actor: result.actor,
                        action: result.action,
                        benefit: result.benefit,
                        acceptance_criteria: result.acceptance_criteria
                    };
                    
                    // Fall back to regex extraction if ML fails
                    if (!components.actor && !components.action && !components.benefit) {
                        Object.assign(components, this.extractComponents(limitedStories[idx]));
                    }
                    
                    const quality = this.analyzeQuality(limitedStories[idx], components);
                    const suggestions = this.generateSuggestions(limitedStories[idx], components, quality);
                    
                    return {
                        id: `US-${String(idx + 1).padStart(3, '0')}`,
                        story: limitedStories[idx],
                        extracted_components: components,
                        quality_metrics: quality,
                        suggestions,
                        confidence: result.confidence,
                        raw_output: result.raw_output,
                        cleaned_output: result.cleaned_output
                    };
                });
                
                await this.updateProgress(85, 'Analyzing quality metrics...');
                await this.delay(300);
                
                // Calculate overall metrics
                this.calculateOverallMetrics(processedStories);
                
                await this.updateProgress(100, 'Processing complete!');
                await this.delay(500);
                
                // Store results and display
                this.currentResults = {
                    format: 'nlp_user_stories',
                    schema_version: '1.0.0',
                    stories: processedStories,
                    summary: this.processingStats,
                    timestamp: new Date().toISOString()
                };
                
                this.hideProcessingStatus();
                this.displayResults();
                
            } catch (batchError) {
                console.error("Batch processing error:", batchError);
                this.hideProcessingStatus();
                this.showError(`Batch processing error: ${batchError.message}`);
            }
            
        } catch (error) {
            this.hideProcessingStatus();
            this.showError(`Processing error: ${error.message}`);
        }
    }

    // segmentUserStories(text) {
    //     // Split text into potential user stories
    //     const lines = text.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);
    //     const stories = [];
    //     let currentStory = '';
        
    //     for (const line of lines) {
    //         // Check if line starts a new user story
    //         if (this.isUserStoryStart(line)) {
    //             if (currentStory.trim()) {
    //                 stories.push(currentStory.trim());
    //             }
    //             currentStory = line;
    //         } else {
    //             currentStory += ' ' + line;
    //         }
    //     }
        
    //     // Add the last story
    //     if (currentStory.trim()) {
    //         stories.push(currentStory.trim());
    //     }
        
    //     // Filter out very short or invalid stories
    //     return stories.filter(story => story.length > 20 && this.containsUserStoryElements(story));
    // }

    segmentUserStories(text) {
    // NEW ROBUST LOGIC: Split by double newlines (paragraph breaks) or by "As a" pattern
    // This handles multiple story formats without rejecting non-standard formats
    
    // First, try to split by double newlines (common separator)
    let stories = text.split(/\n\s*\n+/)
                     .map(s => s.trim())
                     .filter(s => s.length > 10);  // Only keep meaningful content
    
    // If we only got 1 story, try splitting by "As a" pattern (for compact format)
    if (stories.length === 1 && text.includes('As a')) {
        stories = text.split(/(?=As\s+a(?:n)?\s+)/i)
                     .map(s => s.trim())
                     .filter(s => s.length > 10);
    }
    
    // If still only 1 story, split by single newlines (one story per line)
    if (stories.length === 1) {
        stories = text.split(/\n+/)
                     .map(s => s.trim())
                     .filter(s => s.length > 10);
    }
    
    return stories.slice(0, this.config.maxStories);
}


    isUserStoryStart(line) {
        const storyStarters = [
            /^As\s+an?\s+/i,
            /^As\s+a\s+/i,
            /^As\s+/i,
            /^User\s+Story/i,
            /^Story\s+/i
        ];
        
        return storyStarters.some(pattern => pattern.test(line));
    }

    containsUserStoryElements(text) {
        const hasActor = /As\s+(an?\s+)?\w+/i.test(text);
        const hasAction = this.patterns.actionVerbs.some(verb => 
            new RegExp(`\\b${verb}\\b`, 'i').test(text)
        );
        const hasBenefit = this.patterns.benefitIndicators.some(indicator => 
            new RegExp(indicator, 'i').test(text)
        );
        
        return hasActor || (hasAction && hasBenefit);
    }

    async processUserStory(storyText, index) {
        const storyId = `US-${String(index).padStart(3, '0')}`;
        
        // Extract components

const components = await this.callMLModel(storyText);

// Fall back to your regex extractor if ML fails
if (!components.actor && !components.action && !components.benefit) {
    console.warn("ML failed → using fallback extractor");
    Object.assign(components, this.extractComponents(storyText));
}

        
        // Analyze quality
        const quality = this.analyzeQuality(storyText, components);
        
        // Generate suggestions
        const suggestions = this.generateSuggestions(storyText, components, quality);
        
        return {
            story_id: storyId,
            original_text: storyText,
            extracted_components: components,
            quality_metrics: quality,
            suggestions: suggestions
        };
    }

    extractComponents(text) {
        const components = {
            actor: null,
            action: null,
            benefit: null,
            acceptance_criteria: []
        };
        
        //Try to match standard user story patterns
        for (const pattern of this.patterns.userStoryFormats) {
            const match = text.match(pattern);
            if (match) {
                components.actor = match[1] ? match[1].trim() : null;
                components.action = match[3] ? match[3].trim() : null;
                components.benefit = match[4] ? match[4].trim() : null;
                break;
            }
        }

        
        
        // Fallback extraction if no pattern matched
        if (!components.actor || !components.action || !components.benefit) {
            const fallback = this.fallbackExtraction(text);
            components.actor = components.actor || fallback.actor;
            components.action = components.action || fallback.action;
            components.benefit = components.benefit || fallback.benefit;
        }
        
        // Extract acceptance criteria
        components.acceptance_criteria = this.extractAcceptanceCriteria(text);
        
        return components;
    }

    fallbackExtraction(text) {
        const result = {
            actor: null,
            action: null,
            benefit: null
        };
        
        // Extract actor from "As a/an" patterns
        const actorMatch = text.match(/As\s+(an?\s+)?([^,]+)/i);
        if (actorMatch) {
            result.actor = actorMatch[2].trim();
        }
        
        // Extract action from action verb patterns
        for (const verb of this.patterns.actionVerbs) {
            const actionPattern = new RegExp(`\\b${verb}\\s+(.+?)\\s+(?:so\\s+that|in\\s+order\\s+to|to\\s+enable|because|$)`, 'i');
            const actionMatch = text.match(actionPattern);
            if (actionMatch) {
                result.action = actionMatch[1].trim();
                break;
            }
        }
        
        // Extract benefit from benefit indicator patterns
        for (const indicator of this.patterns.benefitIndicators) {
            const benefitPattern = new RegExp(`${indicator}\\s+(.+?)(?:\\.|$)`, 'i');
            const benefitMatch = text.match(benefitPattern);
            if (benefitMatch) {
                result.benefit = benefitMatch[1].trim();
                break;
            }
        }
        
        return result;
    }

    extractAcceptanceCriteria(text) {
        const criteria = [];
        const lines = text.split(/\n+/).map(l => l.trim());

        // 1) Capture Gherkin-style blocks (Given/When/Then sequences) - case-insensitive
        const gwtBlocks = text.match(/(?:^|\n)(?:Given|When|Then)[\s\S]*?(?=(?:\n\n|$))/gi) || [];
        gwtBlocks.forEach(block => {
            criteria.push(block.replace(/\s+/g, ' ').trim());
        });

        // 2) Capture items under an Acceptance Criteria section
        const acSection = text.match(/Acceptance\s+Criteria?:?\s*([\s\S]*?)(?:\n\s*\n|$)/i);
        if (acSection && acSection[1]) {
            acSection[1].split(/\n/).forEach(line => {
                const bullet = line.match(/^(?:-\s+|\*\s+|\d+\.\s+)(.+)$/);
                if (bullet && bullet[1]) criteria.push(bullet[1].trim());
            });
        }

        // 3) Capture AC-numbered items (e.g., AC1:, AC-2:)
        const acNumberedMatches = [...text.matchAll(/\bAC[-\s]?(\d+)?:?\s*(.+)/gi)];
        acNumberedMatches.forEach(m => {
            if (m[2]) criteria.push(m[2].trim());
        });

        // 4) General bullets throughout the text
        lines.forEach(line => {
            const m = line.match(/^(?:-\s+|\*\s+|\d+\.\s+)(.+)$/);
            if (m && m[1]) criteria.push(m[1].trim());
        });

        // Normalize and deduplicate
        const normalized = criteria
            .map(c => c.replace(/\s+/g, ' ').replace(/[;,:]$/, '').trim())
            .filter(c => c.length > 0);
        return [...new Set(normalized)];
    }

    analyzeQuality(text, components) {
        const metrics = {
            completeness_score: this.calculateCompleteness(components),
            ambiguity_score: this.calculateAmbiguity(text),
            clarity_rating: null
        };
        
        metrics.clarity_rating = this.calculateClarity(metrics.completeness_score, metrics.ambiguity_score);
        
        return metrics;
    }

    calculateCompleteness(components) {
        const weights = {
            actor: 0.3,
            action: 0.4,
            benefit: 0.3
        };
        
        let score = 0;
        if (components.actor) score += weights.actor;
        if (components.action) score += weights.action;
        if (components.benefit) score += weights.benefit;
        
        return Math.round(score * 100);
    }

    calculateAmbiguity(text) {
        let ambiguityPoints = 0;
        
        // Check for vague terms
        this.patterns.vagueTerms.forEach(term => {
            if (new RegExp(`\\b${term}\\b`, 'i').test(text)) {
                ambiguityPoints += 10;
            }
        });
        
        // Check for passive voice
        this.patterns.passiveVoice.forEach(pattern => {
            if (new RegExp(pattern, 'i').test(text)) {
                ambiguityPoints += 15;
            }
        });
        
        // Check for missing pronouns
        if (!/\b(I|me|my|we|us|our)\b/i.test(text)) {
            ambiguityPoints += 5;
        }
        
        // Check for incomplete sentences
        if (!/[.!?]\s*$/.test(text.trim())) {
            ambiguityPoints += 10;
        }
        
        return Math.min(100, ambiguityPoints);
    }

    calculateClarity(completeness, ambiguity) {
        const score = completeness - ambiguity;
        
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }

    generateSuggestions(text, components, quality) {
        const suggestions = [];
        
        // Completeness suggestions
        if (!components.actor) {
            suggestions.push({
                type: 'error',
                category: 'Completeness',
                message: 'Missing actor: Specify who the user is (e.g., "As a customer...")'
            });
        }
        
        if (!components.action) {
            suggestions.push({
                type: 'error',
                category: 'Completeness',
                message: 'Missing action: Clearly state what the user wants to do'
            });
        }
        
        if (!components.benefit) {
            suggestions.push({
                type: 'warning',
                category: 'Completeness',
                message: 'Missing benefit: Explain why this feature is valuable'
            });
        }
        
        // Ambiguity suggestions
        if (quality.ambiguity_score > 20) {
            if (this.patterns.vagueTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(text))) {
                suggestions.push({
                    type: 'warning',
                    category: 'Clarity',
                    message: 'Contains vague terms: Replace words like "better", "improved", "some" with specific details'
                });
            }
            
            if (this.patterns.passiveVoice.some(pattern => new RegExp(pattern, 'i').test(text))) {
                suggestions.push({
                    type: 'info',
                    category: 'Writing Style',
                    message: 'Consider using active voice for clearer communication'
                });
            }
        }
        
        // Format suggestions
        if (!this.patterns.userStoryFormats.some(pattern => pattern.test(text))) {
            suggestions.push({
                type: 'info',
                category: 'Format',
                message: 'Consider using standard format: "As a [actor], I want [action] so that [benefit]"'
            });
        }
        
        return suggestions;
    }

    calculateOverallMetrics(stories) {
        this.processingStats.totalStories = stories.length;
        this.processingStats.processedStories = stories.length;
        
        if (stories.length > 0) {
            const avgCompleteness = stories.reduce((sum, story) => 
                sum + story.quality_metrics.completeness_score, 0) / stories.length;
            this.processingStats.avgCompleteness = Math.round(avgCompleteness);
            
            const qualityDistribution = {
                excellent: stories.filter(s => s.quality_metrics.clarity_rating === 'excellent').length,
                good: stories.filter(s => s.quality_metrics.clarity_rating === 'good').length,
                fair: stories.filter(s => s.quality_metrics.clarity_rating === 'fair').length,
                poor: stories.filter(s => s.quality_metrics.clarity_rating === 'poor').length
            };
            
            // Determine overall quality rating
            const totalStories = stories.length;
            if (qualityDistribution.excellent / totalStories >= 0.7) {
                this.processingStats.qualityRating = 'Excellent';
            } else if ((qualityDistribution.excellent + qualityDistribution.good) / totalStories >= 0.6) {
                this.processingStats.qualityRating = 'Good';
            } else if ((qualityDistribution.excellent + qualityDistribution.good + qualityDistribution.fair) / totalStories >= 0.5) {
                this.processingStats.qualityRating = 'Fair';
            } else {
                this.processingStats.qualityRating = 'Poor';
            }
            
            // Count total issues
            this.processingStats.issuesFound = stories.reduce((sum, story) => 
                sum + story.suggestions.filter(s => s.type === 'error' || s.type === 'warning').length, 0);
        }
    }

    // UI update methods
    showProcessingStatus() {
        document.getElementById('processingStatus').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';
    }

    hideProcessingStatus() {
        document.getElementById('processingStatus').style.display = 'none';
    }

    async updateProgress(percentage, message) {
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${Math.round(percentage)}%`;
        document.getElementById('statusMessage').textContent = message;
    }

    displayResults() {
        this.updateDashboard();
        this.displayOverviewTab();
        this.displayDetailedTab();
        this.displayJsonTab();
        this.displaySuggestionsTab();
        
        document.getElementById('resultsSection').style.display = 'block';
        
        // Switch to overview tab
        this.switchToTab('overview');
    }

    updateDashboard() {
        document.getElementById('storiesCount').textContent = this.processingStats.totalStories;
        document.getElementById('avgCompleteness').textContent = `${this.processingStats.avgCompleteness}%`;
        
        const qualityRating = document.getElementById('qualityRating');
        qualityRating.textContent = this.processingStats.qualityRating;
        qualityRating.className = `metric-value quality-rating ${this.processingStats.qualityRating.toLowerCase()}`;
        
        document.getElementById('issuesCount').textContent = this.processingStats.issuesFound;
    }

    displayOverviewTab() {
        const grid = document.getElementById('storiesGrid');
        grid.innerHTML = '';
        
        this.currentResults.stories.forEach(story => {
            const card = this.createStoryCard(story);
            grid.appendChild(card);
        });
    }

    createStoryCard(story) {
        const card = document.createElement('div');
        card.className = 'story-card';
        
        const completenessClass = this.getCompletenessClass(story.quality_metrics.completeness_score);
        
        card.innerHTML = `
            <div class="story-header">
                <span class="story-id">${story.story_id}</span>
                <span class="completeness-score ${completenessClass}">
                    ${story.quality_metrics.completeness_score}% Complete
                </span>
            </div>
            <div class="story-original">
                ${this.escapeHtml(story.original_text)}
            </div>
            <div class="story-components">
                <div class="component">
                    <span class="component-label">WHO:</span>
                    <span class="component-value">${story.extracted_components.actor || 'Not specified'}</span>
                </div>
                <div class="component">
                    <span class="component-label">WHAT:</span>
                    <span class="component-value">${story.extracted_components.action || 'Not specified'}</span>
                </div>
                <div class="component">
                    <span class="component-label">WHY:</span>
                    <span class="component-value">${story.extracted_components.benefit || 'Not specified'}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    getCompletenessClass(score) {
        if (score >= 90) return 'score-excellent';
        if (score >= 70) return 'score-good';
        if (score >= 50) return 'score-fair';
        return 'score-poor';
    }

    displayDetailedTab() {
        const container = document.getElementById('detailedResults');
        container.innerHTML = '';
        
        this.currentResults.stories.forEach(story => {
            const section = this.createDetailedStorySection(story);
            container.appendChild(section);
        });
    }

    createDetailedStorySection(story) {
        const section = document.createElement('div');
        section.className = 'story-card';

        const acceptanceCriteria = story.extracted_components.acceptance_criteria.length > 0
            ? story.extracted_components.acceptance_criteria.map(ac => `<li>${this.escapeHtml(ac)}</li>`).join('')
            : '<li>No acceptance criteria found</li>';

        // Guard clarity value usage
        const clarityRating = (story.quality_metrics && story.quality_metrics.clarity_rating) ? story.quality_metrics.clarity_rating : 'unknown';
        const clarityDisplay = clarityRating.charAt(0).toUpperCase() + clarityRating.slice(1);

        section.innerHTML = `
            <div class="story-header">
                <h4>${story.story_id}</h4>
                <div class="quality-badges">
                    <span class="status status--${clarityRating}">
                        ${clarityDisplay}
                    </span>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong>Original Text:</strong>
                <div class="story-original">${this.escapeHtml(story.original_text)}</div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong>Extracted Components:</strong>
                <div class="story-components">
                    <div class="component">
                        <span class="component-label">Actor:</span>
                        <span class="component-value">${story.extracted_components.actor || 'Not found'}</span>
                    </div>
                    <div class="component">
                        <span class="component-label">Action:</span>
                        <span class="component-value">${story.extracted_components.action || 'Not found'}</span>
                    </div>
                    <div class="component">
                        <span class="component-label">Benefit:</span>
                        <span class="component-value">${story.extracted_components.benefit || 'Not found'}</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong>Acceptance Criteria:</strong>
                <ul>${acceptanceCriteria}</ul>
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong>Quality Metrics:</strong>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 8px;">
                    <div>Completeness: <strong>${story.quality_metrics.completeness_score}%</strong></div>
                    <div>Ambiguity: <strong>${story.quality_metrics.ambiguity_score}%</strong></div>
                    <div>Clarity: <strong class="quality-rating ${story.quality_metrics.clarity_rating}">${story.quality_metrics.clarity_rating}</strong></div>
                </div>
            </div>
            
            ${story.suggestions.length > 0 ? `
                <div>
                    <strong>Suggestions:</strong>
                    <ul class="suggestion-list">
                        ${story.suggestions.map(s => `
                            <li class="suggestion-item ${s.type}">
                                <span class="suggestion-icon">
                                    ${s.type === 'error' ? '❌' : s.type === 'warning' ? '⚠️' : 'ℹ️'}
                                </span>
                                <div>
                                    <strong>${s.category}:</strong> ${this.escapeHtml(s.message)}
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        return section;
    }

    displayJsonTab() {
        const jsonOutput = document.getElementById('jsonOutput');
        const formattedJson = JSON.stringify(this.currentResults, null, 2);
        jsonOutput.textContent = formattedJson;
    }

    displaySuggestionsTab() {
        const container = document.getElementById('suggestionsContent');
        container.innerHTML = '';
        
        // Aggregate suggestions by category
        const suggestionsByCategory = {};
        
        this.currentResults.stories.forEach(story => {
            story.suggestions.forEach(suggestion => {
                if (!suggestionsByCategory[suggestion.category]) {
                    suggestionsByCategory[suggestion.category] = [];
                }
                suggestionsByCategory[suggestion.category].push({
                    ...suggestion,
                    storyId: story.story_id
                });
            });
        });
        
        Object.entries(suggestionsByCategory).forEach(([category, suggestions]) => {
            const categorySection = document.createElement('div');
            categorySection.className = 'suggestion-category';
            
            categorySection.innerHTML = `
                <h4>${category} Issues (${suggestions.length})</h4>
                <ul class="suggestion-list">
                    ${suggestions.map(s => `
                        <li class="suggestion-item ${s.type}">
                            <span class="suggestion-icon">
                                ${s.type === 'error' ? '❌' : s.type === 'warning' ? '⚠️' : 'ℹ️'}
                            </span>
                            <div>
                                <strong>${s.storyId}:</strong> ${this.escapeHtml(s.message)}
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            container.appendChild(categorySection);
        });
        
        if (Object.keys(suggestionsByCategory).length === 0) {
            container.innerHTML = `
                <div class="suggestion-category">
                    <div style="text-align: center; padding: 32px; color: var(--color-text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                        <h4>Excellent Work!</h4>
                        <p>No issues found in your user stories. They all follow best practices.</p>
                    </div>
                </div>
            `;
        }
    }

    // Tab management
    switchTab(e) {
        // Accept either an event from a click handler or a direct string (future-proof)
        let tabName = null;
        if (!e) return;
        if (typeof e === 'string') {
            tabName = e;
        } else {
            const target = e.currentTarget || e.target;
            tabName = target && target.dataset ? target.dataset.tab : null;
        }
        if (!tabName) return;
        this.switchToTab(tabName);
    }

    switchToTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const btn = document.querySelector(`[data-tab="${tabName}"]`);
        if (btn) btn.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const contentEl = document.getElementById(`${tabName}Tab`);
        if (contentEl) contentEl.classList.add('active');
    }

    // Export functions
    exportAsJson() {
        if (!this.currentResults) {
            this.showError('No results to export. Please process some user stories first.');
            return;
        }
        
        const jsonString = JSON.stringify(this.currentResults, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-stories-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportAsCsv() {
        if (!this.currentResults) {
            this.showError('No results to export. Please process some user stories first.');
            return;
        }
        
        const csvRows = [
            ['Story ID', 'Original Text', 'Actor', 'Action', 'Benefit', 'Completeness %', 'Ambiguity %', 'Clarity Rating', 'Issues Count']
        ];
        
        this.currentResults.stories.forEach(story => {
            csvRows.push([
                story.story_id,
                `"${story.original_text.replace(/"/g, '""')}"`,
                story.extracted_components.actor || '',
                story.extracted_components.action || '',
                story.extracted_components.benefit || '',
                story.quality_metrics.completeness_score,
                story.quality_metrics.ambiguity_score,
                story.quality_metrics.clarity_rating,
                story.suggestions.length
            ]);
        });
        
        const csvString = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-stories-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async copyToClipboard() {
        if (!this.currentResults) {
            this.showError('No results to copy. Please process some user stories first.');
            return;
        }
        
        try {
            const jsonString = JSON.stringify(this.currentResults, null, 2);
            await navigator.clipboard.writeText(jsonString);
            this.showTemporaryMessage('Results copied to clipboard!');
        } catch (error) {
            this.showError('Failed to copy to clipboard. Your browser may not support this feature.');
        }
    }

    async copyJsonToClipboard() {
        if (!this.currentResults) {
            this.showError('No JSON to copy. Please process some user stories first.');
            return;
        }
        
        try {
            const jsonString = document.getElementById('jsonOutput').textContent;
            await navigator.clipboard.writeText(jsonString);
            this.showTemporaryMessage('JSON copied to clipboard!');
        } catch (error) {
            this.showError('Failed to copy JSON to clipboard.');
        }
    }

    // Utility functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    showTemporaryMessage(message) {
        // Create temporary success message
        const tempMessage = document.createElement('div');
        tempMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        tempMessage.textContent = message;
        
        document.body.appendChild(tempMessage);
        
        setTimeout(() => {
            tempMessage.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(tempMessage);
            }, 300);
        }, 2000);
    }
}

// Modal functions (global scope for HTML onclick handlers)
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nlpExtractor = new NLPExtractor();
    
    // Add CSS animations for temporary messages
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});