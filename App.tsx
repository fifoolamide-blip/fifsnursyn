import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PaperType, UserProgress, Question, PaperSession } from './types';
import { getPaperQuestionsPool, shuffleArray } from './questions';
import { PAPER_TIME_SECONDS, Icons } from './constants';
import QuestionCard from './components/QuestionCard';
import Timer from './components/Timer';
import Watermark from './components/Watermark';

const STORAGE_KEY = 'fifs_nursyn_v6_session';

const AUTHORIZED_CODES = [
  '246811', 
  '909912', 
  '812311', 
  '657832'
];

const INITIAL_STATE: UserProgress = {
  userEmail: null,
  lastActiveEmail: null,
  viewingPaper: null,
  sessions: {}
};

const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { 
            ...INITIAL_STATE, 
            ...parsed, 
            userEmail: null, 
            viewingPaper: null 
          };
        }
      }
    } catch (e) {
      console.error("Session load error:", e);
    }
    return INITIAL_STATE;
  });

  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const isInitialMount = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setProgress(prev => {
          if (prev.userEmail === null) return prev;
          return { ...prev, userEmail: null, viewingPaper: null };
        });
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const { userEmail, ...stateToSave } = progress;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ...stateToSave, 
      userEmail: null,
      lastActiveEmail: progress.lastActiveEmail || userEmail
    }));
  }, [progress]);

  const validateEmail = (email: string) => {
    return String(email).toLowerCase().trim().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setCodeError('');

    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedCode = codeInput.trim();

    if (!validateEmail(trimmedEmail)) {
      setEmailError('Invalid email address');
      return;
    }

    if (!AUTHORIZED_CODES.includes(trimmedCode)) {
      setCodeError('Invalid access code');
      return;
    }

    if (progress.lastActiveEmail && progress.lastActiveEmail !== trimmedEmail) {
      if (window.confirm(`Existing progress found for ${progress.lastActiveEmail}. Log in as ${trimmedEmail} and clear previous session?`)) {
        setProgress({ ...INITIAL_STATE, userEmail: trimmedEmail, lastActiveEmail: trimmedEmail });
      }
      return;
    }

    setProgress(prev => ({
      ...prev,
      userEmail: trimmedEmail,
      lastActiveEmail: trimmedEmail
    }));
  };

  const handleLogout = () => {
    if (window.confirm("Lock session? Your progress will be saved but requires re-entry.")) {
      setProgress(prev => ({ ...prev, userEmail: null, viewingPaper: null }));
    }
  };

  const resumePaper = (paper: PaperType) => {
    setProgress(prev => ({ ...prev, viewingPaper: paper }));
    window.scrollTo(0, 0);
  };

  const startPaper = (paper: PaperType) => {
    const pool = getPaperQuestionsPool(paper);
    if (pool.length === 0) {
      alert(`${paper} is currently empty. Please add questions first.`);
      return;
    }
    const qSet = shuffleArray(pool);
    
    setProgress(prev => ({
      ...prev,
      viewingPaper: paper,
      sessions: {
        ...prev.sessions,
        [paper]: {
          questions: qSet,
          answers: {},
          timeRemaining: PAPER_TIME_SECONDS,
          isCompleted: false
        }
      }
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestart = (paper: PaperType) => {
    if (window.confirm(`Restart ${paper}? This will clear your current score and start a fresh session.`)) {
      // Directly implement restart logic here
      const pool = getPaperQuestionsPool(paper);
      if (pool.length === 0) {
        alert(`${paper} is currently empty. Please add questions first.`);
        return;
      }
      const qSet = shuffleArray(pool);
      
      setProgress(prev => ({
        ...prev,
        viewingPaper: paper,
        sessions: {
          ...prev.sessions,
          [paper]: {
            questions: qSet,
            answers: {},
            timeRemaining: PAPER_TIME_SECONDS,
            isCompleted: false  // This is crucial - reset the completed flag
          }
        }
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAnswer = (questionId: string, answerIdx: number | null) => {
    if (!progress.viewingPaper) return;
    const paper = progress.viewingPaper;

    setProgress(prev => {
      const session = prev.sessions[paper];
      if (!session) return prev;

      const newAnswers = { ...session.answers };
      if (answerIdx === null) delete newAnswers[questionId];
      else newAnswers[questionId] = answerIdx;

      return { 
        ...prev, 
        sessions: {
          ...prev.sessions,
          [paper]: { ...session, answers: newAnswers }
        }
      };
    });
  };

  const finishPaper = useCallback(() => {
    if (!progress.viewingPaper) return;
    const paper = progress.viewingPaper;

    setProgress(prev => {
      const session = prev.sessions[paper];
      if (!session) return prev;

      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [paper]: { ...session, isCompleted: true }
        }
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [progress.viewingPaper]);

  const handleExit = () => {
    setProgress(prev => ({ ...prev, viewingPaper: null }));
    window.scrollTo(0, 0);
  };

  const resetAll = () => {
    if (window.confirm("Permanently delete ALL progress and start over?")) {
      setProgress(INITIAL_STATE);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const resetPaper = (paper: PaperType) => {
    if (window.confirm(`Permanently reset all progress for ${paper}?`)) {
      setProgress(prev => {
        const newSessions = { ...prev.sessions };
        delete newSessions[paper];
        const nextViewingPaper = prev.viewingPaper === paper ? null : prev.viewingPaper;
        return { ...prev, sessions: newSessions, viewingPaper: nextViewingPaper };
      });
    }
  };

  const { viewingPaper, userEmail, sessions } = progress;
  
  const currentSession = viewingPaper ? sessions[viewingPaper] : null;
  const questions = currentSession?.questions || [];
  const answers = currentSession?.answers || {};
  const isCompleted = currentSession?.isCompleted || false;
  const timeRemaining = currentSession?.timeRemaining || PAPER_TIME_SECONDS;
  const score = questions.filter(q => answers[q.id] === q.correctAnswer).length;

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Access Locked</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verify your credentials to continue</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Registered Email</label>
              <input 
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="email@example.com"
                className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 transition-all outline-none font-semibold ${emailError ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'}`}
              />
              {emailError && <p className="mt-2 text-red-500 text-[11px] font-bold uppercase ml-1">{emailError}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Access Code</label>
              <input 
                type="text"
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 transition-all outline-none font-black tracking-[0.5em] text-center ${codeError ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'}`}
              />
              {codeError && <p className="mt-2 text-red-500 text-[11px] font-bold uppercase text-center">{codeError}</p>}
            </div>
            
            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm">
              Verify & Resume
            </button>
          </form>
          {progress.lastActiveEmail && (
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
               <p className="text-center text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                 Session saved for: {progress.lastActiveEmail}
               </p>
            </div>
          )}
        </div>
        <Watermark />
      </div>
    );
  }

  if (!viewingPaper) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-16 px-6 relative">
        <div className="absolute top-8 right-8 flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</p>
            <p className="text-xs font-bold text-slate-600">{userEmail}</p>
          </div>
          <button onClick={handleLogout} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
            Lock App
          </button>
        </div>

        <div className="max-w-4xl w-full text-center space-y-12">
          <div className="space-y-3">
            <h1 className="text-6xl font-black text-blue-700 tracking-tighter">fifsNursynQbank</h1>
            <p className="text-slate-500 text-xl font-medium">Nursing Professional Assessment Pool</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(PaperType).map(paper => {
              const session = sessions[paper];
              const hasProgress = session && !session.isCompleted;
              const isFinished = session && session.isCompleted;
              const progressCount = session ? Object.keys(session.answers).length : 0;
              const totalCount = session ? session.questions.length : 0;

              return (
                <div key={paper} className="flex flex-col space-y-3">
                  <button
                    onClick={() => session ? resumePaper(paper) : startPaper(paper)}
                    className={`group relative p-8 rounded-3xl shadow-sm border transition-all hover:shadow-2xl text-left overflow-hidden h-full flex flex-col justify-between ${
                      hasProgress 
                        ? 'bg-blue-600 border-blue-700 text-white' 
                        : isFinished 
                          ? 'bg-slate-800 border-slate-900 text-white'
                          : 'bg-white border-slate-200 hover:border-blue-500'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <h2 className={`text-2xl font-black ${!session ? 'text-slate-800 group-hover:text-blue-700' : ''}`}>
                          {paper}
                        </h2>
                        {hasProgress && <span className="bg-blue-400 text-blue-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ring-2 ring-white/20">Active</span>}
                        {isFinished && <span className="bg-green-400 text-green-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ring-2 ring-white/20">Done</span>}
                      </div>
                      <p className={`font-bold text-[11px] uppercase tracking-widest leading-relaxed ${session ? 'text-blue-100/70' : 'text-slate-400'}`}>
                        {session ? `Progress: ${progressCount} / ${totalCount} Questions` : 'Assessment Pool • 2 Hours'}
                      </p>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {session ? (isFinished ? 'Review Exam' : 'Continue') : 'Start Exam'}
                      </span>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-inner ${session ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                        {hasProgress ? <Icons.Clock /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>}
                      </div>
                    </div>
                  </button>
                  {session && (
                    <div className="flex justify-end space-x-4 px-2">
                      <button onClick={() => resetPaper(paper)} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline opacity-60 hover:opacity-100 transition-opacity">Reset {paper}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-8 border-t border-slate-200">
            <button onClick={resetAll} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors opacity-40">Clear All Stored Data</button>
          </div>
        </div>
        <Watermark />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={handleExit} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-600 flex items-center">
              <Icons.Back />
              <span className="hidden sm:inline font-bold text-sm ml-1">Exit</span>
            </button>
            <div className="ml-4 pl-4 border-l border-slate-200">
              <h2 className="text-lg font-black text-slate-900 leading-none mb-1">{viewingPaper}</h2>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">{Object.keys(answers).length} of {questions.length} Answered</p>
            </div>
          </div>
          <div className="flex items-center space-x-5">
            {!isCompleted && <Timer initialSeconds={timeRemaining} onTimeUp={finishPaper} onTick={(sec) => setProgress(prev => {
              if (!prev.viewingPaper) return prev;
              const session = prev.sessions[prev.viewingPaper];
              if (!session) return prev;
              return { ...prev, sessions: { ...prev.sessions, [prev.viewingPaper]: { ...session, timeRemaining: sec } } };
            })} />}
            <button onClick={finishPaper} disabled={isCompleted} className={`px-8 py-3 rounded-2xl font-black transition-all uppercase text-sm tracking-widest ${isCompleted ? 'bg-slate-100 text-slate-400 border cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl'}`}>
              {isCompleted ? 'Finished' : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        {isCompleted && (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 p-12 mb-16 text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Results Summary</h2>
            <div className="text-7xl font-black text-blue-700 my-8 tracking-tighter">
              {score} <span className="text-2xl text-slate-300">/ {questions.length}</span>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <button 
                onClick={() => handleRestart(viewingPaper)}  // Removed the non-null assertion, it's already validated
                className="bg-slate-900 text-white px-14 py-5 rounded-2xl font-black hover:bg-black transition-all shadow-2xl uppercase tracking-widest text-sm"
              >
                Restart Examination
              </button>
              <button onClick={handleExit} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:underline">Dashboard</button>
            </div>
          </div>
        )}

        <div className="space-y-10">
          {questions.map((q, idx) => (
            <QuestionCard key={q.id} question={q} index={idx} onAnswer={handleAnswer} savedAnswer={answers[q.id]} isCompleted={isCompleted} />
          ))}
        </div>
      </main>
      <Watermark />
    </div>
  );
};

export default App;