import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocalStorageBoolean } from './useLocalStorageBoolean.js';

// Slightly longer than the 0.42s height transition in style.css.
const TRANSITION_FALLBACK_MS = 600;

/** Runs `callback` once the height transition ends, or after a timeout if `transitionend` never fires. */
const onHeightTransitionEnd = (body, callback) => {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    body.removeEventListener('transitionend', onEnd);
    callback();
  };
  const onEnd = (e) => {
    if (e.target === body && e.propertyName === 'height') finish();
  };
  const timer = setTimeout(finish, TRANSITION_FALLBACK_MS);
  body.addEventListener('transitionend', onEnd);
};

/**
 * `datasetKey` is the `<html data-*>` flag set by the pre-paint script in index.html;
 * it is removed once React has applied the collapsed state itself.
 */
export const useCollapsible = ({ storageKey, datasetKey }) => {
  const [collapsed, setCollapsed] = useLocalStorageBoolean(storageKey);
  const bodyRef = useRef(null);
  const innerRef = useRef(null);
  const animatingRef = useRef(false);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body) {
      body.style.height = collapsed ? '0px' : 'auto';
      body.style.overflow = collapsed ? 'hidden' : '';
    }
    delete document.documentElement.dataset[datasetKey];
    // Only the initial state is applied here; later changes are animated by `toggle`.
  }, [datasetKey]);

  const animate = useCallback((toCollapsed) => {
    const body = bodyRef.current;
    const inner = innerRef.current;
    if (!body || !inner) return;

    animatingRef.current = true;
    body.classList.add('is-animating');
    body.style.overflow = 'hidden';

    const finish = () => {
      animatingRef.current = false;
      body.classList.remove('is-animating');
      if (!toCollapsed) {
        body.style.height = 'auto';
        body.style.overflow = '';
      }
    };

    if (toCollapsed) {
      body.style.height = `${body.scrollHeight}px`;
      body.offsetHeight;
      body.style.height = '0px';
    } else {
      body.style.height = '0px';
      body.offsetHeight;
      body.style.height = `${inner.scrollHeight}px`;
    }
    onHeightTransitionEnd(body, finish);
  }, []);

  const toggle = useCallback(() => {
    if (animatingRef.current) return;
    const next = !collapsed;
    setCollapsed(next);
    requestAnimationFrame(() => animate(next));
  }, [collapsed, setCollapsed, animate]);

  return { collapsed, toggle, bodyRef, innerRef };
};
