import React from 'react';
import { EmojiProvider as AppleEmojiProvider } from 'react-apple-emojis';
import emojiData from 'react-apple-emojis/src/data.json';

interface EmojiProviderProps {
  children: React.ReactNode;
}

export function EmojiProvider({ children }: EmojiProviderProps) {
  return (
    <AppleEmojiProvider data={emojiData}>
      {children}
    </AppleEmojiProvider>
  );
}
