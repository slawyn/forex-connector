import React from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';


export default class DynamicChart extends React.Component {
    constructor(props) {
        super(props)
        this.chartContainerRef = React.createRef();
        this.data = []
        this.sl = []
        this.tp = []
    }

    _createChart() {
        this.chart = createChart(this.chartContainerRef.current, {
            width: this.chartContainerRef.current.clientWidth,
            height: this.chartContainerRef.current.clientHeight,
            layout: {
                background: {
                    color: 'transparent'
                },
                textColor: '#ffffff',
            },
            grid: {
                vertLines: {
                    color: "#334158"
                },
                horzLines: {
                    color: "#334158"
                }
            },
            crosshair: {
                mode: CrosshairMode.Magnet
            },
            priceScale: {
                autoScale: true,
                borderColor: "#485c7b"
            },
            timeScale: {
                borderColor: "#485c7b",
                timeVisible: true,
                secondsVisible: false,
                fixLeftEdge: true
            }
        });

        this.chart.applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });
    }
    _createCandlesticks() {
        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: "#4bffb5",
            downColor: "#ff4976",
            borderDownColor: "#ff4976",
            borderUpColor: "#4bffb5",
            wickDownColor: "#838ca1",
            wickUpColor: "#838ca1",
            lastValueVisible: false,
            priceLineVisible: false,
        });
        this.candleSeries.setData([]);

    }
    _createVolumes() {
        this.volumeSeries = this.chart.addHistogramSeries({
            color: '#26a69a', // Default color for volume bars
            priceFormat: {
                type: 'custom',
                formatter: (price) => Math.abs(price).toFixed(2),
            },
            priceScaleId: '', // Share the same scale with the candlestick series
            scaleMargins: {
                top: 0.8, // Place the volume bars under the candlesticks
                bottom: 0,
            },
        });
        this.volumeSeries.setData([]);
    }

    _setupResizeHandler() {
        // Handle resizing of the chart
        const resizeHandler = () => {
            if (this.chartContainerRef.current) {
                this.chart.applyOptions({
                    width: this.chartContainerRef.current.clientWidth
                });
            }
        };

        window.addEventListener('resize', resizeHandler);

        // Store the cleanup function to remove the event listener
        this.cleanupResize = () => {
            window.removeEventListener('resize', resizeHandler);
        };
    }

    componentDidMount() {
        this._createChart()
        this._createCandlesticks()
        this._createVolumes()
        this._setupResizeHandler()
    }

    resetData() {
        this.data = []
        this.candleSeries.setData([]);
        this.volumeSeries.setData([]);
    }

    _updateAskPriceLine(price) {
        if (this.askLine) {
            this.candleSeries.removePriceLine(this.askLine);
        }

        this.askLine = this.candleSeries.createPriceLine({
            price: price,
            color: '#aa000030',
            lineWidth: 1,
            lineStyle: 0,
            axisLabelVisible: true,
            title: '',
        });
    }

    _updateBidPriceLine(price) {
        if (this.bidLine) {
            this.candleSeries.removePriceLine(this.bidLine);
        }

        this.bidLine = this.candleSeries.createPriceLine({
            price: price,
            color: '#00aa0030',
            lineWidth: 1,
            lineStyle: 0,
            axisLabelVisible: true,
            title: '',
        });
    }

    updateMarkers(sl, tp) {
        this.sl.forEach((_sl) => {
            this.candleSeries.removePriceLine(_sl);
        })

        this.tp.forEach((_tp) => {
            this.candleSeries.removePriceLine(_tp);
        })

        this.sl = []
        this.tp = []

        sl.forEach((_sl) => {
            const line = this.candleSeries.createPriceLine({
                price: _sl,
                color: '#aa00aa30',
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: true,
                title: 'SL',
            });
            this.sl.push(line)
        })

        tp.forEach((_tp) => {
            const line = this.candleSeries.createPriceLine({
                price: _tp,
                color: '#00aaaa30',
                lineWidth: 2,
                lineStyle: 1,
                axisLabelVisible: true,
                title: 'TP',
            });
            this.tp.push(line)
        })

    }

    updateData(priceData, volumeData, askPrice, bidPrice) {
        if (this.candleSeries) {
            if (priceData.length > 0) {

                if (this.data.length === 0) {
                    console.log("<<<", priceData.length)
                    console.log(">>", volumeData.length)
                    this.data = priceData
                    this.candleSeries.setData(priceData)
                    this.volumeSeries.setData(volumeData)
                }
                else {
                    console.log(volumeData)
                    console.log("---", priceData.length, priceData)
                    priceData.forEach(pricePoint => {
                        this.candleSeries.update(pricePoint);
                    });

                    volumeData.forEach(volumePoint => {
                        this.volumeSeries.update(volumePoint);
                    });
                }

            }

            this._updateAskPriceLine(askPrice)
            this._updateBidPriceLine(bidPrice)
        }
    }

    componentWillUnmount() {
        if (this.cleanupResize) {
            this.cleanupResize();
        }

        if (this.chart) {
            this.chart.remove();
        }
    }

    render() {
        return <div ref={this.chartContainerRef} style={{ width: '100%', height: '400px' }} />;
    }
};
