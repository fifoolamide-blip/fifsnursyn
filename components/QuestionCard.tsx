
import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { Icons } from '../constants';

interface QuestionCardProps {
  question: Question;
  index: number;
  onAnswer: (questionId: string, answerIdx: number | null) => void;
  savedAnswer?: number;
  isCompleted: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, onAnswer, savedAnswer, isCompleted }) => {
  const [selected, setSelected] = useState<number | undefined>(savedAnswer);

  // Sync internal state with props (important for persistence)
  useEffect(() => {
    setSelected(savedAnswer);
  }, [savedAnswer]);

  const isCorrect = selected === question.correctAnswer;
  const hasSelected = selected !== undefined;
  const showFeedback = hasSelected; // In this app, feedback is shown immediately upon selection

  const handleSelect = (idx: number) => {
    if (isCompleted || hasSelected) return;
    setSelected(idx);
    onAnswer(question.id, idx);
  };

  const getOptionLabel = (idx: number) => String.fromCharCode(65 + idx);

  return (
    <div id={`question-${question.id}`} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-8 transition-all hover:shadow-lg group">
      <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h3 className="text-blue-500 font-black text-sm mb-2 uppercase tracking-widest">Question {index + 1}</h3>
          <p className="text-xl font-bold text-slate-800 leading-relaxed">{question.text}</p>
        </div>
        {hasSelected && !isCompleted && (
          <div className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full border border-blue-200 shadow-sm animate-in fade-in zoom-in duration-300">
            <span className="text-[10px] font-black uppercase tracking-widest">Locked</span>
            <Icons.Check />
          </div>
        )}
      </div>
      
      <div className="p-8 space-y-4">
        {question.options.map((option, idx) => {
          const isUserSelected = selected === idx;
          const isCorrectAnswer = idx === question.correctAnswer;
          
          let colorClass = "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100";
          
          if (showFeedback || isCompleted) {
            if (isCorrectAnswer) {
              colorClass = "bg-green-50 border-green-500 text-green-700 ring-2 ring-green-100";
            } else if (isUserSelected) {
              colorClass = "bg-red-50 border-red-500 text-red-700 ring-2 ring-red-100";
            } else {
              colorClass = "bg-white border-slate-100 opacity-40 grayscale-[0.8]";
            }
          } else if (isUserSelected) {
            colorClass = "bg-blue-50 border-blue-600 ring-2 ring-blue-100 text-blue-900";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isCompleted || hasSelected}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-start group relative ${colorClass} ${hasSelected ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border-2 text-base font-black mr-4 transition-colors ${isUserSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-blue-100 group-hover:border-blue-300 group-hover:text-blue-600'}`}>
                {getOptionLabel(idx)}
              </span>
              <span className="pt-2 font-semibold text-lg">{option}</span>
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className={`p-8 border-t animate-in fade-in slide-in-from-bottom-4 duration-500 ${isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
          <div className="flex items-start">
            <div className="mr-4 mt-1">
              {isCorrect ? <Icons.Check /> : <Icons.X />}
            </div>
            <div className="flex-1">
              <p className={`font-black text-sm uppercase tracking-widest mb-3 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? 'Accurate Answer' : `The Correct Answer is ${getOptionLabel(question.correctAnswer)}`}
              </p>
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-inner">
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Rationale</p>
                <p className="text-slate-700 text-base leading-relaxed italic">
                  {question.rationale}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
