import React, { useRef, useMemo, MutableRefObject } from "react";
import Grid from "src/elements/Grid";
import DynamicChart from "src/tabs/DynamicChart";
import { mergeArray, calculateDeltas } from "src/utils";

const TIMEFRAMES = ["D1", "H4", "M6"] as const;

type Timeframe = typeof TIMEFRAMES[number];

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
    timeoffset: number,
    instrument: string,
    rates: Rates,
    updateRatesHandler: (mergedData: any) => void
): Promise<void> {
    const currentTime = Date.now() + timeoffset;
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
        config[timeframe] = calculateDeltas(timeframe, 100);
        return config;
    }, {} as Record<Timeframe, number>);
}

interface CharterProps {
    calculator: Calculator;
    symbol: Symbol;
    timeoffset: number;
}

const Charter: React.FC<CharterProps> = ({ calculator, symbol, timeoffset }) => {
    const config = useMemo(() => createTimeframeConfig(TIMEFRAMES), []);
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
        fetchRates(config, timeoffset, localSymbol.current.name, localRates.current, updateRates);
    }

    if (calculator && localCalculator.current !== calculator) {
        localCalculator.current = calculator;
        refCharts.current.forEach((reference, _index) => {
            if (reference.current) {
                reference.current.updateMarkers(localCalculator.current.sl, localCalculator.current.tp);
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

// Charter.whyDidYouRender = true
export default Charter;
