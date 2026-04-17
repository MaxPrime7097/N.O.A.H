
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// Casting motion components to avoid type errors
const MotionDiv = motion.div as any;
const MotionP = motion.p as any;
const MotionH1 = motion.h1 as any;
const MotionH3 = motion.h3 as any;
const MotionButton = motion.button as any;

interface Props {
  onProceed: () => void;
  onEnter: () => void;
}

const Landing: React.FC<Props> = ({ onProceed, onEnter }) => {
  return (
    <div className="bg-bgMain text-textPrimary selection:bg-accent/30 overflow-x-hidden font-sans flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="h-screen relative flex flex-col justify-center items-center px-6 text-center shrink-0">
        {/* Fixed motion.h1 with MotionH1 any cast */}
        <MotionH1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl animate-fade-in"
        >
          Alignment is <br />
          <span className="text-accent italic font-light">measurable.</span>
        </MotionH1>
        
        {/* Fixed motion.p with MotionP any cast */}
        <MotionP 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-8 text-textSecondary max-w-md text-lg font-light leading-relaxed"
        >
          N.O.A.H is a silent system that detects when your actions drift away from who you want to become.
        </MotionP>

        {/* Fixed motion.button with MotionButton any cast */}
        <MotionButton
          onClick={onProceed}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-12 bg-accent px-12 py-5 text-[11px] font-mono tracking-[0.4em] uppercase hover:opacity-90 transition-all active-feedback border border-accent/20"
        >
          Start the experiment
        </MotionButton>

        <div className="absolute bottom-10 animate-breathe flex flex-col items-center space-y-2">
          <span className="text-[9px] tracking-[0.4em] uppercase text-textSecondary/40">Scroll to observe</span>
          <ChevronDown size={14} className="text-textSecondary/40" />
        </div>
      </section>

      {/* Problem Section */}
      <ScrollSection title="The Problem" content="You already know what to do. The drift happens in the silence between your intentions and your actions." />

      {/* Philosophy List */}
      <section className="py-32 px-6 max-w-3xl mx-auto border-y border-white/5 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <FeatureItem title="Defines" desc="Lock your target identity and behavioral anchors." />
          <FeatureItem title="Observes" desc="Silent daily check-ins record raw reality without judgment." />
          <FeatureItem title="Detects" desc="Patterns emerge. Drift is identified before it becomes a habit." />
        </div>
      </section>

      {/* Drift Section */}
      <section className="py-48 px-6 text-center bg-bgSurface/20 w-full">
        {/* Fixed motion.p with MotionP any cast */}
        <MotionP 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-3xl md:text-5xl font-light tracking-tight italic text-accent opacity-80"
        >
          "Drift is silent."
        </MotionP>
      </section>
      
      {/* How it Works */}
      <section className="py-32 px-6 max-w-4xl mx-auto space-y-24 w-full">
        <h2 className="noah-title text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StepItem num="01" title="Lock" desc="Identity commitment for 30 days." />
          <StepItem num="02" title="Check-in" desc="Record daily behavior." />
          <StepItem num="03" title="Observe" desc="Analysis of hidden patterns." />
          <StepItem num="04" title="Correct" desc="Truth-based alignment." />
        </div>
      </section>

      {/* For / Not For Columns */}
      <section className="py-32 px-6 bg-bgSurface/40 w-full">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
          <div className="space-y-8">
            <h3 className="noah-title text-accent">For</h3>
            <ul className="space-y-6 text-sm font-light leading-relaxed text-textSecondary">
              <li>• Individuals taking themselves seriously.</li>
              <li>• Those who prioritize honesty over motivation.</li>
              <li>• Seekers of radical internal alignment.</li>
            </ul>
          </div>
          <div className="space-y-8">
            <h3 className="noah-title text-textSecondary/40">Not For</h3>
            <ul className="space-y-6 text-sm font-light leading-relaxed text-textSecondary/40">
              <li>• Seekers of social validation or dopamine.</li>
              <li>• Productivity hackers looking for shortcuts.</li>
              <li>• Users expecting a friendly coach.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Call */}
      <section className="min-h-screen flex flex-col justify-center items-center px-6 text-center shrink-0">
        {/* Fixed motion.div with MotionDiv any cast */}
        <MotionDiv 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="space-y-12 max-w-xl"
        >
          <p className="text-2xl md:text-4xl font-light leading-relaxed text-textSecondary">
            This is a 30-day experiment. <br />
            <span className="text-textPrimary font-normal uppercase tracking-widest text-lg md:text-xl">Not a lifestyle app.</span>
          </p>
          <button
            onClick={onEnter}
            className="text-[11px] font-mono tracking-[0.5em] uppercase text-textPrimary border-b border-accent pb-2 hover:border-white transition-all active-feedback"
          >
            Begin Observation
          </button>
        </MotionDiv>
      </section>

      <footer className="py-16 opacity-10 text-[9px] font-mono tracking-[0.6em] uppercase text-center w-full shrink-0">
        N.O.A.H — Silence is the mirror.
      </footer>
    </div>
  );
};

const ScrollSection = ({ title, content }: { title: string, content: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-48 px-6 max-w-3xl mx-auto text-center space-y-12 w-full">
      {/* Fixed motion.h3 with MotionH3 any cast */}
      <MotionH3 
        animate={isInView ? { opacity: 0.4, y: 0 } : { opacity: 0, y: 20 }}
        className="noah-title"
      >
        {title}
      </MotionH3>
      {/* Fixed motion.p with MotionP any cast */}
      <MotionP 
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-2xl md:text-4xl font-light leading-snug"
      >
        {content}
      </MotionP>
    </section>
  );
};

const FeatureItem = ({ title, desc }: { title: string, desc: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    /* Fixed motion.div with MotionDiv any cast */
    <MotionDiv 
      ref={ref}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      className="space-y-4"
    >
      <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">{title}</h4>
      <p className="text-xs text-textSecondary font-light leading-relaxed">{desc}</p>
    </MotionDiv>
  );
};

const StepItem = ({ num, title, desc }: { num: string, title: string, desc: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    /* Fixed motion.div with MotionDiv any cast */
    <MotionDiv 
      ref={ref}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
      className="space-y-4 p-6 noah-card border-white/5"
    >
      <span className="text-[10px] font-mono text-accent/50">{num}.</span>
      <h4 className="text-xs font-semibold uppercase tracking-widest">{title}</h4>
      <p className="text-[11px] text-textSecondary/60 font-light leading-relaxed">{desc}</p>
    </MotionDiv>
  );
};

export default Landing;
