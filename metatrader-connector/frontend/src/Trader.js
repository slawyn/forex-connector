import React, { useRef, useState, useEffect, createRef } from "react";
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InputAdornment from '@mui/material/InputAdornment';


/*  // Situation 1, fixed lots and stop loss points, how much is at risk
 double riskPoints = 75; // 0.0075 foR EURJPY, 0.00075 for EURGBP and AUDZND
 double riskLots = 0.60;
 double riskAmount = pointValue*riskLots*riskPoints;
 PrintFormat(“Risk amount for %s trading %f lots with risk of %f points is %f”,
 symbol, riskLots, riskPoints, riskAmount);
 
 // Situation 2, fixed lots and risk amount, how many points to set stop loss
 
 double riskLots = 0.60;
 double riskAmount = 100;
 double riskPoints = riskAmount/(pointValue*riskLots);
 PrintFormat(“Risk points for %s trading %f lots placing %f at risk is %f”,
 symbol, riskLots, riskAmount, riskPoints);
 
 // Situation 3, fixed risk amount and stop loss, how many lots to trade
 
 double riskAmount = 100;
 double riskPoints = 50;
 double riskLots = riskAmount/(pointValue*riskPoints);
 PrintFormat(“Risk lots for %s value %f and stop loss at %f points is %f”,
 symbol, riskAmount, riskPoints, riskLots);
 
 pointvalue = (tickvalue*pointsize)/ticksize  */




const Orders = (props) => {
    return (
        <table className={props.customClass} >
            <tbody>
                <tr>
                    <td>
                        <button className={"clsOrangebutton"} >{"Save to Google"}</button>
                    </td>
                </tr>
            </tbody>
        </table >
    );
};

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});


const Calculator = (props) => {

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <table >
                <tbody>
                    <tr>
                        <td>Symbol: {props.trade.name}</td>
                        <td>Point Value: {props.trade.point_value}</td>
                    </tr>
                    <tr>
                        <td>
                            <TextField
                                id="trade-volume"
                                type="number"
                                value={props.trade.riskVolume}
                                variant="outlined"
                                inputProps={{
                                    step: props.trade.volume_step,
                                }}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { props.handlervolume(e.target.value) }}
                                label="Risk Volume"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">LOT</InputAdornment>,
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-risk"
                                type="number"
                                value={props.trade.risk}
                                variant="outlined"
                                inputProps={{
                                    step: props.trade.risk_step
                                }}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { props.handlerrisk(e.target.value) }}
                                label="Risk"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-ratio"
                                type="number"
                                value={props.trade.ratio}
                                variant="outlined"
                                inputProps={{
                                    step: "1"
                                }}
                                InputLabelProps={{ shrink: true }}
                                label="Ratio"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                }}
                            />
                        </td>
                    </tr>

                    <tr>

                        <td>
                            <TextField
                                id="trade-ask"
                                label="Ask"
                                value={props.trade.ask}
                                helperText=""
                            />
                            <button className={"clsBluebutton"} >{"Market.Buy"}</button>
                            <button className={"clsBluebutton"} >{"Limit.Buy"} </button>
                            <button className={"clsBluebutton"}>{"Stop.Buy"}</button>
                        </td>
                        <td>
                            <TextField
                                id="trade-bid"
                                label="Bid"
                                value={props.trade.bid}
                                helperText=""
                            />
                            <button className={"clsRedbutton"}>{"Market.Sell"} </button>
                            <button className={"clsRedbutton"}>{"Limit.Sell"} </button>
                            <button className={"clsRedbutton"}>{"Stop.Sell"}</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </ThemeProvider>
    );
};



const Trader = (props) => {
    const [trade, setTrade] = useState({ name: "", risk: 1.00, ratio: 50.0, bid: 0, ask: 0, riskVolume: 0, volume_step: 0, risk_step: 0.25, balance: 0, point_value: 0 });

    React.useEffect(() => {
        setTrade({
            name: props.symbolData.name,
            bid: props.symbolData.bid,
            ask: props.symbolData.ask,
            riskVolume: props.symbolData.volume_step,
            volume_step: props.symbolData.volume_step,
            balance: props.account.balance,
            point_value: props.symbolData.point_value
        });
    }, [props.symbolData, props.account.balance]);

    const handleVolumeChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            riskVolume: value
        }));
    };

    const handleRiskChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            risk: value
        }));
    };

    return (
        <>
            <Calculator customClass={props.customClass} trade={trade} handlervolume={handleVolumeChange} handlerrisk={handleRiskChange} />
            <Orders customClass={"clsTrader"} />
        </>
    )

}



export { Trader as default };
