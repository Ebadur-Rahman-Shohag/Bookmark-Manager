import { useCallback, useState } from 'react';

export const useLocalStorageBoolean = (key, defaultValue = false) => {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  });

  const update = useCallback(
    (next) => {
      setValue(next);
      localStorage.setItem(key, next ? 'true' : 'false');
    },
    [key]
  );

  return [value, update];
};
