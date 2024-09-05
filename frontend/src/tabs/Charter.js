
import React from "react";
import Chart from "./Chart.js";
import { mergeArray, mergeDict } from "../utils";
import Grid from "./elements/Grid.js"

function defaultHandleSelection({ seriesIndex, dataPointIndex, w }) {
    return w.globals.series[seriesIndex][dataPointIndex]
}

function customHandleSelection({ seriesIndex, dataPointIndex, w }) {
    var o = w.globals.seriesCandleO[seriesIndex][dataPointIndex]
    var h = w.globals.seriesCandleH[seriesIndex][dataPointIndex]
    var l = w.globals.seriesCandleL[seriesIndex][dataPointIndex]
    var c = w.globals.seriesCandleC[seriesIndex][dataPointIndex]
    return (
        '<nav class="apexcharts-tooltip-candlestick">' +
        '<nav>Open: <span class="value">' +
        o +
        '</span></nav>' +
        '<nav>High: <span class="value">' +
        h +
        '</span></nav>' +
        '<nav>Low: <span class="value">' +
        l +
        '</span></nav>' +
        '<nav>Close: <span class="value">' +
        c +
        '</span></nav>' +
        '</nav>'
    )
}

const optionsBar = {
    chart: {
        height: '160px',
        type: 'bar',
        toolbar: {
            show: false
        }
    },
    dataLabels: {
        enabled: false
    },
    plotOptions: {
        bar: {
            columnWidth: '80%',
            colors: {
                ranges: [{
                    from: -1000,
                    to: 0,
                    color: '#F15B46'
                }, {
                    from: 1,
                    to: 10000,
                    color: '#FEB019'
                }],

            },
        }
    },
    stroke: {
        width: 0
    },
    xaxis: { type: 'datetime' },
    series: [],
}

const options = {
    plugins: { tooltip: {} },
    colors: ["#008000"],
    legend: { show: false },
    xaxis: { type: 'datetime' },
    series: [],
    fill: {
        type: ['gradient']
    },
    title: {
        align: 'left',
    },
    stroke: {
        width: [1],
        dashArray: [0]
    },
    tooltip: {
        shared: true,
        custom: [
            customHandleSelection
        ]
    },
    markers: {
        size: 0
    },
    dataLabels: {
        enabled: false
    },
    chart: {
        height: '160px',
        type: 'candlestick',
        animations: {
            enabled: false,
            easing: 'linear',
            speed: 800,
            animateGradually: {
                enabled: false,
                delay: 0
            },
            dynamicAnimation: {
                enabled: true,
                speed: 350
            }
        }
    }
};

const mapRatesData = (symbolrates) => {
    return Object.entries(symbolrates).map(([timestamp, object]) => { return { x: new Date(parseInt(timestamp)), y: [object.open, object.high, object.low, object.close] } })
};

const mapVolumesData = (symbolrates) => {
    return Object.entries(symbolrates).map(([timestamp, object]) => { return { x: new Date(parseInt(timestamp)), y: object.volume } })
};


/* Globals */
async function fetchRates(timeframes, instrument, rates, handler) {
    let updated = []

    /* Gather promises */
    const base = new Date().getTime()
    const promises = Object.entries(timeframes).map(async ([timeframe, value]) => {
        let start = Math.floor(base - (value))
        const end = Math.floor(base)

        /* If some rate data has already been fetched previously */
        if (timeframe in rates && (instrument in rates[timeframe])) {
            const timestamps = Object.keys(rates[timeframe][instrument])
            if (timestamps.length > 0) {
                start = timestamps[timestamps.length - 1]
            }
        }
        return fetch(`/rates?instrument=${encodeURIComponent(instrument)}&start=${start}&end=${end}&timeframe=${timeframe}`).then((response) => response.json());
    });

    Promise.all(promises).then(receivedRatesData => {

        /* Execute and merge data */
        const mergedUpdates = mergeArray(receivedRatesData)
        const mergedFull = mergeDict(rates, mergedUpdates)

        /* Find updated symbols */
        for (let [timeframe, symbols] of Object.entries(mergedUpdates)) {
            for (let [symbolname, symbol] of Object.entries(symbols)) {

                if (Object.keys(symbol).length > 0) {
                    updated.push({ timeframe: timeframe, name: `${symbolname}#${timeframe}`, data: mergedUpdates[timeframe][symbolname] });
                }
            }
        }
        handler(mergedFull, updated.length > 0)
    })
}

function calculateDeltas(timeframe, bars) {
    const millisecondsInSecond = 1000
    const secondsInMinute = 60;
    const minutesInHour = 60;
    const hoursInDay = 24;
    const deltaTable = {
        "D1": millisecondsInSecond * secondsInMinute * minutesInHour * hoursInDay,
        "H4": millisecondsInSecond * secondsInMinute * minutesInHour * 4,
        "M20": millisecondsInSecond * secondsInMinute * 20,
        "M5": millisecondsInSecond * secondsInMinute * 5,

    }

    return deltaTable[timeframe] * bars
}

function createConfig(annotations) {
    let config = {};
    Object.keys(annotations).forEach(function (key) {
        config[key] = calculateDeltas(key, 60)
    });
    return config;
}

const Charter = ({ customClass, calculator, symbol, instrument }) => {
    const ANNOTATIONS = {
        "D1": ['', '', '', ''],
        "H4": ['', '', '', ''],
        "M20": ['', '', '', ''],
        "M5": ["SL-long", "SL-short", "TP-short", "TP-long"]
    };

    const TIMEFRAMES = createConfig(ANNOTATIONS)

    const refs = React.useRef(Object.entries(TIMEFRAMES).map(() => React.createRef()));
    const localInstrument = React.useRef('')
    const localSymbol = React.useRef({ digits: 0, ask: 0, bid: 0 })
    const rates = React.useRef({})
    const localCalculator = React.useRef({ sl: [], tp: [] })


    function updateRates() {
        if (localInstrument.current !== '') {
            fetchRates(TIMEFRAMES, localInstrument.current, rates, (newRates, updated) => {
                rates.current = newRates
                if (updated) {
                    updateChart()
                }
            })
        }
    }


    /* instrument changed */
    if (instrument !== localInstrument.current) {
        localInstrument.current = instrument
        // console.log("       :: Instrument ", localInstrument.current)
        updateChart()
        updateRates()
    }

    if (localCalculator.current !== calculator) {
        localCalculator.current = calculator
        updateAnnotations()
    }

    if (localSymbol.current.digits !== symbol.digits) {
        localSymbol.current.digits = symbol.digits
        updateOptions(TIMEFRAMES, localSymbol.current.digits)
        updateAnnotations()
    }

    if (localSymbol.current.ask !== symbol.ask || localSymbol.bid !== symbol.bid) {
        localSymbol.current.ask = symbol.ask
        localSymbol.current.bid = symbol.bid
        updateAnnotations()
        updateRates()
    }

    function updateOptions(timeframes, digits) {
        console.log("       :: Symbol ", localSymbol.current)
        refs.current.forEach((reference, _index) => {
            if (reference.current) {
                const timeframe = Object.keys(timeframes)[_index]
                reference.current.updateFormat(instrument, timeframe)
            }
        })
    }

    function updateChart() {

        /* Update all references */
        refs.current.forEach((reference, _index) => {
            if (reference.current) {
                const timeframe = Object.keys(TIMEFRAMES)[_index]

                /* Draw if chart is available */
                if (timeframe in rates && localInstrument.current in rates[timeframe] && Object.keys(rates[timeframe][localInstrument.current] > 0)) {
                    // console.log("       :: Drawing Chart", timeframe, localInstrument.current, localSymbol)

                    const currentchart = rates[timeframe][localInstrument.current]
                    reference.current.updateData(mapRatesData(currentchart), mapVolumesData(currentchart))

                }
            }
        })
    }
    function updateAnnotations() {

        /* Update all references */
        refs.current.forEach((reference, _index) => {
            if (reference.current) {
                const timeframe = Object.keys(TIMEFRAMES)[_index]

                /* Update annotations  */
                reference.current.updateAnnotations(localSymbol.current.ask,
                    localSymbol.current.bid,
                    localCalculator.current.sl,
                    localCalculator.current.tp,
                    ANNOTATIONS[timeframe]);
            }
        })
    }



    /* Create the charts only once, and use updateSeries to update the values */
    const charts = React.useMemo(() => {
        return refs.current.map((reference, index) => (
            <Chart key={index} ref={reference} index={index} optionsCandle={options} optionsBar={optionsBar} />
        ));
    }, [refs]);

    return <Grid items={charts} />;
    // return <>{charts}</>;
}

// Charter.whyDidYouRender = true
export default Charter;