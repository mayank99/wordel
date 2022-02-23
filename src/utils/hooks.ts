import { Context } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';

export const useTheme = () => {
  const [theme, setTheme] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
      setTheme(matches ? 'dark' : 'light');
    });
  }, []);

  return theme;
};

export const useStoredState = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    let saved: string | null = '';
    try {
      saved = localStorage.getItem(key);
    } catch (e) {
      console.error(e);
    }
    return saved ? JSON.parse(saved) : defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  }, [key, value]);

  return [value, setValue] as const;
};

export const useSafeContext = <T>(context: Context<T>) => {
  const value = useContext(context);
  if (value == undefined) {
    throw new Error(`${context.displayName} must be used inside ${context.displayName}.Provider`);
  }
  return value!; // this cannot be undefined, so we can destructure from it
};
