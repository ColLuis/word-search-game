import { useState, useCallback, useRef, useEffect } from 'react';
import { getSocket } from '../lib/socket.js';

export default function useWordBuilder(letters) {
  const [bankTiles, setBankTiles] = useState([]);
  const [builderTiles, setBuilderTiles] = useState([]);
  const debounceRef = useRef(null);

  // Reset when letters change
  useEffect(() => {
    const tiles = letters.map((letter, i) => ({ id: `tile-${i}`, letter }));
    setBankTiles(tiles);
    setBuilderTiles([]);
  }, [letters]);

  const currentWord = builderTiles.map((t) => t.letter).join('');

  // Debounced validation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (currentWord.length >= 3) {
      debounceRef.current = setTimeout(() => {
        getSocket().emit('word:validate', { word: currentWord });
      }, 300);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentWord]);

  const addToBuilder = useCallback((tileId) => {
    setBankTiles((prevBank) => {
      const tile = prevBank.find((t) => t.id === tileId);
      if (!tile) return prevBank;
      return prevBank.filter((t) => t.id !== tileId);
    });
    setBuilderTiles((prevBuilder) => {
      // Guard: don't add if already in builder
      if (prevBuilder.some((t) => t.id === tileId)) return prevBuilder;
      // We need the tile data — reconstruct from the id
      const idx = parseInt(tileId.replace('tile-', ''), 10);
      const letter = letters[idx];
      return [...prevBuilder, { id: tileId, letter }];
    });
    if (navigator.vibrate) navigator.vibrate(10);
  }, [letters]);

  const returnToBank = useCallback((tileId) => {
    setBuilderTiles((prevBuilder) => {
      if (!prevBuilder.some((t) => t.id === tileId)) return prevBuilder;
      return prevBuilder.filter((t) => t.id !== tileId);
    });
    setBankTiles((prevBank) => {
      // Guard: don't add if already in bank
      if (prevBank.some((t) => t.id === tileId)) return prevBank;
      const idx = parseInt(tileId.replace('tile-', ''), 10);
      const letter = letters[idx];
      return [...prevBank, { id: tileId, letter }];
    });
    if (navigator.vibrate) navigator.vibrate(10);
  }, [letters]);

  const clearBuilder = useCallback(() => {
    setBuilderTiles((prevBuilder) => {
      setBankTiles((prevBank) => {
        // Only add tiles not already in bank
        const bankIds = new Set(prevBank.map((t) => t.id));
        const toAdd = prevBuilder.filter((t) => !bankIds.has(t.id));
        return [...prevBank, ...toAdd];
      });
      return [];
    });
  }, []);

  const submitWord = useCallback(() => {
    const word = builderTiles.map((t) => t.letter).join('');
    getSocket().emit('word:submit', { word });
  }, [builderTiles]);

  const submitEmpty = useCallback(() => {
    getSocket().emit('word:submit', { word: '' });
  }, []);

  const shuffleBank = useCallback(() => {
    setBankTiles((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;

    if (over.id === 'builder-drop-zone') {
      addToBuilder(activeId);
    }

    if (over.id === 'bank-drop-zone') {
      returnToBank(activeId);
    }
  }, [addToBuilder, returnToBank]);

  return {
    bankTiles,
    builderTiles,
    currentWord,
    addToBuilder,
    returnToBank,
    clearBuilder,
    submitWord,
    submitEmpty,
    shuffleBank,
    handleDragEnd,
  };
}
