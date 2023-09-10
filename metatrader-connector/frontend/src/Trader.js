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
                </tr>
                <tr>
                    <td>
                        <div class="input-wrapper">
                            <div class="orangeTag">Risk[%]</div>
                            <input type="text" value={props.trade.risk} />
                        </div>
                    </td>
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
                            <div class="blueTag">Ask</div>
                            <input type="text" value={props.trade.ask} />
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="input-wrapper">
                            <div class="redTag">Bid</div>
                            <input type="text" value={props.trade.bid} />
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};



const Trader = (props) => {

    const [trade, setTrade] = useState({ risk: 1.0, ratio: 50.0, bid: 0, ask: 0 });


    const calculateEntry = (ask, bid, balance) => {
        setTrade({ bid: bid, ask: ask });
    }

    React.useEffect(() => {
        var instruments = props.data.instruments;
        var selected = props.instrument;
        for (var i = 0; i < instruments.length; ++i) {
            var items = instruments[i].items;
            if (items[0] == selected) {
                calculateEntry(items[1], items[2], props.data.account.balance)
                break;
            }
        }

    }, [props.data.instruments]);

    return (
        <>
            <Buttons customClass={"clsTrader"} />
            <Calculator customClass={props.customClass} trade={trade} instrument={props.instrument} />
            <Orders customClass={"clsTrader"} />
        </>
    )

}



export { Trader as default };
