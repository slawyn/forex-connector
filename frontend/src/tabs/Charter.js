import React, { useRef, useMemo, useEffect } from "react";
import Grid from "./elements/Grid";
import DynamicChart from "./DynamicChart";
import { mergeArray, calculateDeltas } from "../utils";

async function fetchRates(timeframes, instrument, rates, updateRatesHandler) {
    const currentTime = Date.now();
    const promises = Object.entries(timeframes).map(async ([timeframe, duration]) => {
        let start = currentTime - duration;
        const end = currentTime;

        if (rates.instrument === instrument && rates.data?.[timeframe]?.length > 0) {
            start = rates.data[timeframe][rates.data[timeframe].length - 1].time;
        }

        const response = await fetch(
            `/rates?instrument=${encodeURIComponent(instrument)}&start=${start}&end=${end}&timeframe=${timeframe}`
        );
        return response.json();
    });

    const receivedRatesData = await Promise.all(promises);
    const mergedData = mergeArray(receivedRatesData);
    updateRatesHandler(mergedData);
}

function createTimeframeConfig(timeframes) {
    return timeframes.reduce((config, timeframe) => {
        config[timeframe] = calculateDeltas(timeframe, 60);
        return config;
    }, {});
}

const Charter = ({ calculator, symbol, instrument }) => {
    const TIMEFRAMES = ["D1", "H4", "M20", "M5"]
    const CONFIG = createTimeframeConfig(TIMEFRAMES);
    const chartRefs = useRef(Object.entries(CONFIG).map(() => React.createRef()));
    const localSymbol = useRef({ digits: 0, ask: 0, bid: 0 });
    const rates = useRef({});
    const localCalculator = useRef({ sl: [], tp: [] });


    if (symbol !== localSymbol.current) {

        if (symbol.name !== localSymbol.current.name) {
            chartRefs.current.forEach((reference, _index) => { reference.current?.resetData(symbol.digits) })
        }

        localSymbol.current = symbol
        updateRates()
    }

    if (localCalculator.current !== calculator) {
        localCalculator.current = calculator
        chartRefs.current.forEach((reference, _index) => {
            if (reference.current) {
                reference.current.updateMarkers(localCalculator.current.sl, localCalculator.current.tp)
            }
        })
    }

    function updateRates() {
        fetchRates(CONFIG, localSymbol.current.name, rates.current, (newRates) => {
            rates.current = newRates;
            chartRefs.current.forEach((ref, index) => {
                const timeframe = TIMEFRAMES[index];
                ref.current?.updateData(rates.current.data?.[timeframe], localSymbol.current.ask, localSymbol.current.bid);
            });
        });
    }

    /* Memoize chart components to prevent unnecessary re-renders */
    const charts = useMemo(() => (
        chartRefs.current.map((ref, index) => (
            <DynamicChart ref={ref} title={TIMEFRAMES[index]} key={TIMEFRAMES[index]} />
        ))
    ), [chartRefs]);

    return <Grid items={charts} />
}

// Charter.whyDidYouRender = true
export default Charter;