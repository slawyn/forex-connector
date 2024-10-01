import React, { useRef, useMemo } from "react";
import Grid from "elements/Grid";
import DynamicChart from "./DynamicChart";
import { mergeArray, calculateDeltas, createPostRequest } from "../utils";
import { TextField, InputAdornment, InputLabel, MenuItem, FormControl, Select } from '@mui/material';

const TIMEFRAMES = ["D1", "H4"]
const RISKINITIAL = 1.00
const RISKSTEP = 0.25
const VOLUME = 0.01

async function fetchRates(timeframes, timeoffset, instrument, updateRatesHandler) {
    const currentTime = Date.now() + timeoffset;
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
        config[timeframe] = calculateDeltas(timeframe, 300);
        return config;
    }, {});
}

const Backtester = ({ customClass, instruments, timeoffset }) => {

    const config = useMemo(() => createTimeframeConfig(TIMEFRAMES), []);
    const refCharts = useRef(Object.entries(config).map(() => React.createRef()));
    const [selectedInstrument, setSelectedInstrument] = React.useState("")
    const [selectedRisk, setSelectedRisk] = React.useState(RISKINITIAL)
    const [selectedVolume, setSelectedVolume] = React.useState(VOLUME)
    const selectedTimes = useRef({ volume:VOLUME, risk:RISKINITIAL, timeframe: "", start: 0, end: 0 })

    /* Memoize chart components to prevent unnecessary re-renders */
    const charts = useMemo(() => (
        Object.keys(config).map((timeframe, index) => (
            <DynamicChart ref={refCharts.current[index]} title={timeframe} key={timeframe} handler={(start, end) => { handleDataSelection(timeframe, start, end) }} />
        ))
    ), [refCharts, config]);


    function updateChart(instrument) {
        if (selectedTimes.current.instrument !== instrument) {
            refCharts.current.forEach((reference, _index) => { reference.current?.resetData(4) })
        }
        selectedTimes.current.instrument = instrument
        setSelectedInstrument(instrument)

        console.log(timeoffset)
        fetchRates(config, timeoffset, instrument, updateRates)
    }

    function updateRates(newRates) {
        Object.keys(config).forEach((timeframe, index) => {
            refCharts.current[index]?.current?.updateData(newRates.data?.[timeframe]);
        });
    }

    function backtestData() {
        const requestOptions = createPostRequest(selectedTimes.current)
        fetch('/backtesting', requestOptions).then(response => response.json())
    }

    function handleDataSelection(timeframe, timeStart, timeEnd) {
        selectedTimes.current.timeframe = timeframe
        selectedTimes.current.start = timeStart * 1000
        selectedTimes.current.end = timeEnd * 1000
    }

    function handleRiskSelection(risk)
    {
        selectedTimes.current.risk = risk
        setSelectedRisk(risk)
    }

    function handleVolumeSelection(volume)
    {
        selectedTimes.current.volume = volume
        setSelectedVolume(volume)
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

                <TextField
                            id="trade-risk"
                            type="number"
                            value={selectedRisk}
                            variant="outlined"
                            label="Risk %"
                            onChange={(e) => handleRiskSelection(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                step: RISKSTEP,
                            }}
                        />
                
                <TextField
                            id="trade-volume"
                            type="number"
                            value={selectedVolume}
                            variant="outlined"
                            label="Volume LOT"
                            onChange={(e) => handleVolumeSelection(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                startAdornment: <InputAdornment position="start">LOT</InputAdornment>,
                                step: VOLUME,
                            }}
                        />
                <button className={"css-blue-button"} onClick={() => backtestData()}>
                    Backtest
                </button>
            </nav>
            <nav>
                <Grid items={charts} columns={1} rows={1} />
            </nav>
        </>
    )
};

// Charter.whyDidYouRender = true
export default Backtester;