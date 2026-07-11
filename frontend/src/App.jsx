import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Upload,
  FileText,
  X,
  Settings,
  ArrowRight,
  ArrowLeft,
  Check,
  Edit2,
  Play,
  Download,
  Clipboard,
  RefreshCw,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Eye,
  ChevronDown,
  BookOpen,
  Award,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import './App.css';

function App() {
  // App States
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiOnline, setIsApiOnline] = useState(null);
  const [groqConfigured, setGroqConfigured] = useState(false);
  const [checkingApi, setCheckingApi] = useState(false);

  // File States
  const [pdfFile, setPdfFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Mode and Custom Prompt States
  const [generationMode, setGenerationMode] = useState('auto'); // auto or custom
  const [customQuestionsText, setCustomQuestionsText] = useState('');

  // Parameter States
  const [numQuestions, setNumQuestions] = useState(5);

  // Generation States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  
  // Quiz Results States
  const [quizMeta, setQuizMeta] = useState(null); // { filename, extracted_chars }
  const [questions, setQuestions] = useState([]); // Array of questions
  const [activeTab, setActiveTab] = useState('review'); // review, practice, json

  // Quiz Editor States
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A'
  });

  // Practice Mode States
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState({}); // { qIndex: selectedLetter }
  const [isPracticeSubmitted, setIsPracticeSubmitted] = useState(false);

  // UI Utilities
  const [copied, setCopied] = useState(false);
  const fileDropZoneRef = useRef(null);

  const loadingMessages = [
    "Establishing secure link to AI synthesis core...",
    "Ingesting PDF stream and parsing structures...",
    "Running optical symbol and text alignment...",
    "Mining semantic nodes and core concepts...",
    "Drafting conceptual multiple-choice items...",
    "Balancing distractor alternatives...",
    "Refining correct answer references...",
    "Securing quiz payload structures..."
  ];

  // Ping API on load and URL changes
  useEffect(() => {
    pingApi();
  }, [backendUrl]);

  // Loading screen text cycle effect
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const pingApi = async () => {
    setCheckingApi(true);
    const sanitizedUrl = backendUrl.replace(/\/$/, "");
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      
      const res = await fetch(`${sanitizedUrl}/`, { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(id);
      
      if (res.ok) {
        const data = await res.json();
        setIsApiOnline(true);
        setGroqConfigured(data.groq_configured);
      } else {
        setIsApiOnline(false);
      }
    } catch (err) {
      setIsApiOnline(false);
    } finally {
      setCheckingApi(false);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setPdfFile(file);
      } else {
        setError("Only PDF documents are supported for quiz synthesis.");
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate Quiz Trigger
  const generateQuiz = async () => {
    if (!pdfFile) {
      setError("Please upload a PDF document first.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuizMeta(null);
    setQuestions([]);
    setIsPracticeSubmitted(false);
    setPracticeAnswers({});
    setCurrentPracticeIndex(0);

    const formData = new FormData();
    formData.append("file", pdfFile);

    // If custom mode is active and we have custom questions, append them
    if (generationMode === 'custom' && customQuestionsText.trim()) {
      formData.append("custom_questions", customQuestionsText.trim());
    }

    const sanitizedUrl = backendUrl.replace(/\/$/, "");

    try {
      const res = await fetch(`${sanitizedUrl}/generate-quiz?num_questions=${numQuestions}`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned status code ${res.status}`);
      }

      const data = await res.json();
      setQuizMeta({
        filename: data.filename,
        extracted_chars: data.extracted_chars
      });
      setQuestions(data.questions);
      setActiveTab('review');
    } catch (err) {
      setError(err.message || "An unexpected error occurred during synthesis.");
    } finally {
      setLoading(false);
    }
  };

  // Tutor Question Editing Handlers
  const startEditing = (index) => {
    setEditingIndex(index);
    setEditForm({ ...questions[index] });
  };

  const saveEdit = (index) => {
    const updated = [...questions];
    updated[index] = { ...editForm };
    setQuestions(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  const handleEditFormChange = (field, val) => {
    setEditForm(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Practice Quiz Actions
  const handleSelectAnswer = (qIndex, letter) => {
    if (isPracticeSubmitted) return;
    setPracticeAnswers(prev => ({
      ...prev,
      [qIndex]: letter
    }));
  };

  const submitPracticeQuiz = () => {
    setIsPracticeSubmitted(true);
  };

  const resetPracticeQuiz = () => {
    setPracticeAnswers({});
    setIsPracticeSubmitted(false);
    setCurrentPracticeIndex(0);
  };

  const getScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (practiceAnswers[idx] === q.correct_answer) {
        score++;
      }
    });
    return score;
  };

  // JSON Utilities
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `quiz_${pdfFile?.name.replace(".pdf", "") || "generated"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helpers for question collapsible cards
  const [expandedCards, setExpandedCards] = useState({});
  const toggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="app-layout">
      {/* Background Ambience elements */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Navigation Header */}
      <header className="app-header glass-panel">
        <div className="logo-section">
          <div className="logo-icon">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="logo-text gradient-accent">AetherQuiz AI</span>
        </div>

        <div className="server-status">
          <div className={`status-dot ${isApiOnline ? 'online' : 'offline'}`}></div>
          <span>
            {checkingApi ? 'Connecting...' : isApiOnline ? 'Core Online' : 'Core Offline'}
          </span>
          <button 
            onClick={pingApi} 
            className="remove-file-btn" 
            style={{ marginLeft: 4 }}
            title="Refresh status"
            disabled={checkingApi}
          >
            <RefreshCw size={12} className={checkingApi ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="dashboard-grid">
        
        {/* Left Control Sidebar */}
        <section className="control-sidebar">
          
          {/* Main Controls Panel */}
          <div className="control-panel glass-panel">
            <h2 className="panel-title">
              <BookOpen size={18} className="text-purple-400" />
              <span>Forge Portal</span>
            </h2>

            {/* Advanced Settings Accordion */}
            <div className="settings-accordion">
              <div 
                className="settings-header"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Settings size={14} />
                  <span>API Configuration</span>
                </div>
                <ChevronDown size={14} style={{ transform: isSettingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              
              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="settings-content"
                  >
                    <div className="input-group">
                      <span className="input-label">Backend API URL</span>
                      <input 
                        type="text" 
                        value={backendUrl}
                        onChange={(e) => setBackendUrl(e.target.value)}
                        className="text-input" 
                        placeholder="http://localhost:8000"
                      />
                    </div>
                    {!groqConfigured && isApiOnline && (
                      <div className="error-banner" style={{ fontSize: 11, display: 'flex', gap: 6, alignItems: 'flex-start', color: '#ff4a70', background: 'rgba(255, 74, 112, 0.05)', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255, 74, 112, 0.1)' }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>GROQ_API_KEY is not set on the server environment. Generation will fail.</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* File Drag and Drop Zone */}
            <div className="input-group">
              <span className="input-label">Syllabus / Source PDF</span>
              
              {!pdfFile ? (
                <div 
                  ref={fileDropZoneRef}
                  className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="application/pdf"
                    style={{ display: 'none' }}
                  />
                  <div className="upload-icon-container">
                    <Upload size={24} />
                  </div>
                  <div className="drop-zone-text">
                    <span>Click to upload</span> or drag PDF here
                  </div>
                  <div className="file-specs">
                    Maximum text extraction size: 12k characters
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="file-info-card"
                >
                  <div className="file-info-left">
                    <FileText size={24} className="file-pdf-icon" />
                    <div className="file-name-meta">
                      <span className="file-name" title={pdfFile.name}>{pdfFile.name}</span>
                      <span className="file-size">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button onClick={removeFile} className="remove-file-btn">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Generation Mode Selector */}
            <div className="input-group">
              <span className="input-label">Generation Mode</span>
              <div style={{ display: 'flex', gap: 6, background: 'rgba(0, 0, 0, 0.2)', padding: 4, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setGenerationMode('auto')}
                  className={`tab-btn ${generationMode === 'auto' ? 'active' : ''}`}
                  style={{ padding: '6px 10px', fontSize: 12, flex: 1 }}
                >
                  Auto-Gen
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode('custom')}
                  className={`tab-btn ${generationMode === 'custom' ? 'active' : ''}`}
                  style={{ padding: '6px 10px', fontSize: 12, flex: 1 }}
                >
                  Custom Prompts
                </button>
              </div>
            </div>

            {/* Parameter Selector / Textarea depending on Mode */}
            {generationMode === 'auto' ? (
              <div className="parameter-section">
                <div className="param-header">
                  <span className="param-label">Target Questions</span>
                  <span className="param-value">{numQuestions}</span>
                </div>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="styled-slider"
                  />
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="input-group"
              >
                <div className="param-header" style={{ marginBottom: 4 }}>
                  <span className="param-label">Custom Questions</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>One per line</span>
                </div>
                <textarea 
                  value={customQuestionsText}
                  onChange={(e) => setCustomQuestionsText(e.target.value)}
                  className="text-input" 
                  placeholder="e.g.&#10;What are the three stages of glycolysis?&#10;How does the author define active transport?&#10;Explain the cellular membrane structure."
                  rows={5}
                  style={{ 
                    resize: 'vertical', 
                    minHeight: 120, 
                    fontFamily: 'var(--font-family)', 
                    fontSize: 13, 
                    lineHeight: 1.4 
                  }}
                />
              </motion.div>
            )}

            {/* Action Trigger */}
            <button 
              onClick={generateQuiz}
              disabled={loading || !pdfFile || !isApiOnline || (generationMode === 'custom' && !customQuestionsText.trim())}
              className="forge-btn"
            >
              <Sparkles size={16} />
              <span>
                {loading 
                  ? 'Synthesizing...' 
                  : generationMode === 'custom' 
                    ? 'Forge Custom Quiz' 
                    : 'Forge Auto Quiz'}
              </span>
            </button>
          </div>

          {/* Simple Error Console */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel" 
              style={{ padding: 18, borderLeft: '4px solid var(--accent-rose)', display: 'flex', gap: 12 }}
            >
              <AlertCircle size={20} className="text-red-400" style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-rose)' }}>Synthesis Interrupted</span>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{error}</p>
              </div>
            </motion.div>
          )}
        </section>

        {/* Right Output Section */}
        <section className="display-section glass-panel">
          
          <AnimatePresence mode="wait">
            
            {/* 1. EMPTY STATE */}
            {!loading && questions.length === 0 && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="empty-state-panel"
              >
                <div className="empty-graphic">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring-inner"></div>
                  <FileText className="floating-icon" />
                </div>
                <div className="empty-headline font-bold">Awaiting Corpus Data</div>
                <p className="empty-description">
                  Upload your PDF syllabus or reading material in the Forge Portal. We will parse its contents and synthesize custom evaluation questions.
                </p>
              </motion.div>
            )}

            {/* 2. LOADING STATE */}
            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="loader-panel"
              >
                <div className="scanning-container">
                  <div className="scanning-bar"></div>
                  <FileText className="scanning-doc-icon" />
                </div>
                
                <div className="loader-status-container">
                  <span className="loader-title">Synthesizing Evaluation Matrix</span>
                  <motion.span 
                    key={loadingStep}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="loader-subtitle"
                  >
                    {loadingMessages[loadingStep]}
                  </motion.span>
                </div>
              </motion.div>
            )}

            {/* 3. RESULTS AND TABS STATE */}
            {!loading && questions.length > 0 && (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}
              >
                {/* Stats Summary Header */}
                <div className="results-header-card">
                  <div className="results-title-meta">
                    <h3>Quiz Generated</h3>
                    <div className="results-stats-row">
                      <div className="stat-item">
                        <FileText size={12} />
                        <span>{quizMeta?.filename}</span>
                      </div>
                      <div className="stat-item">
                        <Sparkles size={12} />
                        <span>{quizMeta?.extracted_chars} characters analyzed</span>
                      </div>
                    </div>
                  </div>

                  <div className="action-bar">
                    <button onClick={downloadJson} className="btn-secondary" title="Download JSON file">
                      <Download size={14} />
                      <span>Export</span>
                    </button>
                    <button onClick={copyToClipboard} className="btn-secondary" title="Copy JSON array">
                      <Clipboard size={14} />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Tab select bar */}
                <div className="tabs-navigation">
                  <button 
                    onClick={() => setActiveTab('review')}
                    className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
                  >
                    <Edit2 size={14} />
                    <span>Review & Edit</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('practice')}
                    className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
                  >
                    <Play size={14} />
                    <span>Interactive Practice</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('json')}
                    className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
                  >
                    <FileCode size={14} />
                    <span>JSON Raw payload</span>
                  </button>
                </div>

                {/* Tab content displays */}
                <div className="tab-content-panel">
                  
                  {/* TAB: REVIEW & EDIT */}
                  {activeTab === 'review' && (
                    <div className="review-questions-list">
                      {questions.map((q, idx) => {
                        const isExpanded = !!expandedCards[idx] || editingIndex === idx;
                        const isEditing = editingIndex === idx;

                        return (
                          <motion.div 
                            layout
                            key={idx}
                            className={`question-item ${isExpanded ? 'expanded' : ''}`}
                          >
                            {/* Card Trigger Row */}
                            <div 
                              className="question-header-row"
                              onClick={() => !isEditing && toggleCard(idx)}
                            >
                              <div className="question-number-text">
                                <span className="q-index-badge">Q{idx + 1}</span>
                                <span className="q-text">{q.question}</span>
                              </div>
                              {!isEditing && (
                                <ChevronDown 
                                  size={16} 
                                  className="collapse-icon" 
                                />
                              )}
                            </div>

                            {/* Collapsible Details */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="question-details-panel"
                                >
                                  {isEditing ? (
                                    /* EDITING SUB-FORM */
                                    <div style={{ width: '100%' }}>
                                      <textarea
                                        value={editForm.question}
                                        onChange={(e) => handleEditFormChange('question', e.target.value)}
                                        className="edit-q-input"
                                        rows={3}
                                      />
                                      <div className="options-grid">
                                        {['a', 'b', 'c', 'd'].map((optKey) => (
                                          <div key={optKey} className="edit-opt-input-row">
                                            <input 
                                              type="radio" 
                                              name={`correct-ans-${idx}`}
                                              checked={editForm.correct_answer === optKey.toUpperCase()}
                                              onChange={() => handleEditFormChange('correct_answer', optKey.toUpperCase())}
                                              className="correct-select-radio"
                                              title="Mark as correct answer"
                                            />
                                            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 20 }}>
                                              {optKey.toUpperCase()})
                                            </span>
                                            <input
                                              type="text"
                                              value={editForm[`option_${optKey}`]}
                                              onChange={(e) => handleEditFormChange(`option_${optKey}`, e.target.value)}
                                              placeholder={`Option ${optKey.toUpperCase()}`}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div className="edit-actions-bar">
                                        <button 
                                          onClick={cancelEdit} 
                                          className="btn-secondary"
                                          style={{ padding: '6px 12px', fontSize: 12 }}
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={() => saveEdit(idx)} 
                                          className="forge-btn"
                                          style={{ width: 'auto', padding: '6px 16px', fontSize: 12, boxShadow: 'none' }}
                                        >
                                          <Check size={14} />
                                          <span>Save changes</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* DISPLAY CARD */
                                    <>
                                      <div className="options-grid">
                                        {['a', 'b', 'c', 'd'].map((key) => {
                                          const uppercaseKey = key.toUpperCase();
                                          const optText = q[`option_${key}`];
                                          const isCorrect = q.correct_answer === uppercaseKey;

                                          return (
                                            <div 
                                              key={key} 
                                              className={`option-review-pill ${isCorrect ? 'correct-ans' : ''}`}
                                            >
                                              <span className="option-letter-badge">{uppercaseKey}</span>
                                              <span>{optText}</span>
                                              {isCorrect && (
                                                <span className="correct-indicator-mark">
                                                  <CheckCircle2 size={16} />
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(idx);
                                          }} 
                                          className="btn-secondary"
                                          style={{ display: 'flex', gap: 6, fontSize: 12, padding: '6px 12px' }}
                                        >
                                          <Edit2 size={12} />
                                          <span>Edit Question</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB: INTERACTIVE PRACTICE */}
                  {activeTab === 'practice' && (
                    <div className="practice-container">
                      {!isPracticeSubmitted ? (
                        <>
                          {/* Question progress and tracker */}
                          <div className="practice-progress-bar-container">
                            <div className="practice-progress-text-row">
                              <span>Question {currentPracticeIndex + 1} of {questions.length}</span>
                              <span>
                                {Math.round(((Object.keys(practiceAnswers).length) / questions.length) * 100)}% Answered
                              </span>
                            </div>
                            <div className="bar-track">
                              <div 
                                className="bar-fill" 
                                style={{ width: `${((currentPracticeIndex + 1) / questions.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Interactive Display Card */}
                          <div className="practice-question-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                            <p className="practice-q-text">
                              {questions[currentPracticeIndex]?.question}
                            </p>
                          </div>

                          {/* Action alternatives */}
                          <div className="practice-options-grid">
                            {['a', 'b', 'c', 'd'].map((key) => {
                              const letter = key.toUpperCase();
                              const text = questions[currentPracticeIndex]?.[`option_${key}`];
                              const isSelected = practiceAnswers[currentPracticeIndex] === letter;

                              return (
                                <button
                                  key={key}
                                  onClick={() => handleSelectAnswer(currentPracticeIndex, letter)}
                                  className={`practice-option-btn ${isSelected ? 'selected' : ''}`}
                                >
                                  <span className="option-letter-badge">{letter}</span>
                                  <span>{text}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Pagination controls */}
                          <div className="practice-navigation-row">
                            <button
                              disabled={currentPracticeIndex === 0}
                              onClick={() => setCurrentPracticeIndex(prev => prev - 1)}
                              className="btn-secondary"
                            >
                              <ArrowLeft size={16} />
                              <span>Previous</span>
                            </button>

                            {currentPracticeIndex < questions.length - 1 ? (
                              <button
                                disabled={!practiceAnswers[currentPracticeIndex]}
                                onClick={() => setCurrentPracticeIndex(prev => prev + 1)}
                                className="btn-secondary"
                              >
                                <span>Next</span>
                                <ArrowRight size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={submitPracticeQuiz}
                                disabled={Object.keys(practiceAnswers).length < questions.length}
                                className="forge-btn"
                                style={{ width: 'auto', padding: '10px 24px', boxShadow: 'none' }}
                              >
                                <Award size={16} />
                                <span>Submit quiz</span>
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        /* PRACTICE COMPLETE SUMMARY SCREEN */
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="score-summary-card glass-panel"
                        >
                          <Award size={42} className="text-yellow-400" />
                          
                          <div className="score-radial-progress">
                            <svg className="score-radial-svg">
                              <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="var(--primary)" />
                                  <stop offset="100%" stopColor="var(--accent-cyan)" />
                                </linearGradient>
                              </defs>
                              <circle className="score-radial-bg-circle" cx="80" cy="80" r="70" />
                              <circle 
                                className="score-radial-fill-circle" 
                                cx="80" 
                                cy="80" 
                                r="70" 
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * (getScore() / questions.length))}
                              />
                            </svg>
                            <span className="score-percentage-value">
                              {Math.round((getScore() / questions.length) * 100)}%
                            </span>
                          </div>

                          <div className="score-rating-text">
                            {getScore() === questions.length 
                              ? 'Perfect synthesis!' 
                              : getScore() >= questions.length * 0.7 
                                ? 'Excellent achievement!' 
                                : 'Quiz completed!'}
                          </div>

                          <p className="score-details-text">
                            You scored <strong>{getScore()}</strong> correct answers out of <strong>{questions.length}</strong> questions.
                          </p>

                          <div className="score-action-buttons">
                            <button onClick={resetPracticeQuiz} className="btn-secondary">
                              <RefreshCw size={14} />
                              <span>Try again</span>
                            </button>
                            <button 
                              onClick={() => {
                                setIsPracticeSubmitted(false);
                                setActiveTab('review');
                              }} 
                              className="forge-btn"
                              style={{ width: 'auto', padding: '10px 20px', boxShadow: 'none' }}
                            >
                              <Eye size={14} />
                              <span>Review correct answers</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* TAB: RAW JSON PAYLOAD */}
                  {activeTab === 'json' && (
                    <div className="json-panel">
                      <div className="json-editor-container">
                        <pre className="json-codeblock">
                          {JSON.stringify(questions, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

export default App;
