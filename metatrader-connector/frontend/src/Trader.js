import React, { useRef, useState, useEffect, createRef } from "react";
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';

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
        <table className={props.customClass} >
            <tbody>
                <tr>
                    <td className={props.customClass}>Selected:{props.instrument}</td>
                    <td>
                        <div class="input-wrapper">
                            <div class="blueTag">Ask</div>
                            <input type="text" value={props.trade.ask} />
                        </div>
                    </td>
                    <td>
                        <div class="input-wrapper">
                            <div class="redTag">Bid</div>
                            <input type="text" value={props.trade.bid} />
                        </div>
                    </td>

                </tr>
                <tr>
                    <td>
                        <div class="input-wrapper">
                            <div class="orangeTag">Volume[LOT]</div>
                            <input type="text" value={props.trade.volume} />
                        </div>
                    </td>
                </tr>

                <tr>
                    <td>
                        <div class="input-wrapper">
                            <div class="orangeTag">Ratio[%]</div>
                            <input type="text" value={props.trade.ratio} />
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="input-wrapper">
                            <div class="orangeTag">Risk[%]</div>
                            <input type="text" value={props.trade.risk} />
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};



const Trader = (props) => {
    const [trade, setTrade] = useState({ risk: 1.0, ratio: 50.0, bid: 0, ask: 0, volume: 0 });

    const calculateEntry = (ask, bid, volume, balance) => {
        var calcBid = bid * volume;
        var calcAsk = ask
        setTrade({ bid: calcBid, ask: calcAsk, volume: volume });
    }

    React.useEffect(() => {
        var instruments = props.data;
        var selected = props.instrument;
        var item = instruments[selected];
        if (item != null && item[0] === selected) {
            calculateEntry(item[1], item[2], item[3], props.account.balance)
        }


    }, [props.data]);

    return (
        <>
            <Buttons customClass={"clsTrader"} />
            <Calculator customClass={props.customClass} trade={trade} instrument={props.instrument} />
            <Orders customClass={"clsTrader"} />
        </>
    )

}



export { Trader as default };
