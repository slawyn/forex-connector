import React, { useRef, useMemo } from "react";
import Grid from "./elements/Grid";
import DynamicChart from "./DynamicChart";
import { mergeArray, calculateDeltas, createPostRequest } from "../utils";
import { TextField, InputAdornment, InputLabel, MenuItem, FormControl, Select } from '@mui/material';

const TIMEFRAMES = ["D1","M20"]


async function fetchRates(timeframes, instrument,  updateRatesHandler) {
    const currentTime = Date.now();
    const promises = Object.entries(timeframes).map(async ([timeframe, duration]) => {
        let start = currentTime - duration;
        const end = currentTime;

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
        config[timeframe] = calculateDeltas(timeframe, 200);
        return config;
    }, {});
}

const Backtester = ({ instruments }) => {

    const config = useMemo(() => createTimeframeConfig(TIMEFRAMES), []);
    const refCharts = useRef(Object.entries(config).map(() => React.createRef()));
    const [selectedInstrument, setSelectedInstrument] = React.useState("")
    const selectedTimes = useRef({timeframe:"", start:0, end:0})

    /* Memoize chart components to prevent unnecessary re-renders */
    const charts = useMemo(() => (
        Object.keys(config).map((timeframe, index) => (
            <DynamicChart ref={refCharts.current[index]} title={timeframe} key={timeframe} handler={(start, end) => {handleDataSelection(timeframe, start, end)}}/>
        ))
    ), [refCharts, config]);


    function updateChart(instrument){
        selectedTimes.current.instrument = instrument
        setSelectedInstrument(instrument)
        fetchRates(config, instrument, updateRates)
    }

    function updateRates(newRates) {
        Object.keys(config).forEach((timeframe, index) => {
            refCharts.current[index]?.current?.updateData(newRates.data?.[timeframe]);
        });
    }

    function backtestData()
    {
        const requestOptions = createPostRequest(selectedTimes.current)
        fetch('/backtesting', requestOptions).then(response => response.json())
    }

    function handleDataSelection(timeframe, timeStart, timeEnd)
    {
        selectedTimes.current.timeframe = timeframe
        selectedTimes.current.start = timeStart*1000
        selectedTimes.current.end = timeEnd*1000
    }

    return (
        <>
            <nav className="clsGlobalContainer">
                <FormControl fullWidth>
                    <InputLabel id="symbol-label">Symbol</InputLabel>
                    <Select
                        labelId="symbol-label"
                        id="symbol-select"
                        label="Symbol"
                        value={selectedInstrument}
                        onChange={(e) => updateChart(e.target.value)}
                    >
                        {instruments.map((instrument, index) => (
                            <MenuItem key={index} value={instrument}>
                                {instrument}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <button className={"css-blue-button"} onClick={() => backtestData()}>
                    Backtest
              </button>
            </nav>
            <nav>
                <Grid items={charts} columns={1} rows={1}  />
            </nav>
        </>
    )
};

// Charter.whyDidYouRender = true
export default Backtester;