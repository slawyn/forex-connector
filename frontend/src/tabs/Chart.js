
import React from "react";
import ReactApexChart from "react-apexcharts";


export default class Chart extends React.Component {
    constructor(props) {
        super(props)
        this.refCandle = React.createRef();
        this.refBar = React.createRef();
        this.index = props.index
        this.optionsCandle = props.optionsCandle
        this.optionsBar = props.optionsBar
    }

    updateData(candleData, volumeData) {
        this.refCandle.current.chart.updateSeries(
            [{
                name: 'candles',
                type: 'candlestick',
                data: candleData
            }]
        )
        this.refBar.current.chart.updateSeries(
            [{
                name: 'volumes',
                type: 'bar',
                data: volumeData
            }]
        )
    }

    updateFormat(instrument, timeframe) {
        this.refCandle.current.chart.updateOptions({
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

    updateAnnotations(ask, bid, sl, tp, names) {
        this.refCandle.current.chart.updateOptions({
            annotations: {
                yaxis: [
                    {
                        y: ask,
                        strokeDashArray: 2,
                        fillColor: '#FEB019',
                        width: '130%',
                        label: {
                            text: ''
                        },
                    },
                    {
                        y: bid,
                        strokeDashArray: 2,
                        fillColor: '#FEB019',
                        width: '130%',
                        label: {
                            text: ''
                        },
                    },
                    {
                        y: sl[0],
                        y2: bid,
                        width: '130%',
                        fillColor: '#fc03ec80',
                        label: {
                            text: names[0],
                            borderColor: '#fc03ec',
                            offsetX: -300,
                            style: {
                                color: '#fff',
                                background: '#00000000'
                            },
                        }
                    },
                    {
                        y2: sl[1],
                        y: ask,
                        width: '130%',
                        fillColor: '#fc03ec80',
                        label: {
                            text: names[1],
                            borderColor: '#fc03ec',
                            offsetX: -300,
                            style: {
                                color: '#fff',
                                background: '#00000000'
                            },
                        }
                    },
                    {
                        y: tp[0],
                        y2: sl[1],
                        fillColor: '#03FCE7FF',
                        width: '130%',
                        label: {
                            text: names[2],
                            borderColor: '#03FCE7',
                            offsetX: -300,
                            style: {
                                color: '#fff',
                                background: '#00000000'
                            },
                        }
                    },
                    {
                        y: tp[1],
                        y2: sl[0],
                        fillColor: '#03FCE7FF',
                        width: '130%',
                        label: {
                            text: names[3],
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
        })
    }

    render() {
        return (
            <div height="800px">
                <nav className='chart-candlestick'>
                    <ReactApexChart height="400px" ref={this.refCandle} key={this.index} options={this.optionsCandle} series={[]} />
                </nav>
                <nav className='chart-bar'>
                    <ReactApexChart height="100px" ref={this.refBar} key={this.index} options={this.optionsBar} series={[]} />
                </nav>
            </div>
        )
    }
}
