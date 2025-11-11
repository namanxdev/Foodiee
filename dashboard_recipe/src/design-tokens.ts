export const foodieePalette = {
  primary: "#FF5A2F",
  primaryBright: "#FF7A45",
  secondary: "#FFD07F",
  charcoal: "#1E1E1E",
  cream: "#FCEFE5",
  light: "#FFFFFF",
  ember: "#FF914D",
  emberDeep: "#E83B1F",
  accentShadow: "rgba(255, 90, 47, 0.35)",
};

export const foodieeGradients = {
  hero: "linear-gradient(135deg, #FF5A2F 0%, #FF7A3B 25%, #FF914D 60%, #FFB478 100%)",
  emberGlow: "radial-gradient(circle at 20% 20%, rgba(255, 208, 127, 0.45), rgba(255, 90, 47, 0.08) 50%, rgba(30, 30, 30, 0.92) 100%)",
  charcoalGlass:
    "linear-gradient(120deg, rgba(30, 30, 30, 0.82) 0%, rgba(30, 30, 30, 0.45) 42%, rgba(255, 90, 47, 0.18) 100%)",
};

export const motionTiming = {
  default: {
    type: "spring",
    stiffness: 120,
    damping: 18,
  },
  soft: {
    ease: "easeOutCubic",
    duration: 0.65,
  },
  quick: {
    ease: "easeOut",
    duration: 0.35,
  },
} as const;

export const foodieeTypography = {
  display: "Playfair Display, 'Times New Roman', serif",
  sans: "Inter, 'Outfit', sans-serif",
};

