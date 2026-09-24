import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDownRight, ArrowLeft, ArrowRight, BarChart3, Bell, BookOpen, Check, CheckCircle2, ChevronRight, Clock3, FileText, LayoutDashboard, LockKeyhole, Menu, MessageSquare, Play, Plus, Search, Settings, Sparkles, Target, Users, X, Zap } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { BrandMark } from '@/components/brand-mark';
import { assignments, navItems, sessionAssessments, sessions, student, type Session } from '@/lib/mock-data';
import { LearnerProvider, useLearnerStore } from '@/lib/learner-store';

const queryClient = new QueryClient();

type YouTubePlayer = { getCurrentTime: () => number; seekTo: (seconds: number, allowSeekAhead: boolean) => void; destroy: () => void };
type YouTubeApi = { Player: new (element: HTMLElement, options: { videoId: string; playerVars: Record<string, number>; events: { onReady: (event: { target: YouTubePlayer }) => void; onStateChange: (event: { data: number; target: YouTubePlayer }) => void } }) => YouTubePlayer };

declare global {
  interface Window { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void; }
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => { image.src = String(reader.result); };
    image.onerror = () => reject(new Error('That image could not be processed.'));
    image.onload = () => {
      const maxDimension = 2200;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      const encode = () => {
        const result = canvas.toDataURL('image/jpeg', quality);
        if (result.length <= 2 * 1024 * 1024 || quality <= 0.5) { resolve(result); return; }
        quality -= 0.08;
        encode();
      };
      encode();
    };
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl: string): Promise<string> {
  return fetch(dataUrl).then((response) => response.blob()).then((blob) => compressImage(new File([blob], 'assessment-image', { type: blob.type })));
}

function PageMeta({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    document.title = `${title} — Social Seller AI`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', 'description'); document.head.appendChild(tag); }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
  return null;
}

function Button({ children, variant = 'primary', className = '', ...props }: { children: ReactNode; variant?: 'primary' | 'ghost' | 'outline' | 'accent'; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:brightness-105',
    ghost: 'bg-transparent text-foreground hover:bg-muted',
    outline: 'border border-border bg-card text-foreground hover:border-primary/60',
    accent: 'bg-accent text-accent-foreground hover:brightness-105',
  };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function PublicNav() {
  const [open, setOpen] = useState(false);
  return <header className="absolute left-0 right-0 top-0 z-20">
    <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 lg:px-8">
      <Link href="/" data-testid="link-brand-home"><BrandMark /></Link>
      <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
        <a href="#curriculum" className="text-sm text-foreground/60 transition-colors hover:text-primary" data-testid="link-curriculum">Curriculum</a>
        <a href="#method" className="text-sm text-foreground/60 transition-colors hover:text-primary" data-testid="link-method">How it works</a>
        <Link href="/login" className="text-sm text-foreground/60 transition-colors hover:text-primary" data-testid="link-login">Sign in</Link>
        <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-start-learning">Start learning <ArrowRight size={15} /></Link>
      </nav>
      <button className="grid size-10 place-items-center rounded-lg border border-border md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" data-testid="button-toggle-menu">{open ? <X size={19} /> : <Menu size={19} />}</button>
    </div>
    {open && <div className="mx-5 rounded-xl border border-border bg-card p-4 shadow-lg md:hidden"><div className="grid gap-1">
      <a href="#curriculum" onClick={() => setOpen(false)} className="p-3 text-sm" data-testid="link-mobile-curriculum">Curriculum</a>
      <a href="#method" onClick={() => setOpen(false)} className="p-3 text-sm" data-testid="link-mobile-method">How it works</a>
      <Link href="/login" onClick={() => setOpen(false)} className="p-3 text-sm" data-testid="link-mobile-login">Sign in</Link>
      <Link href="/signup" onClick={() => setOpen(false)} className="rounded-lg bg-primary p-3 text-sm font-bold text-primary-foreground" data-testid="link-mobile-start">Start learning</Link>
    </div></div>}
  </header>;
}

function OrbitArtwork() {
  return <div className="relative min-h-[370px] overflow-hidden rounded-2xl border border-primary/20 bg-[#10182b] p-6 shadow-2xl shadow-primary/10 sm:min-h-[510px]">
    <div className="absolute inset-0 aurora opacity-90" />
    <div className="absolute left-1/2 top-1/2 size-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 sm:size-[390px]" />
    <div className="absolute left-1/2 top-1/2 size-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary/40 sm:size-[270px]" />
    <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-primary/20 shadow-[0_0_80px_rgba(71,220,255,.32)] backdrop-blur-sm sm:size-28" />
    <div className="absolute left-[18%] top-[29%] size-3 rounded-full bg-primary shadow-[0_0_22px_rgba(71,220,255,.9)]" />
    <div className="absolute right-[17%] top-[23%] size-2 rounded-full bg-accent shadow-[0_0_22px_rgba(255,188,92,.9)]" />
    <div className="absolute bottom-[24%] right-[27%] size-3 rounded-full bg-secondary shadow-[0_0_22px_rgba(177,103,255,.9)]" />
    <div className="relative flex h-full min-h-[320px] flex-col justify-between sm:min-h-[460px]">
      <div className="flex items-center justify-between font-mono-ui text-[9px] uppercase tracking-[.2em] text-foreground/55"><span>AI / MASTERMIND</span><span>01 — 08</span></div>
      <div className="mx-auto text-center"><div className="mx-auto grid size-16 place-items-center rounded-2xl border border-primary/45 bg-background/30 text-primary sm:size-20"><Zap size={28} /></div><p className="mt-4 font-mono-ui text-[9px] uppercase tracking-[.22em] text-foreground/50">Build intelligence</p><p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Make the next<br /><span className="text-primary">useful thing.</span></p></div>
      <div className="flex items-end justify-between"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-foreground/45">30-day protocol</p><p className="mt-2 text-sm text-foreground/70">Learn → apply → ship</p></div><span className="grid size-11 place-items-center rounded-full border border-primary/40 text-primary"><ArrowDownRight size={19} /></span></div>
    </div>
  </div>;
}

const socialSellerSections = [
  { eyebrow: '01 / Growth', title: 'Growth that compounds.', copy: 'A closer look at the momentum created when practical learning meets a community that keeps showing up.', images: ['revenue1-WhgolYd4.webp', 'revenue2-CySVFtXI.webp'], folder: 'growth', tone: 'primary', contained: false },
  { eyebrow: '02 / Reviews', title: 'Real words from real learners.', copy: 'The work matters most when it changes what people do next. Here is what the Social Seller community says about that shift.', images: ['wa1-WQhAH3R1.webp', 'wa2-CWCb8sQq.webp', 'wa3-DHnA4XJB.webp', 'wa4-oSkCMTeY.webp'], folder: 'reviews', tone: 'secondary', contained: true },
  { eyebrow: '03 / Offline Meetups', title: 'The internet, in person.', copy: 'Ideas get sharper in the room. Our offline meetups turn online connection into conversations, collaborations, and new starts.', images: ['off1-C5JLVvWy.webp', 'off2-Dqj4s-iv.webp', 'off3-rLm6QGTH.webp', 'off4-CswFqZs6.webp'], folder: 'meetups', tone: 'accent', contained: false },
  { eyebrow: '04 / Offline Workshops & Trainings', title: 'Learning that leaves the screen.', copy: 'Focused workshops, shared practice, and hands-on training built for people ready to put new skills to work.', images: ['stu1-j3vEZnad.webp', 'stu2-1cEJcTFs.webp', 'stu3-CKnzi7w_.webp'], folder: 'workshops', tone: 'primary', contained: false },
  { eyebrow: '05 / Awards', title: 'Recognition for useful work.', copy: 'A moment to celebrate the people and ideas helping shape a more capable digital future.', images: ['cmawardm-BNVMzKlu.webp'], folder: 'awards', tone: 'accent', contained: false },
  { eyebrow: '06 / Achievements & Awards', title: 'Milestones worth sharing.', copy: 'Every achievement carries a story of consistency, courage, and a willingness to keep learning out loud.', images: ['ai1-DIC_R4-J.webp', 'ai2-DOEvrAzQ.webp', 'ai3-BHys9TU2.webp', 'ai4-ClQq-Bjg.webp', 'ai9-Blc4gs4G.webp'], folder: 'achievements', tone: 'secondary', contained: false },
  { eyebrow: '07 / Sharing Stage', title: 'Make room for your voice.', copy: 'From first talk to full room, the stage is where experience becomes an invitation for someone else to begin.', images: ['2ritesh-BsLw9cO3.webp', '3vaibhav-DfLahuHt.webp', '4ishan-BmjQ_SE0.webp', '8rj-CH4EyxMd.webp'], folder: 'stage', tone: 'primary', contained: false },
  { eyebrow: '08 / Media Reviews', title: 'The conversation travels.', copy: 'Our work has found its way into the wider conversation about creators, commerce, and the future of learning.', images: ['news1-BfCxKb0l.webp', 'news2-CMXFWzAl.webp', 'news3-CLYE_rJg.webp'], folder: 'media', tone: 'accent', contained: true },
  { eyebrow: '09 / Meet Our Team', title: 'People make the platform.', copy: 'A small, curious team building the systems, spaces, and support that help ambitious people move forward.', images: ['team1-xYBk_ZLO.webp', 'team2-DlukPSr0.webp'], folder: 'meet-our-team', tone: 'secondary', contained: false },
] as const;

type SocialSellerSection = (typeof socialSellerSections)[number];

function StorySection({ section, index }: { section: SocialSellerSection; index: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const toneClass = section.tone === 'secondary' ? 'text-secondary' : section.tone === 'accent' ? 'text-accent' : 'text-primary';

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('is-visible');
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <section ref={sectionRef} className="scroll-reveal border-t border-border/80">
    <div className="mx-auto max-w-[1240px] px-5 py-20 sm:py-28 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className={`font-mono-ui text-[10px] uppercase tracking-[.2em] ${toneClass}`}>{section.eyebrow}</p>
          <h2 className="mt-5 max-w-md text-5xl font-bold leading-[.94] tracking-[-.06em] sm:text-6xl">{section.title}</h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">{section.copy}</p>
          <span className={`mt-8 block font-mono-ui text-[10px] uppercase tracking-[.2em] ${toneClass}`}>0{index + 1} <span className="text-muted-foreground/40">/ 09</span></span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {section.images.map((image, imageIndex) => <figure key={image} className={`group relative overflow-hidden rounded-xl border border-border bg-card ${section.images.length === 1 ? 'mx-auto w-full max-w-2xl' : ''} ${section.images.length === 3 && imageIndex === 0 ? 'sm:row-span-2' : ''}`}>
            <img src={`/images/social-seller/${section.folder}/${image}`} alt={`${section.eyebrow.replace(/^\d+ \/ /, '')} ${imageIndex + 1}`} className={`h-full w-full transition duration-700 ease-out group-hover:scale-[1.025] ${section.contained ? 'object-contain bg-white p-2' : 'object-cover'} ${section.images.length === 1 ? 'max-h-[560px]' : 'min-h-[220px]'}`} loading="lazy" />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </figure>)}
        </div>
      </div>
    </div>
  </section>;
}

function SocialSellerSections() {
  return <div className="social-proof-sections bg-background/80">{socialSellerSections.map((section, index) => <StorySection key={section.eyebrow} section={section} index={index} />)}</div>;
}

function MastermindVisual() {
  return <section className="mastermind-visual mx-auto max-w-[1240px] px-5 py-20 sm:py-28 lg:px-8"><div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-[#17120d] px-7 py-12 text-white shadow-2xl shadow-accent/10 sm:px-12 lg:px-16"><div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(255,173,45,.28),transparent_30%),radial-gradient(circle_at_20%_90%,rgba(109,63,18,.5),transparent_38%)]" /><div className="relative max-w-2xl"><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">30-day AI mastermind</p><h2 className="mt-5 text-5xl font-black uppercase leading-[.86] tracking-[-.06em] sm:text-7xl">Practical skills.<br /><span className="text-accent">Real implementation.</span><br />Real growth.</h2><p className="mt-7 max-w-lg text-sm leading-7 text-white/70">Learn the systems, tools, and workflows to turn AI into useful momentum.</p><Link href="/programme" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3.5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-1" data-testid="link-bottom-start">START MY SESSION <ArrowRight size={16} /></Link></div><div className="relative mt-12 grid max-w-xl grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-white/70 sm:grid-cols-4"><span className="border-l-2 border-accent pl-3">8 live sessions</span><span className="border-l-2 border-accent pl-3">20+ AI tools</span><span className="border-l-2 border-accent pl-3">Hands-on training</span><span className="border-l-2 border-accent pl-3">Dedicated support</span></div></div></section>;
}

function Programme() {
  return <div className="grain min-h-[100dvh] bg-background"><PageMeta title="30-Day AI Mastermind Programme" description="Explore the eight sessions in the 30-Day AI Mastermind Programme." /><PublicNav /><main className="mx-auto max-w-[1240px] px-5 pb-24 pt-36 lg:px-8 lg:pt-44"><div className="mx-auto max-w-3xl text-center reveal"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">30-day AI mastermind programme</p><h1 className="mt-5 text-5xl font-bold leading-[.94] tracking-[-.06em] sm:text-7xl">Build practical AI skills<br /><span className="text-primary">one session at a time.</span></h1><p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground">Eight focused sessions with clear outcomes, practical assignments, and a learning path built to help you move from idea to implementation.</p></div><div className="mt-14 grid gap-4 md:grid-cols-2">{sessions.map((session) => <Link key={session.id} href={`/app/sessions/${session.id}`} className="group flex gap-5 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg" data-testid={`programme-session-${session.id}`}><span className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted font-mono-ui text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">0{session.day}</span><span className="min-w-0"><span className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Session {session.day}</span><ArrowRight size={16} className="shrink-0 text-primary transition-transform group-hover:translate-x-1" /></span><h2 className="mt-2 text-xl font-bold tracking-[-.03em]">{session.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{session.description}</p><span className="mt-4 inline-block text-xs font-bold text-primary">View description, learning outcomes & assessment</span></span></Link>)}</div></main><footer className="mx-auto flex max-w-[1240px] flex-col gap-4 border-t border-border px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><BrandMark compact /><p>© 2024 Social Seller AI. Built for useful momentum.</p></footer></div>;
}

function Home() {
  return <div className="grain min-h-[100dvh] bg-background">
    <PageMeta title="Build with AI, on purpose" description="The 30-Day AI Mastermind Programme for creators and founders." />
    <PublicNav />
    <main>
      <section className="shell-grid relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 pb-20 pt-36 sm:pb-28 lg:grid-cols-[.98fr_1.02fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-32 lg:pt-44">
          <div className="reveal">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-3 py-2 font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary"><span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" /> 30-day AI mastermind</div>
            <h1 className="max-w-[700px] text-balance text-6xl font-bold leading-[.93] tracking-[-.065em] sm:text-8xl lg:text-[7rem]">Build what<br /><span className="signal-line">AI makes</span><br />possible.</h1>
            <p className="mt-8 max-w-[480px] text-base leading-7 text-muted-foreground sm:text-lg">A practical course for creators and founders who want to turn AI from a spectacle into a working advantage.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3"><Link href="/programme" className="inline-flex items-center gap-3 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-1" data-testid="link-hero-programme">Start the session <ArrowRight size={16} /></Link></div>
            <div className="mt-12 flex items-center gap-4 border-t border-border pt-5"><div className="flex -space-x-2">{['AS', 'PN', 'RK'].map((initials) => <span key={initials} className="grid size-8 place-items-center rounded-full border-2 border-background bg-muted font-mono-ui text-[9px]">{initials}</span>)}</div><p className="text-xs leading-5 text-muted-foreground"><strong className="font-semibold text-foreground">One focused room</strong><br />for learning in public</p></div>
          </div>
          <div className="reveal reveal-delay-2"><OrbitArtwork /></div>
        </div>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-3 border-t border-border px-5 py-5 font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground lg:px-8"><span>8 focused sessions</span><span className="text-primary">/</span><span>Video + practice</span><span className="text-secondary">/</span><span>AI feedback loops</span><span className="text-accent">/</span><span>One useful business</span></div>
      </section>
      <section id="method" className="mx-auto max-w-[1240px] px-5 py-20 sm:py-28 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">01 / The operating system</p><h2 className="mt-5 max-w-md text-5xl font-bold leading-[.95] tracking-[-.06em] sm:text-6xl">Less noise.<br /><span className="text-secondary">More output.</span></h2><p className="mt-6 max-w-sm leading-7 text-muted-foreground">Every session ends with a useful artifact. You do not just learn what is possible — you leave with something that works.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">{[{ icon: <Target size={19} />, title: 'Clear direction', copy: 'Know which AI move belongs to the problem in front of you.' }, { icon: <MessageSquare size={19} />, title: 'Practice in context', copy: 'Short lessons become prompts, systems, pages, and experiments.' }, { icon: <BookOpen size={19} />, title: 'A complete path', copy: 'Eight connected sessions take you from first brief to final pitch.' }, { icon: <Users size={19} />, title: 'Feedback that moves', copy: 'Use assessment and AI feedback to decide what to improve next.' }].map((item) => <div key={item.title} className="glass-panel rounded-xl p-6 transition-transform hover:-translate-y-1"><div className="text-primary">{item.icon}</div><h3 className="mt-12 text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p></div>)}</div>
        </div>
      </section>
      <section id="curriculum" className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8"><div className="flex flex-wrap items-center justify-between gap-5 border-y border-border py-6"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-secondary">02 / The programme</p><p className="mt-2 text-sm text-muted-foreground">Explore the 30-day AI Mastermind sessions.</p></div><Link href="/programme" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-foreground" data-testid="link-view-programme">View programme <ArrowRight size={16} /></Link></div></section>
      <section className="mx-auto max-w-[1240px] px-5 py-20 sm:py-28 lg:px-8"><div className="rounded-2xl border border-primary/20 bg-[#10182b] p-7 sm:p-12 lg:grid lg:grid-cols-[1fr_.8fr] lg:items-center lg:gap-20"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">03 / Made for momentum</p><h2 className="mt-5 max-w-xl text-5xl font-bold leading-[.94] tracking-[-.06em] sm:text-6xl">A course you can<br /><span className="text-accent">actually finish.</span></h2><p className="mt-6 max-w-md leading-7 text-foreground/65">Watch a focused lesson, complete the assessment, see your feedback, and know exactly where to go next. The platform keeps the path visible.</p><Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3.5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-1" data-testid="link-bottom-start">Start your first session <ArrowRight size={16} /></Link></div><div className="mt-10 grid gap-3 lg:mt-0"><div className="flex items-center gap-4 rounded-xl border border-border bg-background/50 p-4"><span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary"><Play size={17} /></span><div><p className="text-sm font-bold">Watch</p><p className="text-xs text-muted-foreground">Focused video lessons</p></div><Check size={16} className="ml-auto text-primary" /></div><div className="flex items-center gap-4 rounded-xl border border-border bg-background/50 p-4"><span className="grid size-10 place-items-center rounded-lg bg-secondary/15 text-secondary"><Sparkles size={17} /></span><div><p className="text-sm font-bold">Apply</p><p className="text-xs text-muted-foreground">Session-specific assessment</p></div><Check size={16} className="ml-auto text-secondary" /></div><div className="flex items-center gap-4 rounded-xl border border-border bg-background/50 p-4"><span className="grid size-10 place-items-center rounded-lg bg-accent/15 text-accent"><ArrowRight size={17} /></span><div><p className="text-sm font-bold">Move forward</p><p className="text-xs text-muted-foreground">Feedback and next session</p></div><Check size={16} className="ml-auto text-accent" /></div></div></div></section>
      <MastermindVisual />
      <SocialSellerSections />
    </main>
    <footer className="mx-auto flex max-w-[1240px] flex-col gap-4 border-t border-border px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><BrandMark compact /><p>© 2024 Social Seller AI. Built for useful momentum.</p></footer>
  </div>;
}

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const [, setLocation] = useLocation();
  const { signIn } = useLearnerStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isSignup = mode === 'signup';
  const submit = (event: React.FormEvent) => { event.preventDefault(); signIn(email.trim().toLowerCase()); setLocation('/app'); };
  return <div className="grain grid min-h-[100dvh] bg-background lg:grid-cols-[.85fr_1.15fr]"><PageMeta title={isSignup ? 'Join the programme' : 'Sign in'} />
    <div className="relative hidden overflow-hidden bg-[#10182b] p-10 text-foreground lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 aurora" /><div className="relative"><Link href="/" data-testid="link-auth-brand"><BrandMark /></Link></div><div className="relative"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">The 30-day AI mastermind</p><h1 className="mt-5 max-w-lg text-7xl font-bold leading-[.88] tracking-[-.065em]">Build a<br /><span className="text-primary">sharper</span><br />future.</h1><p className="mt-7 max-w-sm text-sm leading-6 text-foreground/60">A focused learning room for creators and founders building with AI.</p></div><p className="relative font-mono-ui text-[10px] uppercase tracking-[.15em] text-foreground/35">Watch / Apply / Ship</p></div>
    <div className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-[430px]"><Link href="/" className="mb-16 inline-block lg:hidden" data-testid="link-mobile-auth-brand"><BrandMark /></Link><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">{isSignup ? 'Start your studio pass' : 'Welcome back'}</p><h1 className="mt-4 text-4xl font-bold tracking-[-.05em]">{isSignup ? 'Make the first move.' : 'Pick up where you left off.'}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{isSignup ? 'Create your learner profile and enter session one.' : 'Your sessions, answers, and next move are waiting.'}</p><form onSubmit={submit} className="mt-9 space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold">Email address</span><input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@studio.com" className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary" data-testid="input-auth-email" /></label><label className="block"><span className="mb-2 block text-xs font-bold">Password</span><input required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Six characters or more" className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary" data-testid="input-auth-password" /></label><Button type="submit" className="w-full py-3.5" data-testid="button-auth-submit">{isSignup ? 'Create learner profile' : 'Sign in to your studio'} <ArrowRight size={16} /></Button></form><div className="mt-7 flex items-center gap-3 text-xs text-muted-foreground"><LockKeyhole size={14} /> Your learning data stays private.</div><p className="mt-10 text-sm text-muted-foreground">{isSignup ? 'Already have an account?' : 'New to the studio?'} <Link href={isSignup ? '/login' : '/signup'} className="font-bold text-foreground underline underline-offset-4" data-testid="link-auth-switch">{isSignup ? 'Sign in' : 'Create your profile'}</Link></p></div></div>
  </div>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  return <div className="min-h-[100dvh] bg-background"><aside className={`fixed inset-y-0 left-0 z-30 w-[250px] border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="flex items-center justify-between px-2"><Link href="/app" data-testid="link-app-brand"><BrandMark /></Link><button className="text-sidebar-foreground/60 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation" data-testid="button-close-nav"><X size={18} /></button></div>
    <div className="mt-12 px-2 font-mono-ui text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Your learning path</div>
    <nav className="mt-3 grid gap-1">{navItems.map((item, index) => { const active = index === 0 ? location === '/app' : location.includes(item.label.toLowerCase()); return <Link key={item.href} href={item.href} onClick={() => setMobileNav(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid={`link-sidebar-${item.label.toLowerCase()}`}>{index === 0 ? <LayoutDashboard size={16} /> : index === 1 ? <Play size={16} /> : <FileText size={16} />}{item.label}</Link>; })}</nav>
    <div className="mt-10 px-2 font-mono-ui text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Keep moving</div><div className="mt-3 rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-4"><div className="flex items-center justify-between text-xs"><span className="text-sidebar-foreground/60">Your momentum</span><span className="text-primary">4 days</span></div><div className="mt-3 h-1 rounded-full bg-sidebar-accent"><div className="h-full w-[28%] rounded-full bg-primary" /></div><p className="mt-3 text-xs leading-5 text-sidebar-foreground/50">Small progress is still progress.</p></div>
    <div className="absolute bottom-5 left-4 right-4"><Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-sidebar-foreground/45 transition-colors hover:text-sidebar-foreground" data-testid="link-admin"><Settings size={15} /> Admin view</Link><div className="mt-2 flex items-center gap-3 border-t border-sidebar-border px-3 pt-4"><span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">{student.initials}</span><div className="min-w-0"><p className="truncate text-xs font-bold">{student.name}</p><p className="truncate text-[10px] text-sidebar-foreground/45">{student.role}</p></div></div></div>
  </aside>{mobileNav && <button className="fixed inset-0 z-20 bg-background/70 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation overlay" data-testid="button-overlay-nav" />}<div className="lg:pl-[250px]"><header className="sticky top-0 z-10 flex h-[73px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl lg:px-9"><button className="grid size-9 place-items-center rounded-lg border border-border lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation" data-testid="button-open-nav"><Menu size={18} /></button><div className="hidden font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground lg:block">30-day AI mastermind / <span className="text-primary">DAY {String(student.currentDay).padStart(2, '0')}</span></div><div className="ml-auto flex items-center gap-4"><button className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Notifications" data-testid="button-notifications"><Bell size={17} /></button><div className="hidden h-5 w-px bg-border sm:block" /><span className="hidden text-xs text-muted-foreground sm:block" data-testid="text-header-student">{student.name}</span><span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{student.initials}</span></div></header><main className="mx-auto max-w-[1320px] p-5 lg:p-9">{children}</main></div></div>;
}

function ProgressBar({ value }: { value: number }) { return <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full neon-line transition-all duration-500" style={{ width: `${value}%` }} /></div>; }

function statusFor(session: Session, completed: string[], videos: string[]) {
  if (completed.includes(session.id)) return 'completed';
  if (session.day === 1 || completed.includes(sessions[session.day - 2]?.id ?? '')) return videos.includes(session.id) ? 'assessment' : 'unlocked';
  return 'locked';
}

function Dashboard() {
  const { completedSessions, videoCompleted, scores, feedback } = useLearnerStore();
  const progress = Math.round((completedSessions.length / sessions.length) * 100);
  const nextSession = sessions.find((session) => !completedSessions.includes(session.id)) ?? sessions[sessions.length - 1];
  return <AppShell><PageMeta title="Your learning path" /><div className="reveal"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Your command centre</p><h1 className="mt-3 text-4xl font-bold tracking-[-.06em] sm:text-5xl">Keep building, <span className="text-primary">Aarav.</span></h1><p className="mt-3 text-sm text-muted-foreground">Your next useful move is already queued.</p></div><div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"><div className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground"><Sparkles size={17} /></div><div><p className="text-xs font-bold">4 day streak</p><p className="mt-0.5 text-[11px] text-muted-foreground">Momentum compounds</p></div></div></div>
    <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_.7fr]"><section className="relative overflow-hidden rounded-2xl bg-[#10182b] p-6 text-foreground sm:p-8"><div className="absolute inset-0 aurora opacity-75" /><div className="relative"><div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-primary">Continue learning / 0{nextSession.day}</span><span className="font-mono-ui text-[10px] text-foreground/45">{nextSession.duration}</span></div><h2 className="mt-12 max-w-md text-4xl font-bold leading-[.94] tracking-[-.06em] sm:text-5xl">{nextSession.title}</h2><p className="mt-4 max-w-md text-sm leading-6 text-foreground/60">{nextSession.description}</p><Link href={`/app/sessions/${nextSession.id}`} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-1" data-testid="link-next-session">{videoCompleted.includes(nextSession.id) ? 'Take assessment' : 'Open session'} <ArrowRight size={15} /></Link></div></section><section className="glass-panel rounded-2xl p-6 sm:p-8"><div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-muted-foreground">Overall progress</span><span className="text-2xl font-bold text-primary">{progress}%</span></div><div className="mt-4"><ProgressBar value={progress} /></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{completedSessions.length} of {sessions.length} sessions complete. Keep the chain intact.</p><div className="mt-8 grid grid-cols-2 gap-3 border-t border-border pt-5"><div><p className="text-2xl font-bold">{completedSessions.length}</p><p className="mt-1 text-xs text-muted-foreground">completed</p></div><div><p className="text-2xl font-bold">{Object.keys(scores).length}</p><p className="mt-1 text-xs text-muted-foreground">assessments</p></div></div></section></div>
    <div id="sessions" className="mt-16"><div className="flex items-end justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-secondary">Your path</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">Eight sessions, one direction</h2></div><span className="hidden text-xs text-muted-foreground sm:block">{completedSessions.length}/8 complete</span></div><div className="mt-5 grid gap-3">{sessions.map((session) => { const status = statusFor(session, completedSessions, videoCompleted); const done = status === 'completed'; const locked = status === 'locked'; return <Link href={`/app/sessions/${session.id}`} key={session.id} className={`group grid gap-4 rounded-xl border p-4 transition-all sm:grid-cols-[48px_1fr_auto] sm:items-center ${locked ? 'border-border/60 bg-card/40 opacity-55 hover:border-primary/40' : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/60'}`} data-testid={`card-session-${session.id}`}><span className={`grid size-10 place-items-center rounded-xl text-xs font-bold ${done ? 'bg-primary text-primary-foreground' : status === 'assessment' ? 'bg-secondary/20 text-secondary' : locked ? 'border border-border text-muted-foreground' : 'border border-primary/40 text-primary'}`}>{done ? <Check size={16} /> : locked ? <LockKeyhole size={15} /> : `0${session.day}`}</span><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{session.title}</p><span className={`font-mono-ui text-[9px] uppercase tracking-widest ${done ? 'text-primary' : status === 'assessment' ? 'text-secondary' : 'text-muted-foreground'}`}>{done ? 'Complete' : status === 'assessment' ? 'Assessment ready' : locked ? 'Locked · preview' : 'Unlocked'}</span></div><p className="mt-1 text-sm text-muted-foreground">{session.label}</p>{done && feedback[session.id] && <p className="mt-2 line-clamp-1 text-xs text-secondary">AI feedback: {feedback[session.id]}</p>}</div><div className="flex items-center justify-between gap-5 text-xs text-muted-foreground sm:justify-end"><span>{scores[session.id] !== undefined ? `${scores[session.id]}%` : session.duration}</span>{locked ? <LockKeyhole size={15} /> : <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />}</div></Link>; })}</div></div>
    <div id="assignments" className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_.8fr]"><div><div className="flex items-end justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">Practice room</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">Assignments</h2></div><span className="text-xs text-muted-foreground">{assignments.length} prompts</span></div><div className="mt-5 grid gap-3">{assignments.map((assignment) => <Link href={`/app/assignments/${assignment.id}`} key={assignment.id} className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/60" data-testid={`card-assignment-${assignment.id}`}><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-muted font-mono-ui text-[10px] text-primary">0{assignment.day}</span><div><p className="text-sm font-bold">{assignment.title}</p><p className="mt-1 text-xs text-muted-foreground">Day {assignment.day} practice</p></div></div><ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>)}</div></div><aside className="rounded-2xl border border-secondary/30 bg-secondary/10 p-6"><div className="flex items-center gap-2 text-secondary"><Sparkles size={17} /><span className="font-mono-ui text-[10px] uppercase tracking-[.17em]">Studio note</span></div><p className="mt-8 text-3xl font-bold leading-none tracking-[-.05em]">“Build the smallest thing that teaches you the most.”</p><p className="mt-6 text-xs leading-5 text-muted-foreground">A reminder for the moments when the idea starts getting too big.</p></aside></div>
  </div></AppShell>;
}

function YouTubeLesson({ session, done, onComplete }: { session: Session; done: boolean; onComplete: () => void }) {
  const playerHost = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const { videoProgress, saveVideoProgress } = useLearnerStore();
  const savedProgress = videoProgress[session.id] ?? 0;

  useEffect(() => {
    let interval: number | undefined;
    let cancelled = false;
    const setup = () => {
      if (cancelled || !playerHost.current || !window.YT) return;
      playerRef.current = new window.YT.Player(playerHost.current, {
        videoId: 'sOTX-Akn_CI',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: ({ target }) => { if (savedProgress > 0 && !done) target.seekTo(savedProgress, true); },
          onStateChange: ({ data, target }) => {
            if (data === 0) { saveVideoProgress(session.id, 0); onComplete(); }
            if (data === 1) {
              interval = window.setInterval(() => saveVideoProgress(session.id, Math.floor(target.getCurrentTime())), 5000);
            } else if (interval) {
              window.clearInterval(interval);
              interval = undefined;
            }
          },
        },
      });
    };
    if (window.YT) setup();
    else {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previousReady?.(); setup(); };
    }
    return () => { cancelled = true; if (interval) window.clearInterval(interval); playerRef.current?.destroy(); playerRef.current = null; };
  }, [done, session.id]);

  return <div className="lesson-video-shell group overflow-hidden rounded-2xl border border-primary/20 bg-[#10182b] shadow-2xl shadow-primary/10"><div ref={playerHost} className="aspect-video w-full" />{!done && savedProgress > 0 && <p className="border-t border-white/10 px-4 py-3 text-xs text-foreground/60">Resuming from {Math.floor(savedProgress / 60)}:{String(Math.floor(savedProgress % 60)).padStart(2, '0')}</p>}{done && <div className="flex items-center gap-2 border-t border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary"><CheckCircle2 size={16} /> Video complete · assessment unlocked</div>}</div>;
}

function LegacyVideoTreatment({ session, done, onComplete }: { session: Session; done: boolean; onComplete: () => void }) {
  const [playing, setPlaying] = useState(false);
  return <div className="relative aspect-video overflow-hidden rounded-2xl border border-primary/20 bg-[#10182b]"><div className="absolute inset-0 aurora opacity-80" /><div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(71,220,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(71,220,255,.14) 1px, transparent 1px)', backgroundSize: '42px 42px' }} /><div className="absolute left-6 top-6 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Studio lesson / 0{session.day}</div><div className="absolute inset-0 grid place-items-center"><div className="text-center">{playing && !done ? <><div className="mx-auto flex size-16 items-center justify-center gap-1 rounded-full border border-primary/40 bg-primary/10"><span className="h-5 w-1 rounded-full bg-primary animate-pulse" /><span className="h-8 w-1 rounded-full bg-secondary animate-pulse" /><span className="h-4 w-1 rounded-full bg-accent animate-pulse" /></div><p className="mt-4 text-xs text-foreground/60">Lesson playing · 24:00 remaining</p><Button onClick={onComplete} variant="accent" className="mt-5" data-testid="button-complete-video"><Check size={15} /> Mark video complete</Button></> : <><button onClick={() => setPlaying(true)} className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_rgba(71,220,255,.28)] transition-transform hover:scale-105" aria-label="Play lesson" data-testid="button-play-lesson"><Play size={22} fill="currentColor" className="ml-1" /></button><p className="mt-4 text-xs text-foreground/60">{done ? 'Video complete · assessment unlocked' : 'Play the lesson to unlock assessment'}</p></>}</div></div><div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-background/90 to-transparent p-5 pt-12"><span className="h-1 flex-1 rounded-full bg-foreground/20"><span className={`block h-full rounded-full ${done ? 'w-full bg-primary' : playing ? 'w-[34%] bg-secondary' : 'w-0'}`} /></span><span className="font-mono-ui text-[10px] text-foreground/60">{done ? session.duration : playing ? '06:12' : '00:00'} / {session.duration}</span></div></div>;
}

function VideoTreatment({ session, done, onComplete }: { session: Session; done: boolean; onComplete: () => void }) {
  return session.day === 1
    ? <YouTubeLesson session={session} done={done} onComplete={onComplete} />
    : <LegacyVideoTreatment session={session} done={done} onComplete={onComplete} />;
}

function LegacyAssessment({ session }: { session: Session }) {
  const { videoCompleted, assessmentAnswers, saveAssessmentAnswer, scores, feedback, submitAssessment } = useLearnerStore();
  const unlocked = videoCompleted.includes(session.id);
  const score = scores[session.id];
  const [notice, setNotice] = useState('');
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const submit = () => { const correct = session.questions.filter((item) => assessmentAnswers[item.id] === item.answer).length; submitAssessment(session.id, Math.round((correct / session.questions.length) * 100)); setNotice('Assessment submitted.'); };
  if (!unlocked) return <section className="mt-10 rounded-2xl border border-border bg-card/50 p-6 sm:p-8"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><LockKeyhole size={18} /></span><div><h2 className="text-xl font-bold">Assessment locked</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Complete the video lesson above to unlock session-specific questions, save your answers, and receive AI feedback.</p></div></div></section>;
  return <section className="mt-10 rounded-2xl border border-secondary/30 bg-secondary/5 p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-secondary">Assessment unlocked</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">Check your understanding</h2><p className="mt-2 text-sm text-muted-foreground">One question. One useful signal for what to revisit.</p></div>{score !== undefined && <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center"><p className="text-2xl font-bold text-primary">{score}%</p><p className="font-mono-ui text-[9px] uppercase text-muted-foreground">AI score</p></div>}</div><div className="mt-7 grid gap-5">{session.questions.map((item, index) => <div key={item.id} className="rounded-xl border border-border bg-background/50 p-5"><p className="text-sm font-bold"><span className="mr-2 font-mono-ui text-primary">0{index + 1}</span>{item.prompt}</p><div className="mt-4 grid gap-2">{item.options.map((option) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors ${assessmentAnswers[item.id] === option ? 'border-primary/70 bg-primary/10' : 'border-border hover:border-primary/40'}`}><input type="radio" name={item.id} value={option} checked={assessmentAnswers[item.id] === option} onChange={() => saveAssessmentAnswer(item.id, option)} className="accent-primary" data-testid={`input-assessment-${item.id}`} />{option}</label>)}</div></div>)}</div><div className="mt-6 flex flex-wrap items-center gap-3"><Button onClick={submit} disabled={session.questions.some((item) => !assessmentAnswers[item.id]) || score !== undefined} variant="accent" data-testid="button-submit-assessment">{score !== undefined ? <><Check size={15} /> Submitted</> : <>Submit assessment <ArrowRight size={15} /></>}</Button>{notice && <span className="text-xs text-primary" data-testid="status-assessment">{notice}</span>}</div>{feedback[session.id] && <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 text-sm font-bold text-primary"><Sparkles size={16} /> AI feedback</div><p className="mt-3 text-sm leading-6 text-foreground/75" data-testid={`status-session-feedback-${session.id}`}>{feedback[session.id]}</p></div>}</section>;
}

function getPromptAssessmentResult(assessmentId: string, answer: string) {
  const trimmed = answer.trim();
  if (!trimmed) {
    return {
      score: 0,
      feedback: 'Your answer is blank. Start with a clear goal, audience, and output format.',
      tips: ['Define the role or audience clearly.', 'Specify the output format and constraints.', 'Tell the model what a strong result should include.'],
    };
  }

  const rules: Record<string, { mustInclude: string[]; tips: string[] }> = {
    'q3-fix-vague-prompt': { mustInclude: ['role', 'audience', 'goal', 'format', 'constraints'], tips: ['Give the model a role and audience.', 'Describe the outcome you want.', 'Add one or two specific constraints.'] },
    'q4-few-shot-review-classifier': { mustInclude: ['example', 'positive', 'negative', 'neutral', 'rule'], tips: ['Include 3 or more labelled examples.', 'Define the classification rules clearly.', 'Explain how edge cases should be handled.'] },
    'q5-stepwise-word-problem': { mustInclude: ['step', 'reasoning', 'answer', 'final', 'equation'], tips: ['Show the reasoning in steps instead of jumping to the answer.', 'State the method or formula used.', 'End with a concise final answer.'] },
    'q6-email-json-extractor': { mustInclude: ['json', 'name', 'order', 'issue', 'urgency'], tips: ['Name every required field explicitly.', 'Ask for valid JSON only.', 'Keep the extraction format consistent and easy to parse.'] },
    'q7-cold-brew-bottle-image': { mustInclude: ['cold', 'brew', 'bottle', 'lighting', 'composition', 'exclude'], tips: ['Describe the product, setting, and composition clearly.', 'Specify the camera angle and lighting mood.', 'Add exclusions so the image does not drift off-brand.'] },
    'q8-policy-summary': { mustInclude: ['document', 'only', 'summary', 'policy', 'assumption'], tips: ['Base the summary only on the document.', 'State what to ignore or exclude.', 'Ask for a concise summary with the main policy points.'] },
    'q9-bookstore-support-system': { mustInclude: ['role', 'orders', 'returns', 'recommendations', 'escalate'], tips: ['Define the bot role and tone.', 'Cover the core support flows clearly.', 'Add escalation rules for tricky cases.'] },
    'q10-debug-vague-summary': { mustInclude: ['audience', 'focus', 'summary', 'length', 'format'], tips: ['Name the audience and the purpose.', 'Define the key points the summary should cover.', 'Specify the format and length.'] },
    'q11-photosynthesis-explainer': { mustInclude: ['analogy', 'quiz', 'photosynthesis', 'child', 'simple'], tips: ['Use a familiar analogy to make the idea concrete.', 'Keep the language simple and friendly.', 'Add a short quiz to confirm understanding.'] },
    'q12-compare-and-improve': { mustInclude: ['compare', 'better', 'why', 'improve', 'prompt'], tips: ['Ask the model to compare both prompts directly.', 'Make the decision criteria explicit.', 'Then rewrite the stronger one with clearer constraints.'] },
    'q13-contradictory-marketing-prompt': { mustInclude: ['flaw', 'contradict', 'marketing', 'fix', 'clear'], tips: ['List the contradictions or conflicting priorities.', 'Point out missing audience, channel, or objective details.', 'Rewrite the brief into a coherent version.'] },
    'q14-translation-bot-defense': { mustInclude: ['ignore', 'instructions', 'translation', 'safe', 'protect'], tips: ['Teach the model to ignore malicious override attempts.', 'Keep the translation workflow clear and bounded.', 'Reinforce data handling and safety rules.'] },
    'q15-variable-product-template': { mustInclude: ['template', 'variable', 'product', 'audience', 'features'], tips: ['Use placeholders for repeated product details.', 'Define the target audience and tone.', 'Keep the structure reusable across products.'] },
    'q16-follow-up-fix-email': { mustInclude: ['follow-up', 'long', 'formal', 'concise', 'warm'], tips: ['Tell the model to shorten and soften the tone.', 'Specify what to cut or compress.', 'Keep the final email clear and natural.'] },
    'q17-policy-email': { mustInclude: ['under', '80', 'bullet', 'deadline', 'policy'], tips: ['Keep the message short and action-focused.', 'Use exactly three bullets.', 'End with a clear deadline or next step.'] },
    'q18-study-tips-class-12': { mustInclude: ['class', '12', 'student', 'plan', 'study'], tips: ['Tailor the advice to the learner’s level and workload.', 'Include a realistic daily or weekly plan.', 'Focus on habits that improve retention and focus.'] },
    'q19-prompt-chain-newsletter': { mustInclude: ['step', 'summary', 'newsletter', 'caption', 'chain'], tips: ['Break the workflow into clear stages.', 'Tell the model what each stage should output.', 'Keep the transformation from source to final asset explicit.'] },
    'q20-wellness-assistant-guardrails': { mustInclude: ['wellness', 'never', 'diagnos', 'assistant', 'professional'], tips: ['Set clear guardrails against medical diagnosis.', 'Keep advice general, supportive, and non-clinical.', 'Direct the user to a qualified professional when needed.'] },
  };

  const rule = rules[assessmentId] ?? { mustInclude: ['role', 'goal', 'format', 'constraints'], tips: ['Add context and constraints.', 'Describe the ideal output clearly.', 'Make the task concrete and measurable.'] };
  const lower = trimmed.toLowerCase();
  const matched = rule.mustInclude.filter((item) => lower.includes(item.toLowerCase()));
  const coverage = matched.length / rule.mustInclude.length;
  const wordCount = trimmed.split(/\s+/).length;
  let score = Math.round(56 + coverage * 32 + (wordCount >= 40 ? 8 : wordCount >= 20 ? 4 : 0));
  if (trimmed.includes('{') || trimmed.includes('[') || lower.includes('json')) score += 4;
  score = Math.min(100, score);

  const feedback = coverage >= 0.8
    ? 'This is clear, purposeful, and likely to produce a useful result.'
    : 'The answer shows the right intent, but it still needs clearer structure and stronger constraints.';

  return { score, feedback, tips: rule.tips.slice(0, 3) };
}

function parseFeedbackText(feedbackText: string, fallbackScore: number) {
  const lines = feedbackText.split('\n').map((line) => line.trim()).filter(Boolean);
  const scoreLine = lines.find((line) => /^score:/i.test(line));
  const summaryLine = lines.find((line) => !/^score:/i.test(line) && !line.startsWith('•') && !line.startsWith('-'));
  const tipsLines = lines.filter((line) => line.startsWith('•') || line.startsWith('-')).map((line) => line.replace(/^[-•]\s*/, ''));
  return {
    score: scoreLine ? Number.parseInt(scoreLine.replace(/[^\d]/g, ''), 10) || fallbackScore : fallbackScore,
    summary: summaryLine || 'The response is directionally good and can be improved with clearer structure and sharper constraints.',
    tips: tipsLines.length ? tipsLines.slice(0, 3) : ['State the audience and desired output more explicitly.', 'Add the key constraints that will shape the result.', 'Tell the model what success should look like.'],
  };
}

function Assessment({ session }: { session: Session }) {
  const [, setLocation] = useLocation();
  const { videoCompleted, answers, saveAnswer, uploadedImages, saveUploadedImage, assignmentScores, assignmentFeedback, submitSessionAssignment, saveFinalAssessmentResult, markSessionComplete, isAuthenticated, userId } = useLearnerStore();
  const [notice, setNotice] = useState('');
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const unlocked = videoCompleted.includes(session.id);
  const assessments = sessionAssessments[session.day] ?? [];
  const attemptedCount = assessments.filter((assessment) => {
    if (assessment.type === 'image') return Boolean((uploadedImages[assessment.id] ?? '').trim());
    return Boolean((answers[assessment.id] ?? '').trim());
  }).length;

  const isAttempted = (assessmentId: string) => {
    if (uploadedImages[assessmentId]) return Boolean(uploadedImages[assessmentId].trim());
    return Boolean((answers[assessmentId] ?? '').trim());
  };

  if (!unlocked) return <section className="mt-10 rounded-2xl border border-border bg-card/50 p-6 sm:p-8"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><LockKeyhole size={18} /></span><div><h2 className="text-xl font-bold">Assessment locked</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Complete the video above to unlock this session assessment.</p></div></div></section>;
  if (!assessments.length) return <section className="mt-10 rounded-2xl border border-border bg-card/50 p-6 sm:p-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-secondary">Assessment unlocked</p><h2 className="mt-2 text-2xl font-bold">Future assessment</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This session's practical assessment is being prepared.</p></section>;

  const submit = async (assessmentId: string, type: 'prompt' | 'image') => {
    if (!isAuthenticated) { setLocation('/login'); return; }

    if (type === 'image') {
      const response = uploadedImages[assessmentId];
      if (!response) { setNotice('Complete this assessment before submitting.'); return; }
      setNotice('Evaluating your submission...');
      try {
        const upload = response.length > 2 * 1024 * 1024 ? await compressDataUrl(response) : response;
        const result = await fetch('/api/assessment-submissions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': userId ?? '' }, body: JSON.stringify({ learnerId: userId, sessionId: session.id, assignmentId: assessmentId, answer: null, uploadedImage: upload }) });
        const raw = await result.text();
        let payload: { success?: boolean; score?: number; feedback?: string; strengths?: string[] | string; improvements?: string[] | string; error?: string } = {};
        if (raw.trim()) {
          try { payload = JSON.parse(raw); } catch { throw new Error(`Backend returned non-JSON data (${result.status}).`); }
        }
        if (!result.ok || payload.success === false) throw new Error(payload.error || `Assessment submission failed (${result.status}).`);
        if (typeof payload.score !== 'number' || !payload.feedback) throw new Error('The evaluator returned an incomplete result.');
        submitSessionAssignment(assessmentId, payload.score, `Score: ${payload.score}%\n${payload.feedback}`);
        setNotice('Assessment submitted. Your AI evaluation is saved.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Assessment submission failed.');
      }
      return;
    }

    if (assessmentId === 'prompt-image-generation') {
      const response = answers[assessmentId];
      if (!response) { setNotice('Complete this assessment before submitting.'); return; }
      setNotice('Evaluating your submission...');
      try {
        const result = await fetch('/api/assessment-submissions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': userId ?? '' }, body: JSON.stringify({ learnerId: userId, sessionId: session.id, assignmentId: assessmentId, answer: response, uploadedImage: null }) });
        const raw = await result.text();
        let payload: { success?: boolean; score?: number; feedback?: string; strengths?: string[] | string; improvements?: string[] | string; error?: string } = {};
        if (raw.trim()) {
          try { payload = JSON.parse(raw); } catch { throw new Error(`Backend returned non-JSON data (${result.status}).`); }
        }
        if (!result.ok || payload.success === false) throw new Error(payload.error || `Assessment submission failed (${result.status}).`);
        if (typeof payload.score !== 'number' || !payload.feedback) throw new Error('The evaluator returned an incomplete result.');
        submitSessionAssignment(assessmentId, payload.score, `Score: ${payload.score}%\n${payload.feedback}`);
        setNotice('Assessment submitted. Your AI evaluation is saved.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Assessment submission failed.');
      }
      return;
    }

    const response = answers[assessmentId];
    if (!response) { setNotice('Complete this assessment before submitting.'); return; }

    const result = getPromptAssessmentResult(assessmentId, response);
    const feedbackText = `Score: ${result.score}%\n${result.feedback}\n${result.tips.map((tip) => `• ${tip}`).join('\n')}`;
    submitSessionAssignment(assessmentId, result.score, feedbackText);
    setNotice('Assessment submitted. Your AI evaluation is saved.');
  };

  const handleFinalSubmit = async () => {
    if (finalSubmitted) return;
    if (!isAuthenticated) { setLocation('/login'); return; }
    if (attemptedCount === 0) {
      setNotice('Attempt at least one question before final submission.');
      return;
    }

    const confirmed = window.confirm(`You have attempted ${attemptedCount}/${assessments.length} questions. Submit anyway?`);
    if (!confirmed) return;

    setNotice('Saving final submissions...');
    try {
      const finalScores: number[] = [];
      const feedbackParts: string[] = [];
      for (const assessment of assessments) {
        if (!isAttempted(assessment.id)) continue;

        const answer = assessment.type === 'prompt' ? (answers[assessment.id] ?? '').trim() : null;
        const uploaded = assessment.type === 'image' ? uploadedImages[assessment.id] : null;
        const localResult = assessment.type === 'prompt' ? getPromptAssessmentResult(assessment.id, answer || '') : null;
        const score = localResult?.score ?? assignmentScores[assessment.id] ?? 0;
        const feedback = localResult
          ? `Score: ${localResult.score}%\n${localResult.feedback}\n${localResult.tips.map((tip) => `• ${tip}`).join('\n')}`
          : (assignmentFeedback[assessment.id] ?? 'Submission saved.');

        const result = await fetch('/api/assessment-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId ?? '' },
          body: JSON.stringify({
            learnerId: userId,
            sessionId: session.id,
            assignmentId: assessment.id,
            answer,
            uploadedImage: uploaded,
            score,
            feedback,
            strengths: localResult ? localResult.tips.slice(0, 2) : [],
            improvements: localResult ? localResult.tips.slice(2, 4) : [],
            finalSubmit: true,
          }),
        });

        const raw = await result.text();
        let payload: { success?: boolean; error?: string } = {};
        if (raw.trim()) {
          try { payload = JSON.parse(raw); } catch { throw new Error(`Final submission failed for ${assessment.id}.`); }
        }

        if (!result.ok || payload.success === false) throw new Error(payload.error || `Final submission failed for ${assessment.id}.`);
        submitSessionAssignment(assessment.id, score, feedback);
        finalScores.push(score);
        if (localResult?.feedback) feedbackParts.push(localResult.feedback);
        else if (feedback) feedbackParts.push(feedback.replace(/^Score:\s*\d+%\s*/i, '').split('\n')[0]);
      }

      const finalScore = Math.round(finalScores.reduce((total, score) => total + score, 0) / finalScores.length);
      saveFinalAssessmentResult(session.id, {
        score: finalScore,
        attempted: finalScores.length,
        total: assessments.length,
        feedback: feedbackParts.slice(0, 2).join(' ') || 'Your assessment has been saved successfully.',
      });
      markSessionComplete(session.id);
      setFinalSubmitted(true);
      setLocation(`/app/assessment-results/${session.id}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Final submission failed.');
    }
  };

  return <section className="mt-10 rounded-2xl border border-secondary/30 bg-secondary/5 p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-secondary">Assessment unlocked ✓</p><h2 className="mt-2 text-2xl font-bold">Practical assessment</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Students can submit progress before all questions are finished.</p></div>{notice && <span className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-bold">{notice}</span>}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">Attempted: {attemptedCount}/{assessments.length}</p><Button onClick={handleFinalSubmit} disabled={finalSubmitted || attemptedCount === 0} variant="accent" data-testid="button-final-submit-assessment">FINAL SUBMIT</Button></div><div className="mt-7 grid gap-5">{assessments.map((assessment, index) => { const score = assignmentScores[assessment.id]; const feedbackText = assignmentFeedback[assessment.id] ?? ''; const result = score !== undefined ? parseFeedbackText(feedbackText, score) : null; const disabled = finalSubmitted; return <article key={assessment.id} className="rounded-xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">Q{index + 1} / {assessment.type === 'prompt' ? 'Prompt writing' : 'Image evaluation'}</p><h3 className="mt-3 text-lg font-bold">{assessment.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{assessment.prompt}</p>{assessment.type === 'prompt' ? <textarea value={answers[assessment.id] ?? ''} onChange={(event) => saveAnswer(assessment.id, event.target.value)} placeholder={assessment.placeholder} rows={6} disabled={disabled} className="mt-4 w-full resize-y rounded-lg border border-input bg-background p-4 text-sm leading-6 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" /> : <><input type="file" accept="image/*" disabled={disabled} onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => saveUploadedImage(assessment.id, String(reader.result)); reader.readAsDataURL(file); }} className="mt-4 block w-full rounded-lg border border-input bg-background p-3 text-sm disabled:cursor-not-allowed disabled:opacity-60" />{uploadedImages[assessment.id] && <img src={uploadedImages[assessment.id]} alt="Uploaded assessment" className="mt-4 max-h-72 rounded-lg border border-border object-cover" />}</>}{result && <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-4"><div className="flex items-center justify-between gap-4"><span className="text-sm font-bold">Score</span><span className="text-2xl font-bold text-primary">{result.score}%</span></div><p className="mt-3 text-sm leading-6 text-foreground/80">{result.summary}</p><ul className="mt-3 space-y-1 text-sm text-foreground/75">{result.tips.slice(0, 3).map((tip, tipIndex) => <li key={`${assessment.id}-tip-${tipIndex}`}>• {tip}</li>)}</ul></div>}<div className="mt-4 flex items-center justify-end"><Button onClick={() => submit(assessment.id, assessment.type)} disabled={disabled || score !== undefined} variant="accent" data-testid={`button-submit-assessment-${assessment.id}`}>{score !== undefined ? <><Check size={15} /> Submitted</> : <>Submit assessment <ArrowRight size={15} /></>}</Button></div></article>; })}</div></section>;
}

function AssessmentResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { finalAssessmentResults } = useLearnerStore();
  const result = sessionId ? finalAssessmentResults[sessionId] : undefined;
  const session = sessions.find((item) => item.id === sessionId);
  const nextSession = session ? sessions.find((item) => item.day > session.day) : undefined;

  if (!session || !result) return <AppShell><div className="grid min-h-[60vh] place-items-center text-center"><div><h1 className="text-2xl font-bold">Assessment result unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Return to the programme to continue your learning path.</p><Link href="/programme" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Back to Programme <ArrowLeft size={15} /></Link></div></div></AppShell>;

  return <AppShell><PageMeta title="Assessment completed" /><main className="mx-auto max-w-[760px] px-5 pb-24 pt-16 lg:px-8 lg:pt-24"><div className="reveal rounded-2xl border border-primary/30 bg-primary/5 p-7 sm:p-10"><div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary"><Check size={26} /></div><p className="mt-8 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Assessment complete</p><h1 className="mt-3 text-4xl font-bold tracking-[-.05em] sm:text-5xl">Assessment submitted successfully</h1><p className="mt-3 text-sm text-muted-foreground">{session.title}</p><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Final score</p><p className="mt-3 text-4xl font-bold text-primary">{result.score}%</p></div><div className="rounded-xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Attempted</p><p className="mt-3 text-3xl font-bold">{result.attempted}/{result.total}</p></div><div className="rounded-xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Unanswered</p><p className="mt-3 text-3xl font-bold">{result.total - result.attempted}/{result.total}</p></div></div><div className="mt-6 rounded-xl border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-secondary">Short AI feedback</p><p className="mt-3 text-sm leading-7 text-muted-foreground">{result.feedback}</p></div><div className="mt-8 flex flex-wrap gap-3"><Link href="/programme" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="button-back-to-programme">Back to Programme <ArrowLeft size={15} /></Link>{nextSession ? <Link href={`/app/sessions/${nextSession.id}`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold hover:border-primary/60" data-testid="button-next-session">Next Session <ArrowRight size={15} /></Link> : <Link href="/programme" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold hover:border-primary/60" data-testid="button-next-session">Next Session <ArrowRight size={15} /></Link>}</div></div></main></AppShell>;
}

function CourseSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { videoCompleted, completeVideo } = useLearnerStore();
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) return <MissingContent label="Session not found" />;
  const done = videoCompleted.includes(session.id);
  return <div className="grain min-h-[100dvh] bg-background"><PageMeta title={`${session.title} — 30-Day AI Mastermind`} /><PublicNav /><main className="mx-auto max-w-[1080px] px-5 pb-24 pt-36 lg:px-8 lg:pt-44"><Link href="/programme" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft size={15} /> Back to programme</Link><div className="mt-8 max-w-3xl reveal"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Session 0{session.day} / 30-day AI mastermind</p><h1 className="mt-4 text-5xl font-bold leading-[.94] tracking-[-.06em] sm:text-7xl">{session.title}</h1><p className="mt-6 text-lg leading-8 text-muted-foreground">{session.description}</p></div><div className="mt-10"><VideoTreatment session={session} done={done} onComplete={() => completeVideo(session.id)} /></div><section className="mt-8 grid gap-5 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-secondary">What you'll learn</p><h2 className="mt-3 text-2xl font-bold">Practical outcomes for this session</h2><div className="mt-6 grid gap-4">{session.objectives.map((objective) => <div key={objective} className="flex items-start gap-3 text-sm leading-6"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-secondary" />{objective}</div>)}</div></div><div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Course description</p><h2 className="mt-3 text-2xl font-bold">Prompt with purpose</h2><p className="mt-6 text-sm leading-7 text-muted-foreground">Learn how to turn a vague idea into a clear, controllable brief. You will practice context, constraints, examples, and evaluation so AI outputs become more useful and repeatable.</p></div></section><Assessment session={session} /></main><footer className="mx-auto flex max-w-[1080px] flex-col gap-4 border-t border-border px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><BrandMark compact /><p>© 2024 Social Seller AI. Built for useful momentum.</p></footer></div>;
}

function SessionPlayer() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { videoCompleted, completedSessions, completeVideo } = useLearnerStore();
  const [, setLocation] = useLocation();
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) return <MissingContent label="Session not found" />;
  const done = videoCompleted.includes(session.id);
  const next = sessions.find((item) => item.day > session.day);
  const status = completedSessions.includes(session.id) ? 'Completed' : done ? 'Assessment unlocked' : 'Video required';
  return <AppShell><PageMeta title={`${session.title} — Lesson`} /><div className="reveal"><Link href="/app" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="link-back-dashboard"><ArrowLeft size={14} /> Back to your path</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Session 0{session.day} / {session.label}</p><h1 className="mt-3 text-4xl font-bold tracking-[-.06em] sm:text-6xl">{session.title}</h1></div><span className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 size={14} /> {session.duration}</span></div><div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_.75fr]"><div><VideoTreatment session={session} done={done} onComplete={() => completeVideo(session.id)} /><div className="mt-8"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Lesson progress</p><span className={`font-mono-ui text-[10px] uppercase ${done ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span></div><div className="mt-3"><ProgressBar value={done ? 100 : 34} /></div><p className="mt-5 max-w-2xl text-xl leading-8 tracking-[-.02em]">{session.description}</p></div></div><aside className="glass-panel h-fit rounded-2xl p-5 sm:p-7"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-secondary">Session kit</p><div className="mt-6 divide-y divide-border">{session.resources.map((resource) => <button key={resource} className="flex w-full items-center justify-between py-4 text-left text-sm hover:text-primary" onClick={() => setLocation('/app#assignments')} data-testid={`button-resource-${resource.toLowerCase().replaceAll(' ', '-')}`}><span className="flex items-center gap-3"><FileText size={15} className="text-muted-foreground" />{resource}</span><ArrowRight size={15} /></button>)}</div><div className="mt-7 border-t border-border pt-5"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The useful bit</p><p className="mt-3 text-lg font-bold leading-7">{session.takeaway}</p></div></aside></div><div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_.75fr]"><section className="rounded-2xl border border-border bg-card p-6 sm:p-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Learning objectives</p><div className="mt-6 grid gap-4">{session.objectives.map((objective) => <div key={objective} className="flex items-start gap-3 text-sm leading-6"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />{objective}</div>)}</div><div className="mt-8 border-t border-border pt-8"><div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Read along</p><h2 className="mt-2 text-xl font-bold">Lesson notes</h2></div><button className="text-xs font-bold text-primary" onClick={() => navigator.clipboard?.writeText(session.transcript.join('\\n'))} data-testid="button-copy-transcript">Copy notes</button></div><div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">{session.transcript.map((line, index) => <p key={line}><span className="mr-3 font-mono-ui text-[10px] text-secondary">0{index + 1}</span>{line}</p>)}</div></div></section><div><Assessment session={session} />{done && completedSessions.includes(session.id) && <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Session complete</p><h2 className="mt-3 text-2xl font-bold">Keep the chain moving.</h2>{next ? <Link href={`/app/sessions/${next.id}`} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="link-next-session-lesson">Continue to {next.title} <ArrowRight size={15} /></Link> : <Link href="/app" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="link-finish-course">Return to dashboard <ArrowRight size={15} /></Link>}</div>}</div></div></div></AppShell>;
}

function AssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const assignment = assignments.find((item) => item.id === assignmentId);
  const { answers, feedback, saveAnswer, requestFeedback } = useLearnerStore();
  const [answer, setAnswer] = useState(assignment ? answers[assignment.id] ?? '' : '');
  const [saved, setSaved] = useState(Boolean(assignment && answers[assignment.id]));
  if (!assignment) return <MissingContent label="Assignment not found" />;
  const save = () => { saveAnswer(assignment.id, answer); setSaved(true); };
  return <AppShell><PageMeta title={`${assignment.title} — Assignment`} /><div className="reveal"><Link href="/app#assignments" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" data-testid="link-back-assignments"><ArrowLeft size={14} /> Back to assignments</Link><div className="mt-8 max-w-3xl"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent">Day {assignment.day} / Practice room</p><h1 className="mt-3 text-4xl font-bold leading-none tracking-[-.06em] sm:text-6xl">{assignment.title}</h1><p className="mt-6 text-lg leading-8 text-muted-foreground">{assignment.prompt}</p></div><div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_.75fr]"><div><label className="block"><span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Your working answer</span><textarea value={answer} onChange={(e) => { setAnswer(e.target.value); setSaved(false); }} placeholder="Start with the honest version..." rows={11} className="mt-3 w-full resize-y rounded-xl border border-border bg-card p-5 text-sm leading-7 outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary" data-testid="textarea-assignment-answer" /></label><div className="mt-4 flex flex-wrap items-center gap-3"><Button onClick={save} data-testid="button-save-answer"><Check size={15} /> {saved ? 'Answer saved' : 'Save answer'}</Button><Button onClick={() => { save(); requestFeedback(assignment.id); }} variant="outline" data-testid="button-request-feedback"><Sparkles size={15} /> Ask for AI feedback</Button><span className="text-xs text-muted-foreground">{saved ? 'Saved just now' : 'Unsaved changes'}</span></div></div><aside className="h-fit rounded-2xl border border-accent/25 bg-accent/10 p-6"><div className="flex items-center gap-2 text-accent"><Sparkles size={16} /><span className="font-mono-ui text-[10px] uppercase tracking-[.18em]">A useful constraint</span></div><p className="mt-7 text-lg leading-7">{assignment.hint}</p><div className="mt-7 border-t border-border/70 pt-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Deliverable</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{assignment.deliverable}</p></div></aside></div>{feedback[assignment.id] && <section className="mt-10 max-w-3xl rounded-2xl border border-secondary/60 bg-secondary/10 p-6 sm:p-8"><div className="flex items-center gap-2 text-sm font-bold text-secondary"><Sparkles size={16} /> AI feedback</div><p className="mt-4 text-sm leading-7 text-foreground/75" data-testid="status-ai-feedback">{feedback[assignment.id]}</p></section>}</div></AppShell>;
}

function Admin() {
  const [filter, setFilter] = useState('All students');
  const [notice, setNotice] = useState('');
  const [students, setStudents] = useState([{ name: 'Aarav Mehta', initials: 'AM', progress: 28, status: 'Active', last: '12 min ago' }, { name: 'Priya Nair', initials: 'PN', progress: 64, status: 'Active', last: '42 min ago' }, { name: 'Rohan Kapoor', initials: 'RK', progress: 12, status: 'Needs nudge', last: '2 days ago' }, { name: 'Meera Shah', initials: 'MS', progress: 91, status: 'Active', last: 'Yesterday' }]);
  const filtered = filter === 'All students' ? students : students.filter((item) => filter === item.status);
  const invite = () => { setNotice('Invite link copied to clipboard.'); navigator.clipboard?.writeText('socialseller.ai/join/cohort-04'); };
  return <AppShell><PageMeta title="Admin dashboard" /><div className="reveal"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-secondary">Admin / Programme room</p><h1 className="mt-3 text-4xl font-bold tracking-[-.06em] sm:text-5xl">See the room clearly.</h1><p className="mt-3 text-sm text-muted-foreground">Manage learners, sessions, and the conversations that keep momentum alive.</p></div><Button onClick={invite} variant="accent" data-testid="button-invite-student"><Plus size={16} /> Invite student</Button></div>{notice && <div className="mt-5 flex items-center justify-between rounded-xl border border-secondary/60 bg-secondary/10 px-4 py-3 text-sm"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice" data-testid="button-dismiss-notice"><X size={16} /></button></div>}<div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{ label: 'Active learners', value: '437,787+', detail: 'all-time reach', icon: <Users size={17} /> }, { label: 'Programme progress', value: '46.8%', detail: 'average this cohort', icon: <BarChart3 size={17} /> }, { label: 'Open submissions', value: '24', detail: 'awaiting review', icon: <FileText size={17} /> }, { label: 'Live sessions', value: '04', detail: 'this month', icon: <Play size={17} /> }].map((stat) => <div key={stat.label} className="glass-panel rounded-xl p-5"><div className="flex items-center justify-between text-primary"><span className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-muted-foreground">{stat.label}</span>{stat.icon}</div><p className="mt-7 text-3xl font-bold tracking-[-.04em]">{stat.value}</p><p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p></div>)}</div><div className="mt-12 grid gap-8 xl:grid-cols-[1.35fr_.65fr]"><section className="rounded-2xl border border-border bg-card"><div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold">Student management</h2><p className="mt-1 text-xs text-muted-foreground">A calm view of who needs your attention.</p></div><div className="flex items-center gap-2"><Search size={15} className="text-muted-foreground" /><select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-transparent text-xs outline-none" data-testid="select-student-filter"><option>All students</option><option>Active</option><option>Needs nudge</option></select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-border bg-muted/50 font-mono-ui text-[9px] uppercase tracking-[.15em] text-muted-foreground"><tr><th className="px-5 py-3 font-normal">Student</th><th className="px-5 py-3 font-normal">Progress</th><th className="px-5 py-3 font-normal">Status</th><th className="px-5 py-3 font-normal">Last seen</th><th className="px-5 py-3 font-normal" /></tr></thead><tbody className="divide-y divide-border">{filtered.map((item) => <tr key={item.name} className="group"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-muted text-[10px] font-bold">{item.initials}</span><span className="font-bold">{item.name}</span></div></td><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-20"><ProgressBar value={item.progress} /></div><span className="text-xs text-muted-foreground">{item.progress}%</span></div></td><td className="px-5 py-4"><span className={`font-mono-ui text-[9px] uppercase tracking-[.12em] ${item.status === 'Needs nudge' ? 'text-accent' : 'text-muted-foreground'}`}>{item.status}</span></td><td className="px-5 py-4 text-xs text-muted-foreground">{item.last}</td><td className="px-5 py-4 text-right"><button className="text-muted-foreground hover:text-foreground" onClick={() => setNotice(`Opening ${item.name}'s learner profile.`)} aria-label={`Open ${item.name}`} data-testid={`button-open-student-${item.initials}`}><ChevronRight size={17} /></button></td></tr>)}</tbody></table></div></section><section className="rounded-2xl bg-[#10182b] p-6 text-foreground"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-secondary">Submission pulse</p><Zap size={15} className="text-primary" /></div><div className="mt-12"><p className="text-4xl font-bold leading-none tracking-[-.06em]">24 answers<br /><span className="text-secondary">in the room.</span></p><p className="mt-5 text-sm leading-6 text-foreground/55">The highest response is for the opportunity thesis. People are finding the edge.</p></div><button onClick={() => setNotice('Submission queue opened.')} className="mt-10 flex items-center gap-2 border-b border-secondary pb-2 text-sm font-bold text-secondary" data-testid="button-open-submissions">Review submissions <ArrowRight size={15} /></button></section></div><div className="mt-8 grid gap-8 lg:grid-cols-2"><section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Session management</h2><p className="mt-1 text-xs text-muted-foreground">The current programme sequence.</p></div><button className="text-xs font-bold text-primary" onClick={() => setNotice('Session editor opened.')} data-testid="button-edit-sessions">Edit sequence</button></div><div className="mt-5 grid gap-2">{sessions.map((item) => <div key={item.id} className="flex items-center gap-3 border-t border-border py-3"><span className="font-mono-ui text-[10px] text-primary">0{item.day}</span><span className="flex-1 text-sm">{item.title}</span><span className="text-xs text-muted-foreground">{item.duration}</span><CheckCircle2 size={15} className="text-secondary" /></div>)}</div></section><section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Recent notes</h2><p className="mt-1 text-xs text-muted-foreground">Messages worth carrying into the room.</p></div><button className="text-xs font-bold text-primary" onClick={() => setNotice('Note composer opened.')} data-testid="button-new-note">New note</button></div><div className="mt-5 grid gap-3"><div className="border-l-2 border-accent pl-4"><p className="text-sm leading-6">“Keep the first offer smaller than feels comfortable.”</p><p className="mt-2 font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground">Lakshit / Today</p></div><div className="border-l-2 border-secondary pl-4"><p className="text-sm leading-6">Cohort 04 is responding strongly to positioning prompts.</p><p className="mt-2 font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground">Studio system / Yesterday</p></div></div></section></div></div></AppShell>;
}

function MissingContent({ label }: { label: string }) { return <AppShell><div className="grid min-h-[60vh] place-items-center text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-full bg-muted"><Search size={20} /></div><h1 className="mt-5 text-2xl font-bold">{label}</h1><p className="mt-2 text-sm text-muted-foreground">This path moved, but your next step is still here.</p><Link href="/app" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="link-missing-dashboard">Return to dashboard <ArrowRight size={15} /></Link></div></div></AppShell>; }

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/programme" component={Programme} /><Route path="/login"><AuthPage mode="login" /></Route><Route path="/signup"><AuthPage mode="signup" /></Route><Route path="/app" component={Dashboard} /><Route path="/app/assessment-results/:sessionId" component={AssessmentResultsPage} /><Route path="/app/sessions/:sessionId" component={CourseSessionPage} /><Route path="/app/assignments/:assignmentId" component={AssignmentPage} /><Route path="/admin" component={Admin} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><LearnerProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter></LearnerProvider><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;