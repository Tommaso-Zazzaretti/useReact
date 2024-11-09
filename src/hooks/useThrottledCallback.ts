import React from 'react';

const useThrottledCallback = <T extends (...args: Array<unknown>) => void>(callback: T, delay: number) => {

    const callbackRef = React.useRef<T>(callback);
    const lastCalled  = React.useRef<number>(0);

    // [1] Update callback Ref onChange
    React.useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // [2] Define the exposed callback 
    const throttledCallback = React.useCallback((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCalled.current >= delay) {
            callbackRef.current(...args);
            lastCalled.current = now;
        }
    }, [delay]);

    return throttledCallback;
};

export default useThrottledCallback;