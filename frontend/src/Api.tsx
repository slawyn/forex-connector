import { createPostRequest } from "src/utils";


export interface HistoryData {
    [key: string]: any[][];
}

export interface TradeData {
    error: number;
    text: string
}
export type RatesData = any;

export interface SymbolData {
    name: string;
    step: number;
    volume_step: number;
    point_value: number;
    contract_size: number;
    digits: number;
    tick_size: number;
    tick_value: number;
    conversion: boolean;
}

export interface TerminalData {
    date:string;
    timeoffset:number;
    account:any;
    instruments:any;
    updates:any;
    openPositions:HistoryData;
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
    
    async fetchTimeOffset(): Promise<any[][]> {
        const result = await fetch("/api/timeoffset")
            .then((response) => response.json())
            .then((a) => a);
        return result;
    }

    async fetchSymbolData(instrument: string): Promise<SymbolData> {
        const result = await fetch(`/api/symbol?instrument=${encodeURIComponent(instrument)}`)
            .then((response) => response.json())
            .then((receivedSymbol) => receivedSymbol);

        return result
    }

    async fetchTerminalData(force: boolean, end:number): Promise<TerminalData> {
        const result = await fetch(`/api/update?force=${force}&end=${end}`)
            .then((response) => response.json())
            .then((receivedSymbol) => receivedSymbol);

        return result
    }

    async fetchRateData(instrument: string, start:number, end:number, timeframe:string): Promise<RateData> {
        const result = await fetch(`/api/rates?instrument=${encodeURIComponent(instrument)}&start=${start}&end=${end}&timeframe=${timeframe}`)
            .then((response) => response.json())
            .then((receivedSymbol) => receivedSymbol);

        return result
    }

    async postSaveHistory(): Promise<void> {
        const result = await fetch('/api/save', createPostRequest({}))
            .then(response => response.json())
            .then((a) => a);
        return result
    }

    async postTrade(request: any): Promise<TradeData> {
        const result = await fetch('/api/trade', createPostRequest(request))
            .then(response => response.json())
            .then((a) => a);
        return result
    }

    async postCommand(command: any): Promise<void> {
        await fetch('/api/command', createPostRequest(command))
            .then(response => response.json())
            .then((a) => a);
    }

    
    async postBacktest(backterConfig: any) {
        await fetch('/api/backtesting', createPostRequest(backterConfig))
            .then(response => response.json())
            .then((a) => a);
    }
}
