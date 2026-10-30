const CONDUIT_SIZES = {
  "1/2": { label: '1/2" EMT', deduct: 5, gain: 3, radius: 4 },
  "3/4": { label: '3/4" EMT', deduct: 6, gain: 4, radius: 4.5 },
  "1": { label: '1" EMT', deduct: 8, gain: 6, radius: 6 },
  "1-1/4": { label: '1-1/4" EMT', deduct: 11, gain: 8, radius: 8 },
  "1-1/2": { label: '1-1/2" EMT', deduct: 14, gain: 10, radius: 10 },
  "2": { label: '2" EMT', deduct: 16, gain: 12, radius: 12 },
};

const BEND_ANGLES = {
  10: { label: "10°", multiplier: 6, shrinkPerInch: 0.0625 },
  22.5: { label: "22.5°", multiplier: 2.6, shrinkPerInch: 0.1875 },
  30: { label: "30°", multiplier: 2, shrinkPerInch: 0.25 },
  45: { label: "45°", multiplier: 1.414, shrinkPerInch: 0.375 },
  60: { label: "60°", multiplier: 1, shrinkPerInch: 0.625 },
};

const CONDUIT_VIDEOS = [
  {
    id: "n7IWbGBDaJo",
    title: "EMT Conduit Bending Basics",
    channel: "Electrician U",
    topic: "fundamentals",
    description: "Core hand-bending technique, bender orientation, and your first 90° stub-up.",
  },
  {
    id: "Ymv7UmP4_JM",
    title: "How to Bend Offset Bends",
    channel: "Electrician U",
    topic: "offset",
    description: "Step-by-step offset bends using multipliers and shrink for parallel runs.",
  },
  {
    id: "CoFGJvxZg8s",
    title: "3-Point Saddle Bend",
    channel: "Electrician U",
    topic: "saddle",
    description: "Crossing obstructions with a 3-point saddle — mark, bend, and verify.",
  },
  {
    id: "r3h97SfQYYI",
    title: "4-Point Saddle Bend",
    channel: "Electrician U",
    topic: "saddle",
    description: "Larger obstacle clearance with a 4-point saddle configuration.",
  },
  {
    id: "wb99BPkHw08",
    title: "Back-to-Back 90° Bends",
    channel: "Electrician U",
    topic: "ninety",
    description: "Measuring and bending back-to-back 90s for precise box offsets.",
  },
  {
    id: "hu8WuQah6mc",
    title: "Conduit Bending for Beginners",
    channel: "Trade Training",
    topic: "fundamentals",
    description: "Apprentice-friendly walkthrough of bender parts, take-up, and field marks.",
  },
];