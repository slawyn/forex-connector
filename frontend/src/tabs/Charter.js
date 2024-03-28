import React from "react";
import Chart from "react-apexcharts";




const Charter = ({ customClass, id, symbol, timeframes, charterdata}) => {
    const formatter = (value)=> {
        if(symbol !== undefined) {
            return value.toFixed(symbol.digits)
            // TOOD fix this
        }
        return value.toFixed(6)
    }





    const mapChartdata = (id, timeframe, charterdata)=> {
        if(timeframe in charterdata) {
            const symbolrates = charterdata[timeframe]
            if (id in symbolrates)
            {
                const data =  { data: Object.entries(symbolrates[id]).map(([timestamp, object]) => { return { x: new Date(parseInt(timestamp)), y: [object.open, object.high, object.low, object.close]  }})}
                return [data]
            }
        }
        return []
    };

    let charts = [];
    timeframes.forEach((timeframe, index) => {
        const options = {
            plugins: {
                tooltip: {}
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
        };  
      
        /** check arrangement */
        if(charts.length % 2 === 1 )
        {   
            charts.push(<div className="cls100PContainer">
                            <div className="cls50PContainer">
                                {charts.pop()}
                            </div>
                            <div className="cls50PContainer">
                                <Chart options={options} series={mapChartdata(id, timeframe, charterdata)} type="candlestick" />
                            </div>
                        </div>)
            charts.push(<></>)
            
        }
        else if ( timeframes.length === index + 1 )
        {   
            charts.push(<div className="cls100PContainer">
                        <Chart options={options} series={mapChartdata(id, timeframe, charterdata)} type="candlestick" />
                        </div>)
        }
        else
        {
            charts.push(<Chart options={options} series={mapChartdata(id, timeframe, charterdata)} type="candlestick" />)
        }
    })

    return (
        <>
        { charts }
        </>
    )
}


export { Charter as default };