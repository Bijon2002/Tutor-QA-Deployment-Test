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
  RotateCcw,
  BookOpenCheck
} from 'lucide-react';
import './App.css';

function App() {
  // Wizard steps: 0 = Upload, 1 = Config, 2 = Loading, 3 = Deck Results
  const [step, setStep] = useState(0);

  // App Settings States
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiOnline, setIsApiOnline] = useState(null);
  const [groqConfigured, setGroqConfigured] = useState(false);
  const [checkingApi, setCheckingApi] = useState(false);

  // File Upload States
  const [pdfFile, setPdfFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Mode and Custom Prompt States
  const [generationMode, setGenerationMode] = useState('auto'); // auto or custom
  const [customQuestionsText, setCustomQuestionsText] = useState('');

  // Parameter Configurations
  const [numQuestions, setNumQuestions] = useState(5);

  // Generation & Status States
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  
  // Quiz Results States
  const [quizMeta, setQuizMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('review'); // review, practice, json

  // 3D Card Flip States
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Interactive Tutor Question Editor Form
  const [editForm, setEditForm] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A'
  });

  // Practice Simulation States
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [isPracticeSubmitted, setIsPracticeSubmitted] = useState(false);

  // UI Utilities
  const [copied, setCopied] = useState(false);
  const consoleEndRef = useRef(null);

  // Activity Log Stream
  const [logs, setLogs] = useState([
    { type: 'info', text: 'System log feed active.' },
    { type: 'info', text: 'Awaiting backend connection...' }
  ]);

  const addLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { type, text: `[${timestamp}] ${text}` }]);
  };

  const loadingMessages = [
    "Establishing pipeline...",
    "Transmitting PDF packets...",
    "Scanning text fragments...",
    "Compiling relationships...",
    "Formatting options...",
    "Validating answer schema...",
    "Confirming facts integrity...",
    "Decrypting payload..."
  ];

  // Auto scroll console logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Ping API on start and URL changes
  useEffect(() => {
    pingApi();
  }, [backendUrl]);

  // Loading text cycler
  useEffect(() => {
    let interval;
    if (step === 2) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          const nextVal = prev < loadingMessages.length - 1 ? prev + 1 : prev;
          addLog(`${loadingMessages[nextVal]}`, 'warning');
          return nextVal;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [step]);

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
        addLog(`Handshake accepted. AI core online.`, 'success');
      } else {
        setIsApiOnline(false);
        addLog(`Handshake rejected. Status ${res.status}`, 'error');
      }
    } catch (err) {
      setIsApiOnline(false);
      addLog(`Handshake timed out. Core backend offline.`, 'error');
    } finally {
      setCheckingApi(false);
    }
  };

  // Drag and Drop
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
        addLog(`Loaded "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
        setStep(1); // Advance to configuration step
      } else {
        setError("Only PDF documents are supported for quiz synthesis.");
        addLog(`Refused non-PDF document "${file.name}".`, 'error');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      addLog(`Loaded "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
      setStep(1); // Advance to configuration step
    }
  };

  const ejectFile = () => {
    addLog(`Ejected "${pdfFile?.name}". Returning to upload.`, 'warning');
    setPdfFile(null);
    setQuestions([]);
    setStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate Quiz
  const generateQuiz = async () => {
    if (!pdfFile) {
      setError("Please upload a PDF document first.");
      setStep(0);
      return;
    }

    setStep(2); // Set loading view
    setError(null);
    setQuizMeta(null);
    setQuestions([]);
    setIsPracticeSubmitted(false);
    setPracticeAnswers({});
    setCurrentDeckIndex(0);
    setIsFlipped(false);

    addLog(`Ingesting PDF stream and uploading context...`, 'warning');

    const formData = new FormData();
    formData.append("file", pdfFile);

    if (generationMode === 'custom' && customQuestionsText.trim()) {
      formData.append("custom_questions", customQuestionsText.trim());
      addLog(`Using custom question list for synthesis.`, 'info');
    } else {
      addLog(`Auto-generating ${numQuestions} questions from material.`, 'info');
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
      setStep(3); // Advance to deck results
      addLog(`Compilation complete. Forged ${data.questions.length} questions.`, 'success');
    } catch (err) {
      setError(err.message || "An unexpected error occurred during synthesis.");
      setStep(1); // Fall back to config step
      addLog(`Compilation failed: ${err.message}`, 'error');
    }
  };

  // 3D Card Editor Actions
  const openEditor = (idx) => {
    setEditForm({ ...questions[idx] });
    setIsFlipped(true);
    addLog(`Flipping question card ${idx + 1} into editor mode.`, 'info');
  };

  const saveEdit = (idx) => {
    const updated = [...questions];
    updated[idx] = { ...editForm };
    setQuestions(updated);
    setIsFlipped(false);
    addLog(`Saved changes. Flipping question card ${idx + 1} back.`, 'success');
  };

  const closeEditor = () => {
    setIsFlipped(false);
    addLog(`Cancelled editing. Flipping question card back.`, 'warning');
  };

  const handleEditFormChange = (field, val) => {
    setEditForm(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Practice Test Interaction
  const handleSelectAnswer = (qIndex, letter) => {
    if (isPracticeSubmitted) return;
    setPracticeAnswers(prev => ({
      ...prev,
      [qIndex]: letter
    }));
    addLog(`Logged response Q${qIndex + 1} -> ${letter}`, 'info');
  };

  const submitPracticeQuiz = () => {
    setIsPracticeSubmitted(true);
    const score = getScore();
    addLog(`Submitted practice deck. Final Score: ${score}/${questions.length}`, 'success');
  };

  const resetPracticeQuiz = () => {
    setPracticeAnswers({});
    setIsPracticeSubmitted(false);
    setCurrentDeckIndex(0);
    setIsFlipped(false);
    addLog(`Simulator reset. Starting new run.`, 'warning');
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

  // Copy/Download
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
    setCopied(true);
    addLog(`Copied quiz JSON stream to clipboard.`, 'info');
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
    addLog(`Downloaded quiz JSON.`, 'info');
  };

  const toggleMode = (mode) => {
    setGenerationMode(mode);
    addLog(`Switched format mode to ${mode === 'auto' ? 'Automatic Quiz' : 'Custom Prompt entries'}.`, 'info');
  };

  return (
    <div className="app-wrapper">

      {/* Background Soft Organic Pastel Blobs */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      <div className="ambient-glow-3"></div>

      {/* Header Info Badge */}
      <div className="header-badge">
        <Sparkles size={13} className="gradient-accent" />
        <span className="badge-text gradient-text">AetherQuiz AI</span>
        <div style={{ width: 1, height: 12, background: 'var(--border-light)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className={`status-dot ${isApiOnline ? 'online' : 'offline'}`} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
            {isApiOnline ? 'CONNECTED' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Morphing Card Wrapper */}
      <div className="morph-card">
        
        {/* STEP 0: DOCUMENT INGESTION */}
        {step === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="step-upload"
          >
            <div 
              className={`upload-portal ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="portal-pulse-ring"></div>
              <Upload size={32} />
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="application/pdf"
              style={{ display: 'none' }}
            />

            <h1 className="upload-title">Drop PDF Syllabus</h1>
            <p className="upload-description">
              Upload a reading paper, slide segment, or course syllabus PDF. The AI will parse details to formulate interactive question sets.
            </p>
          </motion.div>
        )}

        {/* STEP 1: PARAMETER CONFIGURATION */}
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="step-config"
          >
            <div className="config-header-row">
              <h2 className="panel-title">
                <BookOpen size={16} />
                <span>Quiz Options</span>
              </h2>
              <div className="file-badge-pill">
                <FileText size={13} className="text-indigo-500" />
                <span className="file-badge-text" title={pdfFile?.name}>{pdfFile?.name}</span>
                <button onClick={ejectFile} className="remove-file-btn" style={{ padding: 2 }} title="Eject file">
                  <X size={12} />
                </button>
              </div>
            </div>

            <div className="config-options-layout">
              {/* Connections config (inline settings collapsible) */}
              <div className="settings-accordion">
                <div 
                  className="settings-header"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Settings size={12} />
                    <span>Host Settings</span>
                  </div>
                  <ChevronDown size={12} style={{ transform: isSettingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                
                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="settings-content"
                    >
                      <div className="input-group">
                        <span className="input-label">Backend Host URL</span>
                        <input 
                          type="text" 
                          value={backendUrl}
                          onChange={(e) => setBackendUrl(e.target.value)}
                          className="text-input" 
                          placeholder="http://localhost:8000"
                        />
                      </div>
                      {!groqConfigured && isApiOnline && (
                        <div style={{ fontSize: 11, display: 'flex', gap: 6, alignItems: 'flex-start', color: 'var(--accent-rose)', border: '1px dashed var(--accent-rose)', padding: 8, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8 }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>GROQ_API_KEY environment variable is not active on host.</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mode Toggle */}
              <div className="input-group">
                <span className="input-label">Generation Mode</span>
                <div className="mode-pills-container">
                  <button
                    type="button"
                    onClick={() => toggleMode('auto')}
                    className={`mode-pill-btn ${generationMode === 'auto' ? 'active' : ''}`}
                  >
                    Auto-Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMode('custom')}
                    className={`mode-pill-btn ${generationMode === 'custom' ? 'active' : ''}`}
                  >
                    Custom Prompts
                  </button>
                </div>
              </div>

              {/* Mode configs */}
              {generationMode === 'auto' ? (
                <div className="parameter-section">
                  <div className="param-header">
                    <span className="param-label">Number of Questions</span>
                    <span className="param-value">{numQuestions}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={numQuestions}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setNumQuestions(val);
                      addLog(`Adjusted size target to ${val} questions.`, 'info');
                    }}
                    className="styled-slider"
                  />
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="input-group"
                >
                  <div className="param-header">
                    <span className="param-label">Enter Question Prompts</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ONE PER LINE</span>
                  </div>
                  <textarea 
                    value={customQuestionsText}
                    onChange={(e) => setCustomQuestionsText(e.target.value)}
                    className="text-input" 
                    placeholder="e.g.&#10;What are the three stages of glycolysis?&#10;Define the role of the cell membrane.&#10;Describe passive transport mechanics."
                    rows={4}
                    style={{ resize: 'vertical', minHeight: 110, fontSize: 13, lineHeight: 1.4 }}
                  />
                </motion.div>
              )}

              {/* Error Display */}
              {error && (
                <div style={{ display: 'flex', gap: 10, padding: 12, border: '1px solid var(--accent-rose)', borderRadius: 10, background: 'rgba(239, 68, 68, 0.03)', color: 'var(--accent-rose)' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, lineHeight: 1.4 }}>{error}</span>
                </div>
              )}

              {/* Generate Trigger */}
              <button 
                onClick={generateQuiz}
                disabled={!isApiOnline || (generationMode === 'custom' && !customQuestionsText.trim())}
                className="forge-action-btn"
              >
                <Sparkles size={15} />
                <span>Begin Quiz Synthesis</span>
              </button>

              {/* Slate Activity log scroll */}
              <div className="sleek-activity-feed">
                <div className="logs-scroll">
                  {logs.map((log, idx) => (
                    <div key={idx} className={`log-line ${log.type}`}>
                      {log.text.startsWith('[') ? (
                        <>
                          <span style={{ color: 'var(--text-dim)', marginRight: 4 }}>{log.text.split(' ')[0]}</span>
                          <span>{log.text.split(' ').slice(1).join(' ')}</span>
                        </>
                      ) : (
                        <span>{log.text}</span>
                      )}
                    </div>
                  ))}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: LOADING SYNTHESIS */}
        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="step-loading"
          >
            <div className="spinner-outer">
              <div className="spinner-ring"></div>
              <Sparkles className="spinner-doc-icon" size={26} />
            </div>
            
            <div className="loader-status-container">
              <span className="loading-title">Synthesizing Evaluation Deck</span>
              <motion.span 
                key={loadingStep}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="loading-subtitle"
              >
                {loadingMessages[loadingStep]}
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* STEP 3: RESULTS SLIDESHOW PRESENTATION DECK */}
        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="step-results-deck"
          >
            {/* Header file stats info */}
            <div className="deck-meta-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={13} className="text-indigo-500" />
                <strong style={{ color: 'var(--text-primary)' }}>{quizMeta?.filename}</strong>
              </div>
              <div>
                <span>{quizMeta?.extracted_chars} characters parsed</span>
              </div>
            </div>

            {/* View frames by Tab */}
            <div className="deck-card-carousel">
              
              {/* TAB: REVIEW ARRAY (WITH 3D CARD FLIP) */}
              {activeTab === 'review' && (
                <div className="perspective-container">
                  <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
                    
                    {/* FLIP SIDE: FRONT (DISPLAY CARD) */}
                    <div className="flip-card-front">
                      <div className="quiz-deck-card">
                        <div className="card-question-text">
                          {questions[currentDeckIndex]?.question}
                        </div>
                        
                        <div className="card-options-grid">
                          {['a', 'b', 'c', 'd'].map((key) => {
                            const uppercaseKey = key.toUpperCase();
                            const optText = questions[currentDeckIndex]?.[`option_${key}`];
                            const isCorrect = questions[currentDeckIndex]?.correct_answer === uppercaseKey;

                            return (
                              <div 
                                key={key} 
                                className={`deck-option-pill disabled ${isCorrect ? 'correct-ans' : ''}`}
                              >
                                <span className="option-letter-badge">{uppercaseKey}</span>
                                <span>{optText}</span>
                                {isCorrect && (
                                  <span className="correct-indicator">
                                    <CheckCircle2 size={15} />
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button 
                            onClick={() => openEditor(currentDeckIndex)}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12 }}
                          >
                            <Edit2 size={12} />
                            <span>Refine Question</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* FLIP SIDE: BACK (INLINE EDITOR FORM) */}
                    <div className="flip-card-back">
                      <div className="card-edit-form">
                        <div>
                          <span className="edit-q-label">Question Text</span>
                          <textarea
                            value={editForm.question}
                            onChange={(e) => handleEditFormChange('question', e.target.value)}
                            className="edit-q-textarea"
                          />
                        </div>

                        <div className="edit-options-grid">
                          {['a', 'b', 'c', 'd'].map((key) => (
                            <div key={key} className="edit-option-row">
                              <input 
                                type="radio" 
                                name="edit-correct"
                                checked={editForm.correct_answer === key.toUpperCase()}
                                onChange={() => handleEditFormChange('correct_answer', key.toUpperCase())}
                                className="correct-select-radio"
                                title="Mark as correct key"
                              />
                              <span style={{ fontSize: 11, fontWeight: 700, minWidth: 16 }}>{key.toUpperCase()}:</span>
                              <input 
                                type="text"
                                value={editForm[`option_${key}`]}
                                onChange={(e) => handleEditFormChange(`option_${key}`, e.target.value)}
                                className="edit-opt-field"
                                placeholder={`Option ${key.toUpperCase()}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="edit-actions-row">
                          <button onClick={closeEditor} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>
                            Cancel
                          </button>
                          <button onClick={() => saveEdit(currentDeckIndex)} className="btn-success" style={{ padding: '6px 16px', fontSize: 12 }}>
                            Apply Changes
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB: PRACTICE SIMULATOR RUN */}
              {activeTab === 'practice' && (
                <div className="quiz-deck-card">
                  {!isPracticeSubmitted ? (
                    <>
                      <div className="practice-progress-bar-container">
                        <div className="practice-progress-text-row">
                          <span>QUESTION {currentDeckIndex + 1} OF {questions.length}</span>
                          <span>{Object.keys(practiceAnswers).length} / {questions.length} ANSWERED</span>
                        </div>
                        <div className="bar-track">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${((currentDeckIndex + 1) / questions.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="card-question-text" style={{ minHeight: 60, display: 'flex', alignItems: 'center' }}>
                        {questions[currentDeckIndex]?.question}
                      </div>

                      <div className="card-options-grid">
                        {['a', 'b', 'c', 'd'].map((key) => {
                          const letter = key.toUpperCase();
                          const text = questions[currentDeckIndex]?.[`option_${key}`];
                          const isSelected = practiceAnswers[currentDeckIndex] === letter;

                          return (
                            <button
                              key={key}
                              onClick={() => handleSelectAnswer(currentDeckIndex, letter)}
                              className={`deck-option-pill ${isSelected ? 'selected-run' : ''}`}
                            >
                              <span className="option-letter-badge">{letter}</span>
                              <span>{text}</span>
                            </button>
                          );
                        })}
                      </div>
                      
                      <div style={{ height: 38 }} /> {/* Spacer to balance height */}
                    </>
                  ) : (
                    /* PRACTICE COMPLETE SUMMARY */
                    <div className="score-summary-deck">
                      <Award size={36} className="text-indigo-500" />
                      
                      <div className="score-radial-progress">
                        <svg className="score-radial-svg">
                          <circle className="score-radial-bg-circle" cx="65" cy="65" r="55" />
                          <circle 
                            className="score-radial-fill-circle" 
                            cx="65" 
                            cy="65" 
                            r="55" 
                            strokeDasharray={345}
                            strokeDashoffset={345 - (345 * (getScore() / questions.length))}
                          />
                        </svg>
                        <span className="score-percentage-value">
                          {Math.round((getScore() / questions.length) * 100)}%
                        </span>
                      </div>

                      <div className="score-rating-text">
                        {getScore() === questions.length 
                          ? 'Perfect Score!' 
                          : getScore() >= questions.length * 0.7 
                            ? 'Great Achievement!' 
                            : 'Practice Complete'}
                      </div>

                      <p className="score-details-text">
                        Evaluated Score: <strong>{getScore()}</strong> correct answers out of <strong>{questions.length}</strong> questions.
                      </p>

                      <div className="score-action-buttons">
                        <button onClick={resetPracticeQuiz} className="btn-secondary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <RotateCcw size={12} />
                          <span>Retake Run</span>
                        </button>
                        <button 
                          onClick={() => {
                            setIsPracticeSubmitted(false);
                            setActiveTab('review');
                          }} 
                          className="btn-success"
                          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                        >
                          <Eye size={12} />
                          <span>Review Correct Keys</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: RAW JSON OUTPUT */}
              {activeTab === 'json' && (
                <div className="json-view-container">
                  <pre className="json-codeblock">
                    {JSON.stringify(questions, null, 2)}
                  </pre>
                </div>
              )}

            </div>

            {/* Slideshow pagination control bar */}
            {activeTab !== 'json' && (!isPracticeSubmitted || activeTab !== 'practice') && (
              <div className="deck-navigation-bar">
                <button
                  disabled={currentDeckIndex === 0 || isFlipped}
                  onClick={() => {
                    setCurrentDeckIndex(prev => prev - 1);
                    addLog(`Slid back to card index Q${currentDeckIndex}`, 'info');
                  }}
                  className="carousel-arrow-btn"
                  title="Previous question"
                >
                  <ArrowLeft size={16} />
                </button>
                
                <span className="deck-index-indicator">
                  CARD {currentDeckIndex + 1} OF {questions.length}
                </span>

                {currentDeckIndex < questions.length - 1 ? (
                  <button
                    disabled={(activeTab === 'practice' && !practiceAnswers[currentDeckIndex]) || isFlipped}
                    onClick={() => {
                      setCurrentDeckIndex(prev => prev + 1);
                      addLog(`Slid forward to card index Q${currentDeckIndex + 2}`, 'info');
                    }}
                    className="carousel-arrow-btn"
                    title="Next question"
                  >
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  activeTab === 'practice' ? (
                    <button
                      disabled={Object.keys(practiceAnswers).length < questions.length}
                      onClick={submitPracticeQuiz}
                      className="btn-success"
                      style={{ padding: '8px 16px', display: 'flex', gap: 6, alignItems: 'center' }}
                    >
                      <Award size={14} />
                      <span>Submit Quiz</span>
                    </button>
                  ) : (
                    <button
                      disabled={true}
                      className="carousel-arrow-btn"
                    >
                      <ArrowRight size={16} />
                    </button>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* MAC-STYLE FLOATING ACTIONS DOCK AT SCREEN BOTTOM */}
      {step === 3 && (
        <motion.div 
          initial={{ y: 80, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          className="floating-dock"
        >
          <button 
            onClick={() => {
              setActiveTab('review');
              setIsFlipped(false);
              addLog(`Switched view to Tutor Review deck.`, 'info');
            }}
            className={`dock-btn ${activeTab === 'review' ? 'active' : ''}`}
            title="Review Array card deck"
          >
            <BookOpenCheck size={14} />
            <span>Review</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('practice');
              setIsFlipped(false);
              addLog(`Switched view to Practice Simulator.`, 'info');
            }}
            className={`dock-btn ${activeTab === 'practice' ? 'active' : ''}`}
            title="Simulate student run"
          >
            <Play size={14} />
            <span>Practice</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('json');
              setIsFlipped(false);
              addLog(`Switched view to Raw JSON stream.`, 'info');
            }}
            className={`dock-btn ${activeTab === 'json' ? 'active' : ''}`}
            title="View code array"
          >
            <FileCode size={14} />
            <span>JSON</span>
          </button>

          <div className="dock-separator" />

          <button 
            onClick={downloadJson} 
            className="dock-btn" 
            title="Download JSON file"
          >
            <Download size={14} />
          </button>

          <button 
            onClick={copyToClipboard} 
            className="dock-btn" 
            title={copied ? 'Copied to clipboard' : 'Copy JSON'}
          >
            {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Clipboard size={14} />}
          </button>

          <div className="dock-separator" />

          <button 
            onClick={ejectFile} 
            className="dock-btn" 
            style={{ color: 'var(--accent-rose)' }} 
            title="Eject PDF / New Quiz"
          >
            <X size={14} />
            <span>New</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default App;
