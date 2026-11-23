import type { KitMotion } from "../../kit/motion.js";

const requestBubbleFrame = 2;
const typingStartFrame = 8;
const sendDelayFrames = 4;
const answerDelayFrames = 9;
const dotsFrames = 14;
const shortestTypingSeconds = 0.5;
const longestTypingSeconds = 1.4;
const charactersEachSecond = 30;
const longestWordsSeconds = 0.9;
const wordEachSeconds = 0.06;

export interface ChatTiming {
  requestBubble: number;
  typingStart: number;
  charactersPerSecond: number;
  sent: number;
  answerBubble: number;
  answerWords: number;
  wordEachSeconds: number;
}

export function chatTimingOf(options: {
  motion: KitMotion;
  request: string;
  answer: string;
}): ChatTiming {
  const { motion } = options;
  const characters = Array.from(options.request).length;
  const typingSeconds = Math.min(
    longestTypingSeconds,
    Math.max(shortestTypingSeconds, characters / charactersEachSecond),
  );
  const typingStart = motion.framesOf(typingStartFrame);
  const typingEnd = typingStart + typingSeconds * motion.framesPerSecond;
  const answerBubble = typingEnd + motion.framesOf(answerDelayFrames);
  const wordCount = Math.max(1, options.answer.split(/\s+/).length);
  return {
    requestBubble: motion.framesOf(requestBubbleFrame),
    typingStart,
    charactersPerSecond: Math.max(1, characters) / typingSeconds,
    sent: typingEnd + motion.framesOf(sendDelayFrames),
    answerBubble,
    answerWords: answerBubble + motion.framesOf(dotsFrames),
    wordEachSeconds: Math.min(wordEachSeconds, longestWordsSeconds / wordCount),
  };
}
