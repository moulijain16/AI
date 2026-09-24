import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type FinalAssessmentResult = {
  score: number;
  attempted: number;
  total: number;
  feedback: string;
};

type LearnerStoreValue = {
  completedSessions: string[];
  videoCompleted: string[];
  videoProgress: Record<string, number>;
  answers: Record<string, string>;
  assessmentAnswers: Record<string, string>;
  scores: Record<string, number>;
  feedback: Record<string, string>;
  uploadedImages: Record<string, string>;
  assignmentScores: Record<string, number>;
  assignmentFeedback: Record<string, string>;
  finalAssessmentResults: Record<string, FinalAssessmentResult>;
  isAuthenticated: boolean;
  userId: string | null;
  signIn: (userId: string) => void;
  completeVideo: (sessionId: string) => void;
  saveVideoProgress: (sessionId: string, seconds: number) => void;
  saveAnswer: (assignmentId: string, answer: string) => void;
  saveAssessmentAnswer: (questionId: string, answer: string) => void;
  submitAssessment: (sessionId: string, score: number) => void;
  markSessionComplete: (sessionId: string) => void;
  requestFeedback: (assignmentId: string) => void;
  saveUploadedImage: (assignmentId: string, image: string) => void;
  submitSessionAssignment: (assignmentId: string, score: number, feedback: string) => void;
  saveFinalAssessmentResult: (sessionId: string, result: FinalAssessmentResult) => void;
};

const LearnerStoreContext = createContext<LearnerStoreValue | null>(null);

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [videoCompleted, setVideoCompleted] = useState<string[]>([]);
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(window.localStorage.getItem('social-seller-video-progress') ?? '{}'); } catch { return {}; }
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [assignmentScores, setAssignmentScores] = useState<Record<string, number>>({});
  const [assignmentFeedback, setAssignmentFeedback] = useState<Record<string, string>>({});
  const [finalAssessmentResults, setFinalAssessmentResults] = useState<Record<string, FinalAssessmentResult>>({});
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('social-seller-user-id');
  });
  const isAuthenticated = Boolean(userId);
  const value = useMemo<LearnerStoreValue>(() => ({
    completedSessions, videoCompleted, videoProgress, answers, assessmentAnswers, scores, feedback, uploadedImages, assignmentScores, assignmentFeedback, finalAssessmentResults, isAuthenticated, userId,
    signIn: (nextUserId) => {
      setUserId(nextUserId);
      window.localStorage.setItem('social-seller-user-id', nextUserId);
    },
    completeVideo: (sessionId) => setVideoCompleted((current) => current.includes(sessionId) ? current : [...current, sessionId]),
    saveVideoProgress: (sessionId, seconds) => setVideoProgress((current) => {
      const next = { ...current, [sessionId]: seconds };
      window.localStorage.setItem('social-seller-video-progress', JSON.stringify(next));
      return next;
    }),
    saveAnswer: (assignmentId, answer) => setAnswers((current) => ({ ...current, [assignmentId]: answer })),
    saveAssessmentAnswer: (questionId, answer) => setAssessmentAnswers((current) => ({ ...current, [questionId]: answer })),
    submitAssessment: (sessionId, score) => {
      setScores((current) => ({ ...current, [sessionId]: score }));
      setFeedback((current) => ({ ...current, [sessionId]: score >= 80 ? 'Strong read. You identified the principle and can now apply it to a live workflow.' : 'Good first pass. Revisit the session notes, then test the principle on one real project this week.' }));
      setCompletedSessions((current) => current.includes(sessionId) ? current : [...current, sessionId]);
    },
    markSessionComplete: (sessionId) => setCompletedSessions((current) => current.includes(sessionId) ? current : [...current, sessionId]),
    requestFeedback: (assignmentId) => setFeedback((current) => ({ ...current, [assignmentId]: 'Useful direction. Make the outcome observable and add one constraint that will help you know whether the idea worked.' })),
    saveUploadedImage: (assignmentId, image) => setUploadedImages((current) => ({ ...current, [assignmentId]: image })),
    submitSessionAssignment: (assignmentId, score, assignmentFeedbackText) => {
      setAssignmentScores((current) => ({ ...current, [assignmentId]: score }));
      setAssignmentFeedback((current) => ({ ...current, [assignmentId]: assignmentFeedbackText }));
    },
    saveFinalAssessmentResult: (sessionId, result) => setFinalAssessmentResults((current) => ({ ...current, [sessionId]: result })),
  }), [answers, assessmentAnswers, assignmentFeedback, assignmentScores, completedSessions, feedback, finalAssessmentResults, scores, uploadedImages, userId, videoCompleted, videoProgress]);
  return <LearnerStoreContext.Provider value={value}>{children}</LearnerStoreContext.Provider>;
}

export function useLearnerStore() {
  const store = useContext(LearnerStoreContext);
  if (!store) throw new Error('useLearnerStore must be used inside LearnerProvider');
  return store;
}