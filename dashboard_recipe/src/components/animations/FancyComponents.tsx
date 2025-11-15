"use client";

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

const ease = {
  ease: [0.16, 1, 0.3, 1],
};

type FancyBaseProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
};

export function FancyFadeIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
}: FancyBaseProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

type FancySlideInProps = FancyBaseProps & {
  direction?: "left" | "right";
};

export function FancySlideIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = "left",
}: FancySlideInProps) {
  const xInitial = direction === "left" ? -60 : 60;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: xInitial }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

type FancyStaggerProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
};

export function FancyStagger({
  children,
  className,
  delay = 0,
  stagger = 0.12,
}: FancyStaggerProps) {
  const items = useMemo(() => Children.toArray(children), [children]);

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
      variants={{
        hidden: { opacity: 1 },
        show: {
          opacity: 1,
          transition: {
            delay,
            staggerChildren: stagger,
            ease,
          },
        },
      }}
    >
      {items.map((child, index) => {
        const key =
          isValidElement(child) && child.key !== null && child.key !== undefined ? child.key : index;
        const childClass = isValidElement(child) ? child.props.className : undefined;
        return (
          <motion.div
            key={key}
            className={childClass}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0 },
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

type FancyTextRevealProps = {
  text: string;
  className?: string;
  delay?: number;
};

export function FancyTextReveal({
  text,
  className,
  delay = 0.2,
}: FancyTextRevealProps) {
  const letters = useMemo(() => [...text], [text]);

  return (
    <span className={clsx("inline-flex overflow-hidden", className)}>
      {letters.map((letter, index) => (
        <motion.span
          key={`${letter}-${index}`}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: delay + index * 0.04,
            duration: 0.6,
            ease,
          }}
          className={clsx("inline-block", letter === " " && "w-3")}
        >
          {letter}
        </motion.span>
      ))}
    </span>
  );
}

type FancyParallaxCardProps = {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
};

export function FancyParallaxCard({
  children,
  className,
  intensity = 18,
}: FancyParallaxCardProps) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 120, damping: 12 });
  const springY = useSpring(rotateY, { stiffness: 120, damping: 12 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;

    rotateX.set(percentY * -intensity);
    rotateY.set(percentX * intensity);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      className={clsx(
        "relative h-full w-full rounded-3xl border border-white/10 bg-white/5 p-[1px] backdrop-blur-lg transition-shadow duration-300",
        "hover:shadow-[0_25px_45px_-20px_rgba(255,90,47,0.55)]",
        className,
      )}
      style={{
        rotateX: springX,
        rotateY: springY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-[rgba(10,10,10,0.75)]">
        {children}
      </div>
    </motion.div>
  );
}

type FancyParticleLayerProps = {
  className?: string;
  density?: number;
  seed?: number;
};

const ingredientPalette = [
  "🌶️",
  "🧄",
  "🍃",
  "🧈",
  "🍋",
  "🥬",
  "🍤",
  "🍣",
  "🍓",
];

const createSeededRandom = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

function generateParticles(density: number, seed: number) {
  const rand = createSeededRandom(seed);
  return Array.from({ length: density }).map((_, index) => {
    const delayRand = rand();
    const scaleRand = rand();
    return {
      id: `particle-${seed}-${index}`,
      emoji: ingredientPalette[index % ingredientPalette.length],
      top: `${rand() * 100}%`,
      left: `${rand() * 100}%`,
      delay: delayRand * 6,
      scale: 0.8 + scaleRand * 0.4,
      drift: 0.6 + rand() * 0.8,
    };
  });
}

export function FancyParticleLayer({ className, density = 10, seed = 1 }: FancyParticleLayerProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef<number>();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateOffsets = (event: MouseEvent) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const offsetX = ((event.clientX ?? width / 2) / width - 0.5) * 20;
      const offsetY = ((event.clientY ?? height / 2) / height - 0.5) * 20;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = requestAnimationFrame(() => setOffset({ x: offsetX, y: offsetY }));
    };

    updateOffsets({
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    } as MouseEvent);

    window.addEventListener("pointermove", updateOffsets);
    return () => {
      window.removeEventListener("pointermove", updateOffsets);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const particles = useMemo(() => generateParticles(density, seed), [density, seed]);

  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute select-none text-3xl text-white/70 sm:text-4xl md:text-5xl"
          style={{ top: particle.top, left: particle.left }}
          animate={{ x: offset.x * particle.drift, y: offset.y * particle.drift }}
          initial={{ opacity: 0, scale: particle.scale * 0.6 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 6,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        >
          {particle.emoji}
        </motion.span>
      ))}
    </div>
  );
}

type FancyPresenceProps = {
  show: boolean;
  children: React.ReactNode;
};

export function FancyPresence({ show, children }: FancyPresenceProps) {
  return <AnimatePresence mode="wait">{show && children}</AnimatePresence>;
}

export function FancySpotlight({
  className,
  size = 420,
  blur = 120,
}: {
  className?: string;
  size?: number;
  blur?: number;
}) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
    };

    pointerX.set(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
    pointerY.set(typeof window !== "undefined" ? window.innerHeight / 2 : 0);

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [pointerX, pointerY]);

  const spotlight = useMotionTemplate`radial-gradient(${size}px circle at ${pointerX}px ${pointerY}px, rgba(255, 145, 77, 0.55), transparent 75%)`;

  return (
    <motion.span
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-0 -z-10 opacity-60 blur-3xl mix-blend-screen",
        className,
      )}
      style={{
        backgroundImage: spotlight,
        filter: `blur(${blur}px)`,
      }}
    />
  );
}

