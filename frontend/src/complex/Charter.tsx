import React, { useRef, useMemo, MutableRefObject } from "react";
import Grid from "src/elements/Grid";
import DynamicChart from "src/elements/DynamicChart";
import { mergeArray, calculateDeltaDays } from "src/utils";

const DAYS = 50
type Timeframe = string;

interface Calculator {
    sl: number;
    tp: number;
}

interface Symbol {
    name: string;
    digits: number;
    ask: number;
    bid: number;
}

interface Rates {
    instrument?: string;
    data?: Record<Timeframe, { time: number }[]>;
}

async function fetchRates(
    timeframes: Record<Timeframe, number>,
    currentTime: number,
    instrument: string,
    rates: Rates,
    updateRatesHandler: (mergedData: any) => void
): Promise<void> {
    const promises = Object.entries(timeframes).map(async ([timeframe, duration]) => {
        let start = currentTime - duration;
        const end = currentTime;
        if (rates.instrument === instrument && rates.data?.[timeframe]?.length > 0) {
            start = rates.data[timeframe][rates.data[timeframe].length - 1].time;
        }
        const response = await fetch(
            `/api/rates?instrument=${encodeURIComponent(instrument)}&start=${start}&end=${end}&timeframe=${timeframe}`
        );
        return response.json();
    });
    const receivedRatesData = await Promise.all(promises);
    const mergedData = mergeArray(receivedRatesData);
    updateRatesHandler(mergedData);
}

function createTimeframeConfig(timeframes: Timeframe[]): Record<Timeframe, number> {
    return timeframes.reduce((config, timeframe) => {
        config[timeframe] = calculateDeltaDays(DAYS);
        return config;
    }, {} as Record<Timeframe, number>);
}

interface CharterProps {
    calculator: Calculator;
    openPositions: { [key: string]: any[][] };
    closedPositions: { [key: string]: any[][] };
    symbol: Symbol;
    currentTime: number;
    timeframes: Timeframe[];
}

const Charter: React.FC<CharterProps> = ({ calculator, symbol, openPositions, closedPositions, currentTime, timeframes }) => {
    const config = useMemo(() => createTimeframeConfig(timeframes), []);
    const refCharts = useRef<MutableRefObject<any>[]>(Object.entries(config).map(() => React.createRef()));
    const localSymbol = useRef(symbol);
    const localCalculator = useRef(calculator);
    const localRates = useRef<Rates>({});

    if (symbol !== localSymbol.current) {
        if (symbol.name !== localSymbol.current.name) {
            refCharts.current.forEach((reference, _index) => {
                reference.current?.resetData(symbol.digits);
            });
        }

        localSymbol.current = symbol;
        fetchRates(config, currentTime, localSymbol.current.name, localRates.current, updateRates);
    
    }

    if (calculator && localCalculator.current !== calculator) {
        localCalculator.current = calculator;
        refCharts.current.forEach((reference, _index) => {
            if (reference.current) {
                reference.current.updateLines(localCalculator.current.sl, localCalculator.current.tp);
            }
        });
    }

    function updateRates(newRates: any) {
        localRates.current = newRates;
        Object.keys(config).forEach((timeframe, index) => {
            refCharts.current[index]?.current?.updateData(
                localRates.current.data?.[timeframe as Timeframe],
                localSymbol.current.ask,
                localSymbol.current.bid
            );

            refCharts.current[index]?.current?.updatePositions(openPositions[symbol.name], closedPositions[symbol.name]);
        });
    }

    /* Memoize chart components to prevent unnecessary re-renders */
    const charts = useMemo(() => (
        Object.keys(config).map((timeframe, index) => (
            <DynamicChart ref={refCharts.current[index]} title={timeframe} key={timeframe} />
        ))
    ), [refCharts, config]);

    return <Grid items={charts} />;
};

export default Charter;
