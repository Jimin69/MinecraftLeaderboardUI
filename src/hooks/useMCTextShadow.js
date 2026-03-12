import { useEffect } from 'react';

export function useMCTextShadow(rootRef) {
  useEffect(() => {
    const sync = (el) => {
      el.setAttribute('data-text', el.textContent);
    };

    const attach = (container) => {
      container.querySelectorAll('p').forEach(sync);
    };

    // Initial pass
    const root = rootRef?.current ?? document.body;
    attach(root);

    // Keep in sync when text content or new nodes appear
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'characterData' && m.target.parentElement?.tagName === 'P') {
          sync(m.target.parentElement);
        }
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.tagName === 'P') sync(node);
              else node.querySelectorAll?.('p').forEach(sync);
            }
          });
        }
      });
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [rootRef]);
}