import React from 'react';

function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {

    const timerId = React.useRef<number|null>(null);

    const debouncedCallback = React.useCallback((...args: Parameters<T>) => {
        if (timerId.current) { window.clearTimeout(timerId.current); }
        timerId.current = window.setTimeout(() => { callback(...args); }, delay);
    }, [callback, delay]);

    React.useEffect(() => {
        return () => {
            if (timerId.current) {
                clearTimeout(timerId.current);
            }
        };
    }, []);

    return debouncedCallback;
}

export default useDebouncedCallback;