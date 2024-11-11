const millisecondsInSecond = 1000;
const secondsInMinute = 60;
const minutesInHour = 60;
const hoursInDay = 24;

const deltaTable = {
    D1: millisecondsInSecond * secondsInMinute * minutesInHour * hoursInDay,
    H4: millisecondsInSecond * secondsInMinute * minutesInHour * 4,
    H1: millisecondsInSecond * secondsInMinute * minutesInHour * 1,
    M30: millisecondsInSecond * secondsInMinute * 30,
    M20: millisecondsInSecond * secondsInMinute * 20,
    M15: millisecondsInSecond * secondsInMinute * 15,
    M10: millisecondsInSecond * secondsInMinute * 10,
    M6: millisecondsInSecond * secondsInMinute * 6,
    M5: millisecondsInSecond * secondsInMinute * 5,
    M1: millisecondsInSecond * secondsInMinute,
};

export type Timeframe =  keyof typeof deltaTable;
export function calculateDeltaBars(timeframe: keyof typeof deltaTable, bars: number): number {
    return deltaTable[timeframe] * bars;
}

export function calculateDeltaDays(days: number): number {
    return deltaTable["D1"] * days;
}

export function calculateDeltaSeconds(timeframe: keyof typeof deltaTable): number {
    return deltaTable[timeframe]/1000;
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

export function randomIntFromInterval(min:number, max:number) { 
    return Math.floor(Math.random() * (max - min + 1) + min);
}