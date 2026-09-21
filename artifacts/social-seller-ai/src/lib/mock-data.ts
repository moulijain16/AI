export type Session = {
  id: string;
  day: number;
  title: string;
  label: string;
  duration: string;
  description: string;
  takeaway: string;
  resources: string[];
  transcript: string[];
};

export type Assignment = {
  id: string;
  day: number;
  title: string;
  prompt: string;
  hint: string;
  deliverable: string;
};

export const sessions: Session[] = [
  {
    id: 'signal-over-noise',
    day: 1,
    title: 'Signal over noise',
    label: 'The AI opportunity map',
    duration: '18 min',
    description: 'Find the useful edge between what you already know and what the market is beginning to need.',
    takeaway: 'A one-sentence business thesis you can test this week.',
    resources: ['Opportunity map worksheet', 'The signal audit'],
    transcript: ['The best AI businesses do not start with a tool. They start with a person who already has context.', 'Today we are separating signal from noise, then turning that signal into a small, testable promise.', 'Your job is not to know every model. Your job is to notice where work is still unnecessarily slow.'],
  },
  {
    id: 'your-unfair-context',
    day: 2,
    title: 'Your unfair context',
    label: 'Positioning for the AI era',
    duration: '22 min',
    description: 'Turn your lived experience, taste and pattern recognition into a sharp point of view.',
    takeaway: 'Three buyer problems only you can explain clearly.',
    resources: ['Context inventory', 'Positioning prompts'],
    transcript: ['Context compounds. A tool can be copied; your earned understanding cannot.', 'We will map the rooms you have been in and the recurring friction you have seen there.', 'A clear point of view is a shortcut for the right people to recognize themselves.'],
  },
  {
    id: 'build-the-first-offer',
    day: 3,
    title: 'Build the first offer',
    label: 'From expertise to an asset',
    duration: '25 min',
    description: 'Package one transformation without hiding behind a sprawling curriculum or a long feature list.',
    takeaway: 'A sellable beta offer with a believable outcome.',
    resources: ['Offer canvas', 'Beta pricing notes'],
    transcript: ['An offer is a decision made easy. It tells someone what changes, for whom, and what happens next.', 'Start narrow enough to deliver personally. Scale the system after you learn what works.', 'Proof is not polish. Proof is a clear before and after.'],
  },
  {
    id: 'content-that-converts',
    day: 4,
    title: 'Content that converts',
    label: 'Build your signal system',
    duration: '20 min',
    description: 'Create a repeatable publishing rhythm that teaches in public and invites the right conversations.',
    takeaway: 'A 14-day content system built around one useful idea.',
    resources: ['Signal system board', 'Hook library'],
    transcript: ['Content is not a performance review. It is a trail of useful thinking your future buyers can follow.', 'One sharp observation can become a post, a lesson, an email and a conversation.', 'Consistency becomes easier when the system has somewhere to put the idea.'],
  },
];

export const assignments: Assignment[] = [
  {
    id: 'opportunity-thesis',
    day: 1,
    title: 'Write your opportunity thesis',
    prompt: 'Complete this sentence in one breath: “I help [specific person] use AI to [specific outcome] without [the expensive or frustrating thing they currently tolerate].”',
    hint: 'Avoid “everyone”, “save time” and “leverage AI”. Name the person and the moment of friction.',
    deliverable: 'One clear sentence, plus three lines explaining why you understand this problem.',
  },
  {
    id: 'context-inventory',
    day: 2,
    title: 'Map your unfair context',
    prompt: 'List five situations where you have seen a repeated workflow, question or bottleneck up close. Circle the one you could explain to a stranger with real specificity.',
    hint: 'Look beyond job titles. Communities, hobbies, side projects and family businesses count.',
    deliverable: 'Five observations and a short paragraph on the strongest one.',
  },
  {
    id: 'offer-canvas',
    day: 3,
    title: 'Shape your beta offer',
    prompt: 'Describe the smallest paid experience that gets one kind of person from a frustrating before-state to a visible after-state in 30 days.',
    hint: 'Make the result observable. “Feel more confident” is a feeling; “publish 10 useful posts” is observable.',
    deliverable: 'Offer name, audience, outcome, format and a first beta price.',
  },
];

export const student = {
  name: 'Aarav Mehta',
  initials: 'AM',
  role: 'Founder, Studio North',
  currentDay: 2,
  streak: 4,
  joined: 'September 2024',
};

export const navItems = [
  { label: 'Overview', href: '/app' },
  { label: 'Sessions', href: '/app#sessions' },
  { label: 'Assignments', href: '/app#assignments' },
];