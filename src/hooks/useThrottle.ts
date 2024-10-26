export const useThrottle = <TParams extends (...args: any) => TReturn,TReturn>(callback:(...args: Parameters<TParams>)=>TReturn,limit:number) => {
    let lastFunc: ReturnType<typeof setTimeout>;
    let lastRan: number;

    return function (...args: Parameters<TParams>) {
        if (!lastRan) {
            callback(...args); 
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if (Date.now() - lastRan >= limit) {
                    callback(...args); 
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}