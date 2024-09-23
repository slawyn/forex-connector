
import React from "react";
import Grid from "./elements/Grid.js"
import DynamicChart from "./DynamicChart.js";
import { mergeArray, calculateDeltas } from "../utils";

async function _fetchRates(timeframes, instrument, rates, handler) {

    /* Gather promises */
    const base = new Date().getTime()
    const promises = Object.entries(timeframes).map(async ([timeframe, value]) => {
        let start = Math.floor(base - (value))
        const end = Math.floor(base)

        if (rates.instrument === instrument && timeframe in rates.data) {
            const data = rates.data[timeframe]
            if (data.length > 0) {
                start = data[data.length - 1].time
            }
        }
        return fetch(`/rates?instrument=${encodeURIComponent(instrument)}&start=${start}&end=${end}&timeframe=${timeframe}`).then((response) => response.json());
    });

    Promise.all(promises).then(receivedRatesData => {
        const data = mergeArray(receivedRatesData)
        handler(data)
    })
}

function createConfig(timeframes) {
    let config = {};
    timeframes.forEach((value) => {
        config[value] = calculateDeltas(value, 60)
    });
    return config;
}

const Charter = ({ calculator, symbol, instrument }) => {
    const TIMEFRAMES = ["D1", "H4", "M20", "M5"]
    const CONFIG = createConfig(TIMEFRAMES)

    const refs = React.useRef(Object.entries(CONFIG).map(() => React.createRef()));
    const localSymbol = React.useRef({ digits: 0, ask: 0, bid: 0 })
    const rates = React.useRef({})
    const localCalculator = React.useRef({ sl: [], tp: [] })


    if (symbol !== localSymbol.current) {

        if (symbol.name !== localSymbol.current.name) {
            refs.current.forEach((reference, _index) => {
                if (reference.current)
                    reference.current.resetData(symbol.digits)
            })
        }

        localSymbol.current = symbol
        _updateRates()
    }

    if (localCalculator.current !== calculator) {
        localCalculator.current = calculator
        refs.current.forEach((reference, _index) => {
            if (reference.current) {
                reference.current.updateMarkers(localCalculator.current.sl, localCalculator.current.tp)
            }
        })
    }

    function _updateRates() {
        _fetchRates(CONFIG, localSymbol.current.name, rates.current, (newRates) => {
            rates.current = newRates
            refs.current.forEach((reference, index) => {
                if (reference.current) {
                    const timeframe = TIMEFRAMES[index]
                    reference.current.updateData(rates.current.data[timeframe], localSymbol.current.ask, localSymbol.current.bid)
                }
            })
        })
    }

    /* Create the charts only once, and use updateSeries to update the values */
    const charts = React.useMemo(() => {
        return refs.current.map((reference, index) => (
            <DynamicChart ref={reference} title={TIMEFRAMES[index]} />
        ))
    }, [refs]);

    return <Grid items={charts} />
}

// Charter.whyDidYouRender = true
export default Charter;