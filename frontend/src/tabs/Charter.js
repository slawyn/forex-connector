import React from "react";
import ReactApexChart from "react-apexcharts";




const Charter = ({ customClass, selected, symbol, timeframes, charterdata }) => {
    const formatter = (value) => {
        if (value !== undefined) {
            if (symbol !== undefined) {
                return value.toFixed(symbol.digits)
            }
            return value.toFixed(6)
        }
        return ''
    }

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

    function defaultSelectHandler({ seriesIndex, dataPointIndex, w }) {
        return w.globals.series[seriesIndex][dataPointIndex]
    }


    let charts = [];
    timeframes.forEach((timeframe, index) => {
        const options = {
            plugins: { tooltip: {} },
            colors: ["#008000", "#00BBFF80", "#FFFF00", '#fc03ec','#fc03ec','#03fce7','#03fce7'],
            legend: { show: false },
            xaxis: { type: 'datetime' },
            yaxis: { labels: { formatter } },
            fill: {
                type: ['gradient']
            },
            title: {
                align: 'left',
                text: `${selected.id}#${timeframe}`
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
                custom: [function ({ seriesIndex, dataPointIndex, w }) {
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
                },
                    defaultSelectHandler,
                    defaultSelectHandler,
                    defaultSelectHandler,
                    defaultSelectHandler,
                    defaultSelectHandler,
                    defaultSelectHandler,
                ]
            },
        };

        /* Draw only avaible data */
        let series = []
        if (timeframe in charterdata && selected.id in charterdata[timeframe]) {
            const symbolrates = charterdata[timeframe][selected.id]
            series = [
                {
                    name: 'candles',
                    type: 'candlestick',
                    data: mapChartdata(symbolrates)
                },
                {
                    name: 'ask',
                    type: 'line',
                    data: mapLinedata(symbolrates, symbol.ask)
                },
                {
                    name: 'bid',
                    type: 'line',
                    data: mapLinedata(symbolrates, symbol.bid)
                },
                {
                    name: 'stop-loss',
                    type: 'line',
                    data: mapLinedata(symbolrates, selected.calculator.sl0)
                },
                {
                    name: 'stop-loss1',
                    type: 'line',
                    data: mapLinedata(symbolrates, selected.calculator.sl1)
                },
                {
                    name: 'take-profit0',
                    type: 'line',
                    data: mapLinedata(symbolrates, selected.calculator.tp0)
                },
                {
                    name: 'take-profit1',
                    type: 'line',
                    data: mapLinedata(symbolrates, selected.calculator.tp1)
                }
            ];
        }

        /** check arrangement */
        if (charts.length % 2 === 1) {
            charts.push(<div className="cls100PContainer">
                <div className="cls50PContainer">
                    {charts.pop()}
                </div>
                <div className="cls50PContainer">
                    <ReactApexChart options={options} series={series} />
                </div>
            </div>)
            charts.push(<></>)

        }
        else if (timeframes.length === index + 1) {
            charts.push(<div className="cls100PContainer">
                <ReactApexChart options={options} series={series} />
            </div>)
        }
        else {
            charts.push(<ReactApexChart options={options} series={series} />)
        }
    })

    return (
        <>
            {charts}
        </>
    )
}


export { Charter as default };