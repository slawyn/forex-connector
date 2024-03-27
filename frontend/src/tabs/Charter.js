import React from "react";
import Chart from "react-apexcharts";




const Charter = ({ id, symbol, charterdata, customClass }) => {
    const formatter = (value)=> {
        if(symbol !== undefined)
        {
            return value.toFixed(symbol.digits)
            // TOOD fix this
        }
        return value.toFixed(6)
    }

    const chartref = React.useRef(null);
    const options = {
        plugins: {
            tooltip: {}
        },
        chart: {
            type: 'candlestick',
            height: 350
        },
        xaxis: {
            type: 'datetime',
        },
        data:[],
        yaxis: {
            labels:
            {
                formatter
            }
        },
        title: {
            text: id,
            align: 'left'
        },
    };


    const mapChartdata =(charterdata)=> {
        if(id in charterdata)
        {
            const data =  { data: Object.entries(charterdata[id]).map(([timestamp, object]) => { return { x: new Date(parseInt(timestamp)), y: [object.open, object.high, object.low, object.close]  }})}
            return [data]
        }
        return []
    };
    
    return <Chart ref={chartref} options={options} series={mapChartdata(charterdata)} type="candlestick" />;
}


export { Charter as default };