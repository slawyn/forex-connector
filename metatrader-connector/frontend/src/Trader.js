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

const calculatePoints = (riskAmount, contractSize, pointValue, riskLot) => {
    console.log(riskAmount, pointValue, riskLot);
    var points = (riskAmount / (contractSize * pointValue * riskLot));
    return points;
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

                    </tr>
                    <tr>
                        <td>
                            <TextField
                                id="trade-volume"
                                type="number"
                                value={props.trade.riskVolume}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { props.handlervolume(e.target.value) }}
                                label="Risk Volume"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">LOT</InputAdornment>,
                                    step: props.trade.volume_step,
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="outlined-read-only-input"
                                label="Point Value"
                                value={props.trade.point_value}
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        </td>

                    </tr>
                    <tr>
                        <td>
                            <TextField
                                id="trade-risk"
                                type="number"
                                value={props.trade.risk}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { props.handlerrisk(e.target.value) }}
                                label="Risk"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                    step: props.trade.risk_step
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="outlined-read-only-input"
                                label="Contract Size"
                                value={props.trade.contract_size}
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <TextField
                                id="trade-ratio"
                                type="number"
                                value={props.trade.ratio}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                label="Risk Ratio"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                    step: props.trade.ratio_step
                                }}
                            />
                        </td>
                    </tr>
                    <tr>
                    </tr>
                    <tr>
                        <td>
                            <TextField
                                id="trade-ask"
                                label="Ask"
                                type="number"
                                value={props.trade.ask}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Price</InputAdornment>,
                                }}
                            />
                            <button className={"clsBluebutton"} onClick={() => { props.handlertrade("market_buy") }}>{"Market.Buy"}</button>
                            <button className={"clsBluebutton"} onClick={() => { props.handlertrade("limit_buy") }}>{"Limit.Buy"} </button>
                            <button className={"clsBluebutton"} onClick={() => { props.handlertrade("stop_buy") }}  >{"Stop.Buy"}</button>
                        </td>
                        <td>
                            <TextField
                                id="outlined-read-only-input"
                                label="Price Points"
                                value={props.trade.points}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">PP</InputAdornment>,
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-bid"
                                label="Bid"
                                type="number"
                                value={props.trade.bid}
                                helperText=""
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Price</InputAdornment>,
                                }}
                            />
                            <button className={"clsRedbutton"} onClick={() => { props.handlertrade("market_sell") }}>{"Market.Sell"} </button>
                            <button className={"clsRedbutton"} onClick={() => { props.handlertrade("limit_sell") }}>{"Limit.Sell"} </button>
                            <button className={"clsRedbutton"} onClick={() => { props.handlertrade("stop_sell") }}  >{"Stop.Sell"}</button>
                        </td>

                    </tr>
                </tbody>
            </table>
        </ThemeProvider>
    );
};



const Trader = (props) => {
    const [trade, setTrade] = useState({ name: "", risk: 1.00, ratio: 2.25, ratio_step: 0.25, bid: 0, ask: 0, riskVolume: 0, volume_step: 0, risk_step: 0.25, balance: 0, point_value: 0, contract_size: 0, points: 0 });

    React.useEffect(() => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            name: props.symbolData.name,
            bid: props.symbolData.bid,
            ask: props.symbolData.ask,
            riskVolume: props.symbolData.volume_step,
            volume_step: props.symbolData.volume_step,
            balance: props.account.balance,
            point_value: props.symbolData.point_value,
            contract_size: props.symbolData.contract_size,
            points: calculatePoints(
                previousTrade.risk * 0.01 * props.account.balance,
                props.symbolData.contract_size,
                props.symbolData.point_value,
                props.symbolData.volume_step)
        }));
    }, [props.symbolData, props.account.balance]);

    const handleVolumeChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            riskVolume: value,
            points: calculatePoints(
                trade.risk * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                value)
        }));
    };

    const handleRiskChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            risk: value,
            points: calculatePoints(
                value * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                trade.riskVolume)
        }));
    };

    const handleTrade = (type) => {
        var request = {
            symbol: trade.name,
            lot: trade.riskVolume,
            type: type,
            entry_buy: trade.bid,
            entry_sell: trade.ask,
            stoploss_sell: trade.ask + trade.points,
            stoploss_buy: trade.bid - trade.points,
            takeprofit_buy: trade.bid + (trade.points) * trade.ratio,
            takeprofit_sell: trade.ask + (trade.points) * trade.ratio
        }
        props.handletrade(request);
    };

    return (
        <>
            <Calculator customClass={props.customClass} trade={trade} handlertrade={handleTrade} handlervolume={handleVolumeChange} handlerrisk={handleRiskChange} />
        </>
    )

}



export { Trader as default };
