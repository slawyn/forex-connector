
import performance from "./../Performance";
import React from "react";
import ReactApexChart from "react-apexcharts";
import { mergeArray, mergeDict } from "../utils";

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
        type: 'line',
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

const formatChartData = (symbolrates) => {
    return Object.entries(symbolrates).map(([timestamp, object]) => { return { x: new Date(parseInt(timestamp)), y: [object.open, object.high, object.low, object.close] } })
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
            if(timestamps.length >0)
            {
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


const Charter = ({ customClass, calculator, symbol, instrument }) => {
    // console.log("Rendering Charter")
    const TIMEFRAMES = {
        "D1": (60 * 60 * 24 * 60)*1000,
        "H4": (60 * 60 * 4 * 48)*1000,
        "M20": (60 * 60 * 1 * 24)*1000
    };
    const ANNOTATIONS = {
        "D1": ['', '', '', ''],
        "H4": ['', '', '', ''],
        "M20": ["SL-long", "SL-short", "TP-short", "TP-long"]
    };
    const refs = React.useRef(Object.entries(TIMEFRAMES).map(() => React.createRef()));
    const localInstrument = React.useRef('')
    const localSymbol = React.useRef({digits:0, ask:0, bid:0})
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

    function updateOptions(timeframes, digits)
    {
        // console.log("       :: Symbol ", localSymbol.current)
        refs.current.forEach((reference, _index) => {
            if (reference.current) {
                const timeframe = Object.keys(timeframes)[_index]
                reference.current.chart.updateOptions({
                    yaxis: {
                        labels: {
                            formatter: (value) => value//{ return value.toFixed(digits) }
                        }
                    },
                    title: {
                        align: 'left',
                        text: `${instrument}#${timeframe}`
                    }
                })
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
                    reference.current.chart.updateSeries(
                        [
                            {
                                name: 'candles',
                                type: 'candlestick',
                                data: formatChartData(currentchart)
                            },
                        ]
                    )
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
                const annomationNames = ANNOTATIONS[timeframe];
                reference.current.chart.updateOptions({
                    annotations: {
                        yaxis: [
                            {
                                y: localSymbol.current.ask,
                                strokeDashArray: 2,
                                fillColor: '#FEB019',
                                width: '130%',
                                label: {
                                    text: ''
                                },
                            },
                            {
                                y: localSymbol.current.bid,
                                strokeDashArray: 2,
                                fillColor: '#FEB019',
                                width: '130%',
                                label: {
                                    text: ''
                                },
                            },
                            {
                                y: localCalculator.current.sl[0],
                                y2: localCalculator.current.bid,
                                width: '130%',
                                fillColor: '#fc03ec80',
                                label: {
                                    text: annomationNames[0],
                                    borderColor: '#fc03ec',
                                    offsetX: -300,
                                    style: {
                                        color: '#fff',
                                        background: '#00000000'
                                    },
                                }
                            },
                            {
                                y2: localCalculator.current.sl[1],
                                y: localCalculator.current.ask,
                                width: '130%',
                                fillColor: '#fc03ec80',
                                label: {
                                    text: annomationNames[1],
                                    borderColor: '#fc03ec',
                                    offsetX: -300,
                                    style: {
                                        color: '#fff',
                                        background: '#00000000'
                                    },
                                }
                            },
                           {
                               y: localCalculator.current.tp[0],
                               y2: localCalculator.current.sl[1],
                               fillColor: '#03FCE7FF',
                               width: '130%',
                               label: {
                                   text: annomationNames[2],
                                   borderColor: '#03FCE7',
                                   offsetX: -300,
                                   style: {
                                       color: '#fff',
                                       background: '#00000000'
                                   },
                               }
                           },
                           {
                               y: localCalculator.current.tp[1],
                               y2: localCalculator.current.sl[0],
                               fillColor: '#03FCE7FF',
                               width: '130%',
                               label: {
                                   text: annomationNames[3],
                                   borderColor: '#03FCE7',
                                   offsetX: -300,
                                   style: {
                                       color: '#fff',
                                       background: '#00000000'
                                   },
                               }
                           }
                        ]
                    }
                });

            }
        })
    }



    /* Create the charts only once, and use updateSeries to update the values */
    const charts = React.useMemo(() => {
        let _charts = [];
        refs.current.forEach((value, index) => {

            const series = []
            const reference = refs.current[index]

            /** rearrange */
            if (_charts.length % 2 === 1) {
                _charts.push(
                    <nav className="cls100PContainer">
                        <nav className="cls50PContainer">
                            {_charts.pop()}
                        </nav>
                        <nav className="cls50PContainer">
                            <ReactApexChart ref={reference} key={index} options={options} series={series} />
                        </nav>
                    </nav>)
                _charts.push(<></>)

            }
            /* 100 % chart */
            else if (refs.current.length === index + 1) {
                _charts.push(
                    <nav className="cls100PContainer">
                        <ReactApexChart ref={reference} key={index} options={options} series={series} />
                    </nav>)
            }
            /* 50% chart */
            else {
                _charts.push(<ReactApexChart ref={reference} key={index} options={options} series={series} />)
            }
        })
        return _charts;
    }, [refs])

    return (
        <>
            {charts}
        </>
    )
}

// Charter.whyDidYouRender = true
export default Charter;