import React, { useRef, useMemo } from "react";
import Grid from "elements/Grid";
import DynamicChart from "./DynamicChart";
import { mergeArray, calculateDeltas } from "utils";

const TIMEFRAMES = ["D1", "H4",  "M6"]


async function fetchRates(timeframes, timeoffset, instrument, rates, updateRatesHandler) {
    const currentTime = Date.now() + timeoffset;
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
        config[timeframe] = calculateDeltas(timeframe, 100);
        return config;
    }, {});
}

const Charter = ({ calculator, symbol, timeoffset}) => {
    const config = useMemo(() => createTimeframeConfig(TIMEFRAMES), []);
    const refCharts = useRef(Object.entries(config).map(() => React.createRef()));
    const localSymbol = useRef(symbol);
    const localCalculator = useRef(calculator);
    const localRates = useRef({});


    if (symbol !== localSymbol.current) {

        if (symbol.name !== localSymbol.current.name) {
            refCharts.current.forEach((reference, _index) => { reference.current?.resetData(symbol.digits) })
        }

        localSymbol.current = symbol
        fetchRates(config, timeoffset, localSymbol.current.name, localRates.current, updateRates);
    }

    if (calculator && localCalculator.current !== calculator) {
        localCalculator.current = calculator
        refCharts.current.forEach((reference, _index) => {
            if (reference.current) {
                reference.current.updateMarkers(localCalculator.current.sl, localCalculator.current.tp)
            }
        })
    }

    function updateRates(newRates) {
        localRates.current = newRates;
        Object.keys(config).forEach((timeframe, index) => {
            refCharts.current[index]?.current?.updateData(localRates.current.data?.[timeframe], localSymbol.current.ask, localSymbol.current.bid);
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