import React, { useRef, useState, useEffect, createRef } from "react";
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';


const Orders = (props) => {
    return (
        <table className={props.customClass} >
            <tbody>
                <tr>
                    <td>
                        <button class={"orangebutton"} >{"Save to Google"}</button>
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

const Buttons = (props) => {
    return (
        <table className={props.customClass} >
            <tbody>
                <tr>
                    <td>
                        <button class={"bluebutton"} >{"Market.Buy"}</button>
                    </td>
                    <td>
                        <button class={"bluebutton"} >{"Limit.Buy"} </button>
                    </td>
                    <td>
                        <button class={"bluebutton"}>{"Stop.Buy"}</button>
                    </td>
                </tr>
                <tr>
                    <td>
                        <button class={"redbutton"}>{"Market.Sell"} </button>
                    </td>
                    <td>
                        <button class={"redbutton"}>{"Limit.Sell"} </button>
                    </td>
                    <td>
                        <button class={"redbutton"}>{"Stop.Sell"}</button>
                    </td>
                </tr>
            </tbody>
        </table >
    );
};

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
                                TextField
                                type="number"
                                value={props.trade.riskVolume}
                                variant="outlined"
                                inputProps={{
                                    step: props.trade.volume_step,
                                }}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { props.handlervolume(e.target.value) }}
                                label="Volume[LOT]"
                            />
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <TextField
                                id="trade-ratio"
                                TextField
                                type="number"
                                value={props.trade.ratio}
                                variant="outlined"
                                inputProps={{
                                    step: "1"
                                }}
                                InputLabelProps={{ shrink: true }}
                                label="Ratio[%]"
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
                                inputProps={{
                                    step: props.trade.risk_step
                                }}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { props.handlerrisk(e.target.value) }}
                                label="Risk[%]"
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-ask"
                                label="Ask"
                                value={props.trade.ask}
                                helperText=""
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-bid"
                                label="Bid"
                                value={props.trade.bid}
                                helperText=""
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </ThemeProvider>
    );
};



const Trader = (props) => {
    const [trade, setTrade] = useState({ name: "", risk: 1.0, ratio: 50.0, bid: 0, ask: 0, riskVolume: 0, volume_step: 0, risk_step: 1, balance: 0 });

    React.useEffect(() => {
        console.log(props.symbolData);
        setTrade({ name: props.symbolData.name, bid: props.symbolData.bid, ask: props.symbolData.ask, riskVolume: props.symbolData.volume_step, volume_step: props.symbolData.volume_step, balance: props.account.balance });
    }, [props.symbolData, props.account.balance]);

    const handleVolumeChange = (value) => {

        console.log(value);
        setTrade((previousTrade) => ({
            ...previousTrade,
            riskVolume: value
        }));
    };

    const handleRiskChange = (value) => {
        console.log(value);
        setTrade((previousTrade) => ({
            ...previousTrade,
            risk: value
        }));
    };

    return (
        <>
            <Calculator customClass={props.customClass} trade={trade} handlervolume={handleVolumeChange} handlerrisk={handleRiskChange} />
            <Orders customClass={"clsTrader"} />
            <Buttons customClass={"clsTrader"} />
        </>
    )

}
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


export { Trader as default };
