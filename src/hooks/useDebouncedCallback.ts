import React from 'react';

const useDebouncedCallback = <T extends (...args: Array<unknown>) => void>(callback: T, delay: number) => {

    const callbackRef = React.useRef<T>(callback);
    const timerId = React.useRef<number|null>(null);

    // [1] Update callback Ref onChange
    React.useEffect(() => { 
        callbackRef.current = callback; 
    }, [callback]);

    // [2] Define the exposed callback 
    const debouncedCallback = React.useCallback((...args: Parameters<T>) => {
        if (timerId.current) {
            clearTimeout(timerId.current);
        }
        timerId.current = window.setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);

    // Stop pending timer during unmount
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