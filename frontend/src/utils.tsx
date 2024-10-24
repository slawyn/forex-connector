const millisecondsInSecond = 1000;
const secondsInMinute = 60;
const minutesInHour = 60;
const hoursInDay = 24;

const deltaTable = {
    D1: millisecondsInSecond * secondsInMinute * minutesInHour * hoursInDay,
    H4: millisecondsInSecond * secondsInMinute * minutesInHour * 4,
    M20: millisecondsInSecond * secondsInMinute * 20,
    M6: millisecondsInSecond * secondsInMinute * 6,
    M5: millisecondsInSecond * secondsInMinute * 5,
    M1: millisecondsInSecond * secondsInMinute,
};

export function calculateDeltas(timeframe: keyof typeof deltaTable, bars: number): number {
    return deltaTable[timeframe] * bars;
}

export function mergeArray(array: Record<string, any>[]): Record<string, any> {
    return array.reduce((merged, dictionary) => mergeDict(merged, dictionary), {});
}

export function mergeDict(previous: Record<string, any>, next: Record<string, any>): Record<string, any> {
    for (const [key, value] of Object.entries(next)) {
        if (key in previous && typeof value === 'object' && value !== null) {
            previous[key] = mergeDict(previous[key], value);
        } else {
            previous[key] = value;
        }
    }
    return previous;
}

export function createPostRequest(body: Record<string, any>): RequestInit {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer my-token',
        },
        body: JSON.stringify(body), // Ensure body is a string
    };
}