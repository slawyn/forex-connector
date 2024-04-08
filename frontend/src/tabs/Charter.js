
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
        '<div class="apexcharts-tooltip-candlestick">' +
        '<div>Open: <span class="value">' +
        o +
        '</span></div>' +
        '<div>High: <span class="value">' +
        h +
        '</span></div>' +
        '<div>Low: <span class="value">' +
        l +
        '</span></div>' +
        '<div>Close: <span class="value">' +
        c +
        '</span></div>' +
        '</div>'
    )
}

const areEqual = (prevProps, nextProps) => {
    if (prevProps.heading === nextProps.heading) {
        return true                                    // donot re-render
    }
    return false                                     // will re-render
}


const yFormatter = (digits, value) => {
    if (value !== undefined) {
        // return value.toFixed(digits)
        return value
    }
    return ''
}


const options = {
    plugins: { tooltip: {} },
    colors: ["#008000", "#00BBFF80", "#FFFF00", '#fc03ec', '#fc03ec', '#03fce7', '#03fce7'],
    legend: { show: false },
    xaxis: { type: 'datetime' },
    series: [
        {
            name: 'candles',
            type: 'candlestick',
            data: []
        },
        {
            name: 'ask',
            type: 'line',
            data: []
        },
        {
            name: 'bid',
            type: 'line',
            data: []
        }],
    fill: {
        type: ['gradient']
    },
    title: {
        align: 'left',
    },
    stroke: {
        width: [1, 2, 2, 1, 1, 1, 1],
        dashArray: [0, 2, 2, 10, 10, 5, 5]
    },
    tooltip: {
        shared: true,
        custom: [
            customHandleSelection,
            defaultHandleSelection,
            defaultHandleSelection,
            defaultHandleSelection,
            defaultHandleSelection,
            defaultHandleSelection,
            defaultHandleSelection
        ]
    },
    markers:{
        size:0
    },
    dataLabels : {
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

const mapChartdata = (symbolrates) => {
    return Object.entries(symbolrates).map(([timestamp, object]) => { return { x: new Date(parseInt(timestamp)), y: [object.open, object.high, object.low, object.close] } })
};

const mapLinedata = (symbolrates, value) => {
    if (Object.keys(symbolrates).length > 0 && value !== undefined) {
        const recentKey = Object.keys(symbolrates)[Object.keys(symbolrates).length - 1];
        return [{ x: new Date(parseInt(Object.keys(symbolrates)[0])), y: value }, { x: new Date(parseInt(recentKey)), y: value }]
    }
    return []
};

/* Global varables */
// const TIMEFRAMES = { "D1": (3600 * 24 * 35 * 1000), "H1": (3600 * 48 * 1000)};
const TIMEFRAMES = { "D1": (3600 * 24 * 35 * 1000), "H1": (3600 * 48 * 1000), "M5": (60 * 5 * 12 * 20 * 1000) };

async function fetchRates(instrument, rates, handler) {
    let updated = []

    /* Gather promises */
    const base = new Date().getTime()
    const promises = Object.entries(TIMEFRAMES).map(async ([timeframe, value]) => {
        let start = Math.floor(base - (value))
        const end = Math.floor(base)

        /* If some rate data has already been fetched previously */
        if (timeframe in rates && (instrument in rates[timeframe])) {
            const timestamps = Object.keys(rates[timeframe][instrument])
            start = timestamps[timestamps.length - 1]
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
                    updated.push({ timeframe: timeframe, name: `${symbolname}#${timeframe}`, data: mergedFull[timeframe][symbolname] });
                }
            }
        }

        handler(mergedFull, updated.length > 0)
    })
}


const Charter = ({ customClass, calculator, symbol, instrument }) => {
    console.log("Rendering Charter")

    const refs = React.useRef(Object.entries(TIMEFRAMES).map(() => React.createRef()));
    const localInstrument = React.useRef('')
    const localSymbol = React.useRef({})
    const rates = React.useRef({})
    const interval = React.useRef(null)

    /* instrument changed */
    if (instrument !== localInstrument.current) {
        localInstrument.current = instrument
        console.log("       :: Instrument ", localInstrument.current)
        updateChart()
        fetchRates(localInstrument.current, rates, (newRates, updated) => {
            rates.current = newRates
            if(updated)
            {
                updateChart()
            }
        })
    }

    if (localSymbol.current !== symbol) {
        localSymbol.current = symbol
        console.log("       :: Symbol ", localSymbol.current)

        /* Update all ask and bid references */
        refs.current.forEach((reference, _index) => {
            if (reference.current) {
                const timeframe = Object.keys(TIMEFRAMES)[_index]
                if (timeframe in rates && localInstrument.current in rates[timeframe]) {
                    const currentchart = rates[timeframe][localInstrument.current]
                    reference.current.chart.updateOptions({
                        title: {
                            align: 'left',
                            text: `${instrument}#${timeframe}`
                        }
                    })
                    // reference.current.chart.updateSeries(
                    //     [
                    //         {
                    //             name: 'ask',
                    //             type: 'line',
                    //             data: mapLinedata(currentchart, symbol.ask)
                    //         },
                    //         {
                    //             name: 'bid',
                    //             type: 'line',
                    //             data: mapLinedata(currentchart, symbol.bid)
                    //         },
                    //     ]
                    // )
                    const digits = symbol.digits
                    reference.current.chart.updateOptions({
                        yaxis: {
                            labels: {
                                formatter: (value) => { return yFormatter(digits, value) }
                            }
                        },
                    })
                }
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
                    console.log("       :: Drawing Chart", timeframe, localInstrument.current)

                    const currentchart = rates[timeframe][localInstrument.current]
                    reference.current.chart.updateSeries(
                        [
                            {
                                name: 'candles',
                                type: 'candlestick',
                                data: mapChartdata(currentchart)
                            },
                        ]
                    )
                }
            }
        })
    }



    /* Create the charts only once, and use updateSeries to update the values */
    const charts = React.useMemo(() => {
        interval.current = setInterval(() => {
            if (localInstrument.current !== '') {
                fetchRates(localInstrument.current, rates, (newRates, updated) => {
                    rates.current = newRates
                    if(updated)
                    {
                        updateChart()
                    }
                })
            }
        }, 2000)


        let _charts = [];
        refs.current.forEach((value, index) => {

            const series = []
            const reference = refs.current[index]

            /** rearrange */
            if (_charts.length % 2 === 1) {
                _charts.push(
                    <div className="cls100PContainer">
                        <div className="cls50PContainer">
                            {_charts.pop()}
                        </div>
                        <div className="cls50PContainer">
                            <ReactApexChart ref={reference} key={index} options={options} series={series} />
                        </div>
                    </div>)
                _charts.push(<></>)

            }
            /* 100 % chart */
            else if (refs.current.length === index + 1) {
                _charts.push(
                    <div className="cls100PContainer">
                        <ReactApexChart ref={reference} key={index} options={options} series={series} />
                    </div>)
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