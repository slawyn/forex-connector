import React, { useRef, useMemo } from "react";
import Grid from "src/elements/Grid";
import DynamicChart from "src/tabs/DynamicChart";
import { mergeArray, calculateDeltas, createPostRequest } from "src/utils";
import { TextField, InputAdornment, InputLabel, MenuItem, FormControl, Select } from '@mui/material';

const TIMEFRAMES = ["D1", "H4"] as const;
const RISK_INITIAL = 1.00;
const RISK_STEP = 0.25;
const VOLUME = 0.01;

type Timeframe = typeof TIMEFRAMES[number];

interface BacktesterProps {
    customClass: string;
    instruments: string[];
    timeoffset: number;
}

interface SelectedTimes {
    volume: number;
    risk: number;
    timeframe: string;
    start: number;
    end: number;
    instrument?: string;
}

async function fetchRates(
    timeframes: Record<Timeframe, number>,
    timeoffset: number,
    instrument: string,
    updateRatesHandler: (mergedData: any) => void
): Promise<void> {
    const currentTime = Date.now() + timeoffset;
    const promises = Object.entries(timeframes).map(async ([timeframe, duration]) => {
        let start = currentTime - duration;
        const end = currentTime;
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
        config[timeframe] = calculateDeltas(timeframe, 300);
        return config;
    }, {} as Record<Timeframe, number>);
}

const Backtester: React.FC<BacktesterProps> = ({ customClass, instruments, timeoffset }) => {
    const config = useMemo(() => createTimeframeConfig(TIMEFRAMES), []);
    const refCharts = useRef(Object.entries(config).map(() => React.createRef<DynamicChart>()));
    const [selectedInstrument, setSelectedInstrument] = React.useState<string>("");
    const [selectedRisk, setSelectedRisk] = React.useState<number>(RISK_INITIAL);
    const [selectedVolume, setSelectedVolume] = React.useState<number>(VOLUME);
    const selectedTimes = useRef<SelectedTimes>({ volume: VOLUME, risk: RISK_INITIAL, timeframe: "", start: 0, end: 0 });

    /* Memoize chart components to prevent unnecessary re-renders */
    const charts = useMemo(() => (
        Object.keys(config).map((timeframe, index) => (
            <DynamicChart
                ref={refCharts.current[index]}
                title={timeframe}
                key={timeframe}
                handler={(start, end) => handleDataSelection(timeframe, start, end)}
            />
        ))
    ), [refCharts, config]);

    function updateChart(instrument: string) {
        if (selectedTimes.current.instrument !== instrument) {
            refCharts.current.forEach((reference) => { reference.current?.resetData(4); });
        }
        selectedTimes.current.instrument = instrument;
        setSelectedInstrument(instrument);
        fetchRates(config, timeoffset, instrument, updateRates);
    }

    function updateRates(newRates: any) {
        Object.keys(config).forEach((timeframe, index) => {
            refCharts.current[index]?.current?.updateData(newRates.data?.[timeframe]);
        });
    }

    function backtestData() {
        const requestOptions = createPostRequest(selectedTimes.current);
        fetch('/api/backtesting', requestOptions).then(response => response.json());
    }

    function handleDataSelection(timeframe: string, timeStart: number, timeEnd: number) {
        selectedTimes.current.timeframe = timeframe;
        selectedTimes.current.start = timeStart * 1000;
        selectedTimes.current.end = timeEnd * 1000;
    }

    function handleRiskSelection(risk: number) {
        selectedTimes.current.risk = risk;
        setSelectedRisk(risk);
    }

    function handleVolumeSelection(volume: number) {
        selectedTimes.current.volume = volume;
        setSelectedVolume(volume);
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
                        onChange={(e) => updateChart(e.target.value as string)}
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
                    onChange={(e) => handleRiskSelection(parseFloat(e.target.value))}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                        startAdornment: <InputAdornment position="start">%</InputAdornment>,
                        step: RISK_STEP,
                    }}
                />
                <TextField
                    id="trade-volume"
                    type="number"
                    value={selectedVolume}
                    variant="outlined"
                    label="Volume LOT"
                    onChange={(e) => handleVolumeSelection(parseFloat(e.target.value))}
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
    );
};

// Charter.whyDidYouRender = true
export default Backtester;
