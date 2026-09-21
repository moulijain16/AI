import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type LearnerStoreValue = {
  completedSessions: string[];
  videoCompleted: string[];
  answers: Record<string, string>;
  assessmentAnswers: Record<string, string>;
  scores: Record<string, number>;
  feedback: Record<string, string>;
  completeVideo: (sessionId: string) => void;
  saveAnswer: (assignmentId: string, answer: string) => void;
  saveAssessmentAnswer: (questionId: string, answer: string) => void;
  submitAssessment: (sessionId: string, score: number) => void;
  markSessionComplete: (sessionId: string) => void;
  requestFeedback: (assignmentId: string) => void;
};

const LearnerStoreContext = createContext<LearnerStoreValue | null>(null);

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [videoCompleted, setVideoCompleted] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const value = useMemo<LearnerStoreValue>(() => ({
    completedSessions, videoCompleted, answers, assessmentAnswers, scores, feedback,
    completeVideo: (sessionId) => setVideoCompleted((current) => current.includes(sessionId) ? current : [...current, sessionId]),
    saveAnswer: (assignmentId, answer) => setAnswers((current) => ({ ...current, [assignmentId]: answer })),
    saveAssessmentAnswer: (questionId, answer) => setAssessmentAnswers((current) => ({ ...current, [questionId]: answer })),
    submitAssessment: (sessionId, score) => {
      setScores((current) => ({ ...current, [sessionId]: score }));
      setFeedback((current) => ({ ...current, [sessionId]: score >= 80 ? 'Strong read. You identified the principle and can now apply it to a live workflow.' : 'Good first pass. Revisit the session notes, then test the principle on one real project this week.' }));
      setCompletedSessions((current) => current.includes(sessionId) ? current : [...current, sessionId]);
    },
    markSessionComplete: (sessionId) => setCompletedSessions((current) => current.includes(sessionId) ? current : [...current, sessionId]),
    requestFeedback: (assignmentId) => setFeedback((current) => ({ ...current, [assignmentId]: 'Useful direction. Make the outcome observable and add one constraint that will help you know whether the idea worked.' })),
  }), [answers, assessmentAnswers, completedSessions, feedback, scores, videoCompleted]);
  return <LearnerStoreContext.Provider value={value}>{children}</LearnerStoreContext.Provider>;
}

export function useLearnerStore() {
  const store = useContext(LearnerStoreContext);
  if (!store) throw new Error('useLearnerStore must be used inside LearnerProvider');
  return store;
}