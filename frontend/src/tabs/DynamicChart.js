import React from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';




const mapData = (data) => {
    let mapped = { price: [], volume: [] }
    for (let idx = 0; idx < data.length; ++idx) {
        const entry = data[idx]
        const time = entry.time/1000
        mapped.price.push({ time: time, open: entry.open, high: entry.high, low: entry.low, close: entry.close })

        const barcolor = entry.close < entry.open ? "rgba(255, 128, 159, 0.10)" : "rgba(107, 255, 193, 0.10)";
        mapped.volume.push({ time: time, value: entry.volume, color: barcolor })
    }
    return mapped
};

export default class DynamicChart extends React.Component {
    constructor(props) {
        super(props)
        this.chartContainerRef = React.createRef();
        this.data = []
        this.sl = []
        this.tp = []
        this.title = props.title
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
                    color: '#e0e0e060',
                    style: 2,
                    visible: true
                },
                horzLines: {
                    color: '#e0e0e060',
                    style: 2,
                    visible: true
                }
            },
            crosshair: {
                mode: CrosshairMode.Magnet
            },
            priceScale: {
                autoScale: true,
                borderColor: "#485c7b",
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


        });
        this.candleSeries.setData([]);
        
    }
    _createVolumes() {
        this.volumeSeries = this.chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });
        this.volumeSeries.setData([]);
    }

    _setupResizeHandler() {
        const resizeHandler = () => {
            if (this.chartContainerRef.current) {
                this.chart.applyOptions({
                    width: this.chartContainerRef.current.clientWidth
                });
            }
        };


        // Store the cleanup function to remove the event listener
        window.addEventListener('resize', resizeHandler);
        this.cleanupResize = () => {
            window.removeEventListener('resize', resizeHandler);
        };
    }

    _updateAskPriceLine(price) {
        if (this.askLine) {
            this.candleSeries.removePriceLine(this.askLine);
        }

        this.askLine = this.candleSeries.createPriceLine({
            price: price,
            color: '#aa000080',
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
            color: '#00aa0080',
            lineWidth: 1,
            lineStyle: 0,
            axisLabelVisible: true,
            title: '',
        });
    }

    componentDidMount() {
        this._createChart()
        this._createCandlesticks()
        this._createVolumes()
        this._setupResizeHandler()
    }


    resetData(digits) {
        this.data = []
        this.candleSeries.setData([]);
        this.volumeSeries.setData([]);
        this.candleSeries.applyOptions({
            priceFormat: {
                type: "custom",
                formatter: function (price) {
                    return `${price.toFixed(digits)}`;
                },
            },
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
                color: '#aa00aa80',
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
                color: '#00aaaa80',
                lineWidth: 2,
                lineStyle: 1,
                axisLabelVisible: true,
                title: 'TP',
            });
            this.tp.push(line)
        })

    }

    updateData(data, askPrice, bidPrice) {
        if (this.candleSeries) {
            if (data.length > 0) {
                const mapped = mapData(data)

                if (this.data.length === 0 && mapped.price.length>2) {
                    this.data = mapped.price
                    this.candleSeries.setData(mapped.price)
                    this.volumeSeries.setData(mapped.volume)
                }
                else {
                    mapped.price.forEach(pricePoint => {
                        this.candleSeries.update(pricePoint);
                    });

                    mapped.volume.forEach(volumePoint => {
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
        return (
            <nav>
                <nav>{this.title}</nav>
                <div ref={this.chartContainerRef} style={{ width: '100%', height: '400px' }} />
            </nav>)
    }
};
