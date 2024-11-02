import { createPostRequest } from "src/utils";


export interface HistoryData {
    [key: string]: any[][];
}

export function transformHistoryData(data: HistoryData): any[][] {
    let transformed: any[][] = [];
    for (const values of Object.values(data)) {
        transformed.push(...values);
    }
    return transformed;
}


export default class Api {
    async fetchHistory(): Promise<HistoryData> {
        const result = await fetch("/api/history")
                .then((response) => response.json())
                .then((a) => a);
        return result;
    }

    async fetchHeaders(): Promise<any[][]> {
        const result = await fetch("/api/headers")
                .then((response) => response.json())
                .then((a) => a);
        return result;
    }

    async saveHistory(): Promise<void> {
        const requestOptions = createPostRequest({});
        const result = await fetch('/api/save', requestOptions)
            .then(response => response.json())
            .then((a) => a);
        return result
    }
}
