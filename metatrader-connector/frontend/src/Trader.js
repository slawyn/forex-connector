import React, { useRef, useState, useEffect, createRef } from "react";
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
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
            <table className="">
                <tbody>
                    <tr>
                        <td>Symbol: {props.trade.name}</td>
                        <td>Contract Size: {props.trade.contract_size}</td>
                        <td>Point Value: {props.trade.point_value}</td>
                        <td>Volume Step: {props.trade.volume_step}</td>
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
                                inputProps={{
                                    startAdornment: <InputAdornment position="start">LOT</InputAdornment>,
                                    step: props.trade.volume_step,
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-risk"
                                type="number"
                                value={props.trade.risk}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { props.handleRisk(e.target.value) }}
                                label="Risk"
                                inputProps={{

                                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                    step: props.trade.risk_step
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-ratio"
                                type="number"
                                value={props.trade.ratio}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                label="Risk Ratio"
                                onChange={(e) => { props.handleRatio(e.target.value) }}
                                inputProps={{
                                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                    step: props.trade.ratio_step
                                }}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <TextField
                                id="trade-ask"
                                label="Ask"
                                type="number"
                                value={props.trade.ask}
                                onChange={(e) => { props.handleAsk(e.target.value) }}
                                variant="outlined"
                                inputProps={{
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
                                inputProps={{
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start">PP</InputAdornment>,
                                }}
                            />
                            <TextField
                                id="outlined-helperText"
                                label="Comment"
                                value={props.trade.comment}
                                onChange={(e) => { props.handlercomment(e.target.value) }}
                                helperText="Strategy tracking"
                            />
                        </td>

                        <td>
                            <TextField
                                id="trade-bid"
                                label="Bid"
                                type="number"
                                value={props.trade.bid}
                                onChange={(e) => { props.handleBid(e.target.value) }}
                                helperText=""
                                inputProps={{
                                    startAdornment: <InputAdornment position="start">Price</InputAdornment>,
                                }}
                            />
                            <button className={"clsRedbutton"} onClick={() => { props.handlertrade("market_sell") }}>{"Market.Sell"} </button>
                            <button className={"clsRedbutton"} onClick={() => { props.handlertrade("limit_sell") }}>{"Limit.Sell"} </button>
                            <button className={"clsRedbutton"} onClick={() => { props.handlertrade("stop_sell") }}  >{"Stop.Sell"}</button>
                        </td>

                    </tr>

                    <tr>
                        <td>
                            <FormControlLabel
                                control={<Checkbox onChange={(e) => { props.handlePreview(e.target.checked) }} />}
                                label="Preview in MT5" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </ThemeProvider>
    );
};



const Trader = (props) => {
    const [trade, setTrade] = useState({ name: "", preview: false, risk: 1.00, ratio: 2.25, ratio_step: 0.25, bid: 0, ask: 0, riskVolume: 0, volume_step: 0, risk_step: 0.25, balance: 0, point_value: 0, contract_size: 0, points: 0 });

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


    React.useEffect(() => {
        console.log(trade.preview);
        if (trade.preview) {
            const sl = [trade.ask - trade.points, trade.bid + trade.points];
            const tp = [trade.ask + (trade.points) * trade.ratio, trade.bid - (trade.points) * trade.ratio];
            props.handlepreview(sl, tp);
        }
    }, [trade.preview, trade.points]);

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

    const handleRatioChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            ratio: value,
            points: calculatePoints(
                trade.risk * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                trade.riskVolume)
        }));
    };

    const handleCommentChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            comment: value
        }));
    };

    const handleAskChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            ask: value
        }));
    };

    const handleBidChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            bid: value
        }));
    };

    const handlePreviewChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            preview: value
        }));
    };

    const handleTrade = (type) => {
        var request = {
            symbol: trade.name,
            lot: trade.riskVolume,
            type: type,
            entry_buy: trade.ask,
            entry_sell: trade.bid,
            stoploss_sell: trade.bid + trade.points,
            stoploss_buy: trade.ask - trade.points,
            takeprofit_sell: trade.bid - (trade.points) * trade.ratio,
            takeprofit_buy: trade.ask + (trade.points) * trade.ratio,
            comment: generateComment(trade.risk, trade.comment)
        }
        props.handletrade(request);
    };

    const generateComment = (risk, text) => {

        var comment = `[Risk: ${risk}% ]` + text;
        return comment;
    };

    return (
        <>
            <Calculator
                customClass={props.customClass}
                trade={trade}
                handlertrade={handleTrade}
                handlervolume={handleVolumeChange}
                handleRisk={handleRiskChange}
                handleRatio={handleRatioChange}
                handlercomment={handleCommentChange}
                handleAsk={handleAskChange}
                handleBid={handleBidChange}
                handlePreview={handlePreviewChange} />

        </>
    )

}



export { Trader as default };
