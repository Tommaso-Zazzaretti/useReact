import React from 'react';

function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {

    const timeoutRef = React.useRef<number|null>(null);

    const debouncedCallback = React.useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); }
        console.log('ciao')
        timeoutRef.current = window.setTimeout(() => { callback(...args);         console.log('ciao2');        }, delay);
    }, [callback, delay]);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}

export default useDebounce;