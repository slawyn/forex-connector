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

const mappedTypes = {
    market_sell: {
        position: 'inBar',
        color: 'yellow',
        shape: 'arrowDown',
    },
    market_buy: {
        position: 'inBar',
        color: 'white',
        shape: 'arrowUp',
    },
    sell_sl: {
        position: 'aboveBar',
        color: 'purple',
        shape: 'circle',
    },
    sell_tp: {
        color: 'teal',
        shape: 'circle',
    }
}

function mergeMarkers(open, closed) {
    const merged = [...open, ...closed];
    merged.sort((a, b) => new Date(a.time) - new Date(b.time));
    return merged;
}

function mapPositionalData(data, closed = false, timestep) {
    const addEntry = (dictType, timeIndex, priceIndex, text) => ({
        ...mappedTypes[dictType],
        time: Math.floor(Date.parse(timeIndex) / 1000 / timestep) * timestep,
        price: priceIndex,
        text: text
    });

    if (data) {
        return data.reduce((acc, entry) => {
            if (closed) {
                const tradeId = entry[0]
                const type = entry[4]
                const timeStart = entry[2]
                const timeEnd = entry[3]
                const priceStart = entry[5]
                const priceEnd = entry[6]
                if (type === "BUY") {
                    acc.push(addEntry("market_buy", timeStart, priceStart, tradeId));
                    acc.push(addEntry("market_sell", timeEnd, priceEnd, ""));
                } else {
                    acc.push(addEntry("market_sell", timeStart, priceStart, tradeId));
                    acc.push(addEntry("market_buy", timeEnd, priceEnd, ""));
                }
            } else {
                const tradeId = entry[0]
                const type = entry[3]
                const timeStart = entry[2]
                const priceStart = entry[4]
                acc.push(addEntry(type, timeStart, priceStart, tradeId));
            }
            return acc.sort((a, b) => new Date(a.time) - new Date(b.time));;
        }, []);
    }
    return []
}

function getConnectionsForClosed(data, timestep) {
    if (!data) return {};

    return data.reduce((acc, entry) => {
        const tradeId = entry[0];
        const timeStart = Math.floor(Date.parse(entry[2]) / 1000 / timestep) * timestep
        const timeEnd = Math.floor(Date.parse(entry[3]) / 1000 / timestep) * timestep
        const priceStart = entry[5];
        const priceEnd = entry[6];

        acc[tradeId] = {
            timeStart,
            timeEnd,
            priceStart,
            priceEnd
        };

        return acc;
    }, {});
}

function getSlTpForOpen(data, timestep) {
    if (!data) return {};

    return data.reduce((acc, entry) => {
        const tradeId = entry[0];
        const slStart = entry[7]
        const tpStart = entry[8]

        acc[tradeId] = {
            slStart,
            tpStart
        };

        return acc;
    }, {});
}


export default class DynamicChart extends React.Component {
    constructor(props) {
        super(props)
        this.chartContainerRef = React.createRef();
        this.state = {
            data: [],
            sl: [],
            tp: [],
            connections: {},
            sltp: {}
        };
        this.title = props.title
        this.handler = props.handler
        this.selectionRange = null
        this.timeDeltaMs = 0
    }

    componentDidMount() {
        this._createChart()
        this._createCandlesticks()
        this._createVolumes()
        this._setupResizeHandler()
        this._subscribeSelectableRange(this.handler)
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
    _createSlTpLine = (price, color, title) => {
        return this.candleSeries.createPriceLine({
            price,
            color,
            lineWidth: 2,
            lineStyle: 4,
            axisLabelVisible: true,
            title
        });
    };

    _createConnection = (timeStart, timeEnd, priceStart, priceEnd, id) => {
        if (!(id in this.state.connections) && timeStart !== timeEnd) {
            const connection = this.chart.addLineSeries({
                color: '#ffffff80',
                lineWidth: 2,
                lineStyle: 4,
                axisLabelVisible: false,
                lastValueVisible: false
            });

            connection.setData([
                { time: timeStart, value: priceStart },
                { time: timeEnd, value: priceEnd }]
            )
            return connection
        }
    }

    updateLines = (sl, tp) => {
        this.state.sl.forEach(slLine => this.candleSeries.removePriceLine(slLine));
        this.state.tp.forEach(tpLine => this.candleSeries.removePriceLine(tpLine));

        const newSL = sl.map(slPrice => this._createPriceLine(slPrice, '#aa00aa80', 'SL'));
        const newTP = tp.map(tpPrice => this._createPriceLine(tpPrice, '#00aaaa80', 'TP'));

        this.setState({ sl: newSL, tp: newTP });
    };

    _removeConnections() {
        Object.values(this.state.connections).forEach(series => this.chart.removeSeries(series));
    }
    _removeSlTp() {
        Object.values(this.state.sltp).forEach(sltp => {
            this.candleSeries.removePriceLine(sltp[0]);
            this.candleSeries.removePriceLine(sltp[1]);
        });
    }

    updatePositions(openPositions, closedPositions, timestep) {
        if (timestep > 0) {
            const open = mapPositionalData(openPositions, false, timestep)
            const closed = mapPositionalData(closedPositions, true, timestep)

            let connections = {}
            for (const [id, value] of Object.entries(getConnectionsForClosed(closedPositions, timestep))) {
                const connection = this._createConnection(value.timeStart, value.timeEnd, value.priceStart, value.priceEnd, id)
                if (connection) {
                    connections[id] = connection
                }
            }
            let sltp = {}
            for (const [id, value] of Object.entries(getSlTpForOpen(openPositions, timestep))) {
                if (!(id in this.state.sltp)) {
                    sltp[id] = [
                        this._createSlTpLine(value.slStart, '#f2f54280', `${id} SL`),
                        this._createSlTpLine(value.tpStart, '#f2f54280', `${id} TP`),
                    ]
                }
            }

            this.setState(prevState => ({ connections: { ...prevState.connections, ...connections }, sltp: { ...prevState.sltp, ...sltp } }))
            this.candleSeries.setMarkers(mergeMarkers(open, closed))
        }
    }

    resetData(digits) {
        this._removeConnections()
        this._removeSlTp()
        this.candleSeries.setData([])
        this.volumeSeries.setData([])
        this.selectionRange.setData([])
        this.candleSeries.applyOptions({
            priceFormat: {
                type: "custom",
                formatter: (price) => price.toFixed(digits)
            }
        });
        this.setState({ data: [], connections: {}, sltp: {} });
    }


    _getCurrentHighestPrice() {
        const visibleRange = this.chart.timeScale().getVisibleRange();
        const highestPrice = this.state.data.reduce((max, point) => {
            if (point.time >= visibleRange.from && point.time <= visibleRange.to) {
                return Math.max(max, point.open);

            } return max;
        }, -Infinity);
        return highestPrice;
    }

    _subscribeSelectableRange(handler) {
        if (handler) {
            let selecting = false
            let times = { A: 0, B: 0 }
            let prices = { A: 0, B: 0 }

            this.selectionRange = this.chart.addAreaSeries({
                topColor: 'rgba(38,198,218, 0.56)',
                bottomColor: 'rgba(38,198,218, 0.04)',
                lineColor: 'rgba(38,198,218, 1)',
                lineWidth: 2,
            });

            this.chart.subscribeDblClick((params) => {
                selecting = false
                this.selectionRange.setData([])
            })

            this.chart.subscribeClick((params) => {
                if (!selecting) {
                    times.A = params.time
                    prices.A = this._getCurrentHighestPrice()
                }
                else {
                    if (times.B < times.A) {
                        this.selectionRange.setData([{ time: times.B, value: prices.A }, { time: times.A, value: prices.A }])
                    }
                    else {

                        this.selectionRange.setData([{ time: times.A, value: prices.A }, { time: times.B, value: prices.A }])
                    }

                    handler(times.A, times.B)
                }
                selecting = !selecting
            });

            this.chart.subscribeCrosshairMove((params) => {
                if (selecting) {
                    times.B = params.time

                }
                // if (event.type === 'mousedown') {
                //     console.log('Mouse down!');
                // }

                // if (event.type === 'mouseup') {
                //     console.log('Mouse up!');
                // }
            });

        }
    }

    updateData(data, askPrice, bidPrice) {
        if (this.candleSeries && data.length > 0) {
            const mappedData = mapData(data);

            if (this.state.data.length === 0 && mappedData.price.length > 2) {
                this.setState({ data: mappedData.price });
                this.candleSeries.setData(mappedData.price);
                this.volumeSeries.setData(mappedData.volume);
            } else {
                this.setState((prevState) => ({ data: [...prevState.data, ...mappedData.price] }));
                mappedData.price.forEach(pricePoint => this.candleSeries.update(pricePoint));
                mappedData.volume.forEach(volumePoint => this.volumeSeries.update(volumePoint));
            }

            if (askPrice)
                this._updateAskPriceLine(askPrice)
            if (bidPrice)
                this._updateBidPriceLine(bidPrice)
        }
    }

    render() {
        return (
            <>
                <nav>{this.title}</nav>
                <div ref={this.chartContainerRef} style={{ width: '100%', height: '400px' }} />
            </>)
    }
};
