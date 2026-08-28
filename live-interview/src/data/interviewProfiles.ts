import { InterviewerProfile, RubricStage } from "../types";

export const INTERVIEWER_PROFILES: InterviewerProfile[] = [
  {
    name: "Sarah Jenkins",
    role: "Staff Software Engineer & Hiring Lead",
    company: "Google Cloud",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    voice: "Zephyr",
    personality: "Articulate, encouraging, and deeply technical with a focus on scalable architecture and problem decomposition.",
    accentColor: "#1a73e8",
  },
  {
    name: "Alex Rivera",
    role: "Engineering Director & Systems Architect",
    company: "Google Core Infrastructure",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    voice: "Kore",
    personality: "Sharp, insightful, and pragmatic. Values clean code, concurrency, and trade-off analysis.",
    accentColor: "#0d904f",
  },
  {
    name: "Maya Lin",
    role: "Head of Technical Talent & Leadership",
    company: "Google People Operations",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
    voice: "Aoede",
    personality: "Warm, perceptive, and focused on behavioral STAR stories, cross-functional leadership, and culture add.",
    accentColor: "#9334e6",
  },
  {
    name: "David Chen",
    role: "Principal AI & Distributed Systems Engineer",
    company: "Google DeepMind",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    voice: "Puck",
    personality: "High-energy, curious, and explores edge cases, algorithmic efficiency, and low-latency systems.",
    accentColor: "#ea4335",
  },
  {
    name: "Marcus Vance",
    role: "Senior Staff Frontend Architect",
    company: "Google Workspace",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    voice: "Fenrir",
    personality: "Calm, structured, and passionate about state management, web performance, and responsive UI engineering.",
    accentColor: "#f9ab00",
  },
];

export const DEFAULT_CODING_CHALLENGES = [
  {
    title: "LRU Cache Implementation",
    difficulty: "Medium",
    category: "Data Structures",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with get(key) and put(key, value) operations in O(1) time complexity.",
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
      // evict least recently used (first key in map iterator)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Test case
const lru = new LRUCache(2);
lru.put(1, 1);
lru.put(2, 2);
console.log("get(1):", lru.get(1)); // returns 1
lru.put(3, 3); // evicts key 2
console.log("get(2):", lru.get(2)); // returns -1 (not found)
lru.put(4, 4); // evicts key 1
console.log("get(1):", lru.get(1)); // returns -1 (not found)
console.log("get(3):", lru.get(3)); // returns 3
console.log("get(4):", lru.get(4)); // returns 4
`,
  },
  {
    title: "Rate Limiter (Token Bucket Algorithm)",
    difficulty: "Hard",
    category: "System Design & Concurrency",
    description: "Implement a token bucket rate limiter in JavaScript/TypeScript that allows up to `capacity` requests and refills `refillRate` tokens per second.",
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
    title: "Find Median from Data Stream",
    difficulty: "Hard",
    category: "Heap / Algorithms",
    description: "The median is the middle value in an ordered integer list. Design a data structure that supports adding numbers from a stream and finding the current median.",
    starterCode: `class MedianFinder {
  constructor() {
    this.numbers = [];
  }

  addNum(num) {
    // Binary insert to keep sorted
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
    if (n % 2 === 1) {
      return this.numbers[mid];
    }
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

export const INITIAL_RUBRIC_STAGES: RubricStage[] = [
  {
    id: "stage-1",
    title: "1. Introductions & Warm-up",
    targetMinutes: 5,
    description: "Interviewer welcomes candidate, aligns on expectations, and discusses candidate's recent background and standout projects.",
    completed: false,
  },
  {
    id: "stage-2",
    title: "2. Technical Problem Framing & Clarification",
    targetMinutes: 10,
    description: "Presents core scenario/problem. Candidate asks clarifying questions, discusses edge cases, and outlines high-level approach.",
    completed: false,
  },
  {
    id: "stage-3",
    title: "3. Live Implementation / Architecture",
    targetMinutes: 20,
    description: "Candidate writes code in IDE or diagrams architecture on Whiteboard while articulating trade-offs aloud.",
    completed: false,
  },
  {
    id: "stage-4",
    title: "4. Optimization, Scale & Edge Cases",
    targetMinutes: 10,
    description: "Interviewer challenges solution with scale limits, failure modes, caching, concurrency, and time/space complexity analysis.",
    completed: false,
  },
  {
    id: "stage-5",
    title: "5. Candidate Q&A & Wrap Up",
    targetMinutes: 5,
    description: "Candidate asks questions about team culture, technical roadmap, engineering practices, and next steps.",
    completed: false,
  },
];
