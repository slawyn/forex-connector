import React from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';




const mapData = (data) => {
    return data.reduce((acc, entry) => {
        const time = entry.time / 1000;
        acc.price.push({
            time,
            open: entry.open,
            high: entry.high,
            low: entry.low,
            close: entry.close
        });
        const barColor = entry.close < entry.open
            ? "rgba(255, 128, 159, 0.10)"
            : "rgba(107, 255, 193, 0.10)";
        acc.volume.push({
            time,
            value: entry.volume,
            color: barColor
        });
        return acc;
    }, { price: [], volume: [] });
};


export default class DynamicChart extends React.Component {
    constructor(props) {
        super(props)
        this.chartContainerRef = React.createRef();
        this.state = {
            data: [],
            sl: [],
            tp: []
        };
        this.title = props.title
    }

    componentDidMount() {
        this._createChart()
        this._createCandlesticks()
        this._createVolumes()
        this._setupResizeHandler()
    }


    componentWillUnmount() {
        this._cleanupResizeHandler();
        this.chart?.remove();
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

    _setupResizeHandler = () => {
        const resizeHandler = () => {
            if (this.chartContainerRef.current) {
                this.chart.applyOptions({
                    width: this.chartContainerRef.current.clientWidth
                });
            }
        };
        window.addEventListener('resize', resizeHandler);
        this.cleanupResize = () => window.removeEventListener('resize', resizeHandler);
    };

    _cleanupResizeHandler = () => {
        if (this.cleanupResize) {
            this.cleanupResize();
        }
    };

    _updateAskPriceLine(price) {
        this.askLine && this.candleSeries.removePriceLine(this.askLine);
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
        this.bidLine && this.candleSeries.removePriceLine(this.bidLine);
        this.bidLine = this.candleSeries.createPriceLine({
            price: price,
            color: '#00aa0080',
            lineWidth: 1,
            lineStyle: 0,
            axisLabelVisible: true,
            title: '',
        });
    }



    _createPriceLine = (price, color, title) => {
        return this.candleSeries.createPriceLine({
            price,
            color,
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title
        });
    };
    updateMarkers = (sl, tp) => {
        this.state.sl.forEach(slLine => this.candleSeries.removePriceLine(slLine));
        this.state.tp.forEach(tpLine => this.candleSeries.removePriceLine(tpLine));

        const newSL = sl.map(slPrice => this._createPriceLine(slPrice, '#aa00aa80', 'SL'));
        const newTP = tp.map(tpPrice => this._createPriceLine(tpPrice, '#00aaaa80', 'TP'));

        this.setState({ sl: newSL, tp: newTP });
    };

    resetData(digits) {
        this.setState({ data: [] });
        this.candleSeries.setData([]);
        this.volumeSeries.setData([]);
        this.candleSeries.applyOptions({
            priceFormat: {
                type: "custom",
                formatter: (price) => price.toFixed(digits)
            }
        });
    }

    updateData(data, askPrice, bidPrice) {
        if (this.candleSeries && data.length > 0) {
            const mappedData = mapData(data);

            if (this.state.data.length === 0 && mappedData.price.length > 2) {
                this.setState({ data: mappedData.price });
                this.candleSeries.setData(mappedData.price);
                this.volumeSeries.setData(mappedData.volume);
            } else {
                mappedData.price.forEach(pricePoint => this.candleSeries.update(pricePoint));
                mappedData.volume.forEach(volumePoint => this.volumeSeries.update(volumePoint));
            }

            this._updateAskPriceLine(askPrice)
            this._updateBidPriceLine(bidPrice)
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
