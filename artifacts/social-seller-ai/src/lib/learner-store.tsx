import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type LearnerStoreValue = {
  completedSessions: string[];
  answers: Record<string, string>;
  feedback: Record<string, string>;
  markSessionComplete: (sessionId: string) => void;
  saveAnswer: (assignmentId: string, answer: string) => void;
  requestFeedback: (assignmentId: string) => void;
};

const LearnerStoreContext = createContext<LearnerStoreValue | null>(null);

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [completedSessions, setCompletedSessions] = useState<string[]>(['signal-over-noise']);
  const [answers, setAnswers] = useState<Record<string, string>>({
    'opportunity-thesis': 'I help independent consultants turn their repeated client questions into small, useful AI workflows without becoming full-time content creators.',
  });
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const value = useMemo<LearnerStoreValue>(() => ({
    completedSessions,
    answers,
    feedback,
    markSessionComplete: (sessionId) => setCompletedSessions((current) => current.includes(sessionId) ? current : [...current, sessionId]),
    saveAnswer: (assignmentId, answer) => setAnswers((current) => ({ ...current, [assignmentId]: answer })),
    requestFeedback: (assignmentId) => setFeedback((current) => ({
      ...current,
      [assignmentId]: 'Strong starting point. Your audience and action are clear. Make the outcome more observable by naming the first artifact they will produce, then your promise will be easier to trust.',
    })),
  }), [answers, completedSessions, feedback]);

  return <LearnerStoreContext.Provider value={value}>{children}</LearnerStoreContext.Provider>;
}

export function useLearnerStore() {
  const store = useContext(LearnerStoreContext);
  if (!store) throw new Error('useLearnerStore must be used inside LearnerProvider');
  return store;
}