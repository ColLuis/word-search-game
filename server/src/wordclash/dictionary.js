import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULTS } from './constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEnd = true;
  }

  lookup(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) return false;
      node = node.children[ch];
    }
    return node.isEnd;
  }
}

let trie = null;
let commonWords = null;

export async function initDictionary() {
  trie = new Trie();
  const filePath = path.join(__dirname, '../../data/words_alpha.txt');
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  let count = 0;

  for (const line of lines) {
    const word = line.trim().toUpperCase();
    if (word.length >= DEFAULTS.MIN_WORD_LENGTH && word.length <= DEFAULTS.MAX_WORD_LENGTH) {
      trie.insert(word);
      count++;
    }
  }

  // Load common words for filtering best-word suggestions
  commonWords = new Set();
  const commonPath = path.join(__dirname, '../../data/common_words.txt');
  const commonContent = readFileSync(commonPath, 'utf-8');
  for (const line of commonContent.split(/\r?\n/)) {
    const word = line.trim().toUpperCase();
    if (word.length >= DEFAULTS.MIN_WORD_LENGTH && word.length <= DEFAULTS.MAX_WORD_LENGTH) {
      commonWords.add(word);
    }
  }

  console.log(`[WordClash] Dictionary loaded: ${count} words, ${commonWords.size} common words`);
}

export function isValidWord(word) {
  if (!trie) return false;
  return trie.lookup(word.toUpperCase());
}

export function canFormLongWord(letters) {
  if (!trie) return false;
  const available = {};
  for (const l of letters) {
    available[l] = (available[l] || 0) + 1;
  }
  return dfs(trie.root, available, 0, 7);
}

function dfs(node, available, depth, target) {
  if (depth >= target && node.isEnd) return true;
  for (const ch in node.children) {
    if (available[ch] && available[ch] > 0) {
      available[ch]--;
      if (dfs(node.children[ch], available, depth + 1, target)) {
        available[ch]++;
        return true;
      }
      available[ch]++;
    }
  }
  return false;
}

export function findBestWords(letters, topN = 5) {
  if (!trie) return [];
  const available = {};
  for (const l of letters) {
    available[l] = (available[l] || 0) + 1;
  }
  const found = [];
  collectWords(trie.root, available, '', found);
  // Filter to common words only, then sort by length desc
  const common = found.filter((w) => commonWords && commonWords.has(w));
  common.sort((a, b) => b.length - a.length || a.localeCompare(b));
  return common.slice(0, topN);
}

function collectWords(node, available, prefix, results) {
  if (node.isEnd && prefix.length >= 3) {
    results.push(prefix);
  }
  for (const ch in node.children) {
    if (available[ch] && available[ch] > 0) {
      available[ch]--;
      collectWords(node.children[ch], available, prefix + ch, results);
      available[ch]++;
    }
  }
}
