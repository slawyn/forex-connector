import React, { useRef, useMemo } from "react";
import Grid from "./elements/Grid";
import DynamicChart from "./DynamicChart";
import { mergeArray, calculateDeltas } from "../utils";

const TIMEFRAMES = ["D1", "H4", "M20", "M5"]


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

const Backtester = ({}) => {
    const config = useMemo(() => createTimeframeConfig(TIMEFRAMES), []);
    const refCharts = useRef(Object.entries(config).map(() => React.createRef()));

    /* Memoize chart components to prevent unnecessary re-renders */
    const charts = useMemo(() => (
        Object.keys(config).map((timeframe, index) => (
            <DynamicChart ref={refCharts.current[index]} title={timeframe} key={timeframe} />
        ))
    ), [refCharts, config]);

    return <Grid items={charts} />;
};

// Charter.whyDidYouRender = true
export default Backtester;