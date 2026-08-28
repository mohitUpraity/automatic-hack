/**
 * AI HR Interviewer Personas, Coding Challenges, and Agenda Rubrics
 */

export const INTERVIEWER_PROFILES = [
  {
    id: "sarah",
    name: "Dr. Elena Vance",
    role: "Lead Bar-Raiser & Staff Systems Architect",
    company: "Google Cloud",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    voice: "Zephyr",
    personality: "Deeply technical, warm, structured, with sharp focus on scalable architecture and engineering trade-offs.",
    accentColor: "#3b82f6",
  },
  {
    id: "alex",
    name: "Alex Rivera",
    role: "Director of Engineering & Systems Infrastructure",
    company: "Google Core Systems",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    voice: "Kore",
    personality: "Pragmatic, sharp, and values clean code, concurrency, and distributed fault tolerance.",
    accentColor: "#10b981",
  },
  {
    id: "maya",
    name: "Maya Lin",
    role: "Head of Talent & Engineering Leadership",
    company: "Google People Operations",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    voice: "Aoede",
    personality: "Warm, perceptive, focusing on behavioral STAR stories, leadership, and culture add.",
    accentColor: "#a855f7",
  },
  {
    id: "david",
    name: "David Chen",
    role: "Principal AI & Systems Engineer",
    company: "Google DeepMind",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    voice: "Puck",
    personality: "High-energy, curious, exploring edge cases, algorithmic efficiency, and low-latency systems.",
    accentColor: "#ef4444",
  },
  {
    id: "marcus",
    name: "Marcus Vance",
    role: "Staff Frontend & Platform Architect",
    company: "Google Workspace",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    voice: "Fenrir",
    personality: "Calm, structured, passionate about reactive state management, web performance, and UX architecture.",
    accentColor: "#f59e0b",
  },
];

export const DEFAULT_CODING_CHALLENGES = [
  {
    id: "lru-cache",
    title: "LRU Cache Implementation",
    difficulty: "Medium",
    category: "Data Structures",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with get(key) and put(key, value) in O(1) time complexity.",
    starterCode: `class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Verification Test Case
const lru = new LRUCache(2);
lru.put(1, 1);
lru.put(2, 2);
console.log("get(1):", lru.get(1)); // returns 1
lru.put(3, 3); // evicts key 2
console.log("get(2):", lru.get(2)); // returns -1
lru.put(4, 4); // evicts key 1
console.log("get(1):", lru.get(1)); // returns -1
console.log("get(3):", lru.get(3)); // returns 3
console.log("get(4):", lru.get(4)); // returns 4
`,
  },
  {
    id: "rate-limiter",
    title: "Token Bucket Rate Limiter",
    difficulty: "Hard",
    category: "Concurrency & Systems",
    description: "Implement a token bucket rate limiter in JavaScript/TypeScript that allows up to \`capacity\` requests and refills \`refillRate\` tokens per second.",
    starterCode: `class TokenBucketRateLimiter {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefillTimestamp = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsedTimeSec = (now - this.lastRefillTimestamp) / 1000;
    const tokensToAdd = elapsedTimeSec * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTimestamp = now;
  }

  allowRequest(tokensRequired = 1) {
    this.refill();
    if (this.tokens >= tokensRequired) {
      this.tokens -= tokensRequired;
      return true;
    }
    return false;
  }
}

const limiter = new TokenBucketRateLimiter(5, 2);
console.log("Req 1 (allowed):", limiter.allowRequest());
console.log("Req 2 (allowed):", limiter.allowRequest());
console.log("Remaining tokens:", limiter.tokens.toFixed(2));
`,
  },
  {
    id: "median-stream",
    title: "Find Median from Data Stream",
    difficulty: "Hard",
    category: "Algorithms & Heaps",
    description: "Design a data structure that supports adding integer numbers from a continuous stream and computing the running median in O(log N).",
    starterCode: `class MedianFinder {
  constructor() {
    this.numbers = [];
  }

  addNum(num) {
    let low = 0;
    let high = this.numbers.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (this.numbers[mid] < num) low = mid + 1;
      else high = mid;
    }
    this.numbers.splice(low, 0, num);
  }

  findMedian() {
    const n = this.numbers.length;
    if (n === 0) return 0;
    const mid = Math.floor(n / 2);
    if (n % 2 === 1) return this.numbers[mid];
    return (this.numbers[mid - 1] + this.numbers[mid]) / 2;
  }
}

const mf = new MedianFinder();
mf.addNum(1);
mf.addNum(2);
console.log("Median [1, 2]:", mf.findMedian()); // 1.5
mf.addNum(3);
console.log("Median [1, 2, 3]:", mf.findMedian()); // 2
`,
  }
];

export const INITIAL_RUBRIC_STAGES = [
  {
    id: "stage-1",
    title: "1. Introductions & Warm-up",
    targetMinutes: 5,
    description: "Interviewer welcomes candidate, aligns on expectations, and explores background and key technical highlights.",
    completed: false,
  },
  {
    id: "stage-2",
    title: "2. Technical Problem Framing & Scoping",
    targetMinutes: 10,
    description: "Candidate clarifies requirements, outlines failure modes, and discusses architectural trade-offs.",
    completed: false,
  },
  {
    id: "stage-3",
    title: "3. Live Implementation & Architecture",
    targetMinutes: 20,
    description: "Candidate writes code in IDE or draws system design diagram while articulating reasoning out loud.",
    completed: false,
  },
  {
    id: "stage-4",
    title: "4. Scale Limits, Bottlenecks & Caching",
    targetMinutes: 10,
    description: "Interviewer probes scalability limits, data consistency, caching layers, and high-concurrency fault tolerance.",
    completed: false,
  },
  {
    id: "stage-5",
    title: "5. Candidate Q&A & Wrap Up",
    targetMinutes: 5,
    description: "Candidate asks probing questions about team roadmap, architecture philosophy, and next steps.",
    completed: false,
  },
];
