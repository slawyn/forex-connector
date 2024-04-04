
import performance from "./../Performance";
import React from "react";
import ReactApexChart from "react-apexcharts";

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
    fill: {
        type: ['gradient']
    },
    title: {
        align: 'left',
    },
    chart: {
        type: 'line'
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


const Charter = ({ customClass, calculator, timeframes, data }) => {
    const refs = React.useRef(timeframes.map(() => React.createRef()));

    refs.current.forEach((reference, index) => {
        const timeframe = timeframes[index]
        if (timeframe in data.rates && data.symbol.name in data.rates[timeframe]) {
            const symbolrates = data.rates[timeframe][data.symbol.name]
            const digits = data.symbol.digits
            reference.current.chart.updateOptions(
                {
                    yaxis: {
                        labels: {
                            formatter: (value) => { return yFormatter(digits, value) }
                        }
                    },
                    series: [
                        {
                            name: 'candles',
                            type: 'candlestick',
                            data: mapChartdata(symbolrates)
                        },
                        {
                            name: 'ask',
                            type: 'line',
                            data: mapLinedata(symbolrates, data.symbol.ask)
                        },
                        {
                            name: 'bid',
                            type: 'line',
                            data: mapLinedata(symbolrates, data.symbol.bid)
                        },
                        {
                            name: 'stop-loss',
                            type: 'line',
                            data: mapLinedata(symbolrates, data.calculator.sl0)
                        },
                        {
                            name: 'stop-loss1',
                            type: 'line',
                            data: mapLinedata(symbolrates, data.calculator.sl1)
                        },
                        {
                            name: 'take-profit0',
                            type: 'line',
                            data: mapLinedata(symbolrates, data.calculator.tp0)
                        },
                        {
                            name: 'take-profit1',
                            type: 'line',
                            data: mapLinedata(symbolrates, data.calculator.tp1)
                        }
                    ],
                    title: {
                        align: 'left',
                        text: `${data.symbol.name}#${timeframe}`
                    }
                }
            )
        }
    }
    )

    let createdCharts = [];
    timeframes.forEach((value, index) => {

        const series = []
        const reference = refs.current[index]

        /** check arrangement */
        if (createdCharts.length % 2 === 1) {
            createdCharts.push(
                <div className="cls100PContainer">
                    <div className="cls50PContainer">
                        {createdCharts.pop()}
                    </div>
                    <div className="cls50PContainer">
                        <ReactApexChart ref={reference} key={index} options={options} series={series} />
                    </div>
                </div>)
            createdCharts.push(<></>)

        }
        else if (timeframes.length === index + 1) {
            createdCharts.push(
                <div className="cls100PContainer">
                    <ReactApexChart ref={reference} key={index} options={options} series={series} />
                </div>)
        }
        else {
            createdCharts.push(<ReactApexChart ref={reference} key={index} options={options} series={series} />)
        }
    })
    return (
        <>
            {createdCharts}
        </>
    )
}


export { Charter as default };