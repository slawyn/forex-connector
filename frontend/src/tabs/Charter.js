import React from "react";
import ReactApexChart from "react-apexcharts";




const Charter = ({ customClass, id, symbol, timeframes, charterdata}) => {
    const formatter = (value)=> {
        if(value !== undefined)
        {

            if(symbol !== undefined) {
                return value.toFixed(symbol.digits)
                // TOOD fix this
            }
            return value.toFixed(6)
        }
        return ''
    }





    const mapChartdata = (id, timeframe, charterdata)=> {
        if(timeframe in charterdata && id in charterdata[timeframe]) {
            const symbolrates = charterdata[timeframe][id]
            return Object.entries(symbolrates).map(([timestamp, object]) => { return { x: new Date(parseInt(timestamp)), y: [object.open, object.high, object.low, object.close]  }})
        }
        return []
    };

    const mapLinedata = (id, timeframe, charterdata, priceLine)=> {
        if(timeframe in charterdata && id in charterdata[timeframe]) {
            const symbolrates = charterdata[timeframe][id]
            return [{x:new Date(parseInt(Object.keys(symbolrates)[0])), y:priceLine},{x:new Date(), y:priceLine}]
        }
        return []
    };

    let charts = [];
    timeframes.forEach((timeframe, index) => {
        const options = {
            plugins: {
                tooltip: {}
            },
            colors: ["#008000",  "#00BBFF", "#FF0000",],
            legend: {
                show: false
            },
            xaxis: {
                type: 'datetime',
            },
            yaxis: {
                labels: {
                    formatter
                }
            },
            title: {
                align: 'left',
                text :  `${id}#${timeframe}`
            },
            chart: {
                type: 'line',
              },
            stroke: {
                width: [0.8, 1]
              },
              tooltip: {
                shared: true,
                custom: [function({ seriesIndex, dataPointIndex, w }) {
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
                function({seriesIndex, dataPointIndex, w}) {
                    return w.globals.series[seriesIndex][dataPointIndex]
                  }, 
                function({seriesIndex, dataPointIndex, w}) {
                    return w.globals.series[seriesIndex][dataPointIndex]
                  },]
              },
        };  
        
        const series = [
            {
                name: 'candles',
                type: 'candlestick',
                data: mapChartdata(id, timeframe, charterdata)
            },
            {
                name: 'ask',
                type:'line',
                data: mapLinedata(id, timeframe, charterdata, symbol.ask)
            },
            {
                name: 'bid',
                type:'line',
                data: mapLinedata(id, timeframe, charterdata, symbol.bid)
            },
        ];
      
        /** check arrangement */
        if(charts.length % 2 === 1 )
        {   
            charts.push(<div className="cls100PContainer">
                            <div className="cls50PContainer">
                                {charts.pop()}
                            </div>
                            <div className="cls50PContainer">
                                <ReactApexChart options={options} series={series}/>
                            </div>
                        </div>)
            charts.push(<></>)
            
        }
        else if ( timeframes.length === index + 1 )
        {   
            charts.push(<div className="cls100PContainer">
                        <ReactApexChart options={options}  series={series}/>
                        </div>)
        }
        else
        {
            charts.push(<ReactApexChart options={options}  series={series}/>)
        }
    })

    return (
        <>
        { charts }
        </>
    )
}


export { Charter as default };