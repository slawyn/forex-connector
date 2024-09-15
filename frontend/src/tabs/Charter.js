
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

const optionsCandle = {
    series: [{
        name: 'candles',
        type: 'candlestick',
        data: []
    }, {
        name: 'volumes',
        type: 'bar',
        data: []
    }],
    plotOptions: {
        candlestick: {
            colors: {
                upward: '#00B746',  // Color for bullish (rising) candles
                downward: '#EF403C' // Color for bearish (falling) candles
            }
        },
        bar: {
            columnWidth: '80%',
            colors: {
                ranges: [
                    {
                        from: 0,
                        to: 1000000000,
                        color: '#FEB01920'
                    }],
                backgroundBarOpacity: 0.3,

            },
        }
    },
    plugins: { tooltip: {} },
    legend: { show: false },
    fill: {
        type: 'solid'
    },
    title: {
        align: 'left',
    },
    stroke: {
        width: 1,  // Sets the candlestick border width (usually 1 is ideal)
        colors: ['#000'],  // Remove shadow effect by using a single color
    },
    tooltip: {
        shared: true,
        custom: [
            customHandleSelection,
            defaultHandleSelection
        ]
    },
    grid: {
        borderColor: '#e0e0e020',   // Light color for the grid lines
        strokeDashArray: 10,       // Thinner dashed lines
        xaxis: {
            lines: {
                show: true,            // Show vertical grid lines
                color: '#ff0000',      // Color of the vertical grid lines (set to red in this example)
                strokeDashArray: 0     // Solid vertical lines (set to 2 for dashed lines)
            }
        }
    },
    markers: {
        size: 0
    },
    chart: {
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
        },
        stacked: false, // Ensure charts are not stacked
    },
    xaxis: {
        type: 'datetime',
        labels: {
            show: true  // This hides the x-axis labels
        }
    },
    yaxis: [
        {
            seriesName: 'candles',
            title: {
                text: 'Price'
            },
            labels: {
                formatter: function (value) {
                    return `${value}`;  // Custom format for price
                }
            },
            tooltip: {
                enabled: true
            },
        },
        {
            opposite: true,  // Volume on the opposite side (right)
            seriesName: 'volumes',
            title: {
                text: 'Volume'
            },
            labels: {
                formatter: function (value) {
                    return value + " units";  // Custom format for volume
                }
            },
            tooltip: {
                enabled: true
            },
        }
    ],

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
            <Chart key={index} ref={reference} index={index} optionsCandle={optionsCandle} />
        ));
    }, [refs]);

    return <Grid items={charts} />;
}

// Charter.whyDidYouRender = true
export default Charter;