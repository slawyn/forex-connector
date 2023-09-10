import React, { useRef, useState, useEffect, createRef } from "react";
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';



const Buttona = ({ name, customClass }) => {
    const buttonRef = useRef(null);
    return (
        <button className={customClass} >{name}</button>
    );
};


const Trader = (props) => {

    const [trade, setTrade] = useState({ risk: 1, ratio: 50, bid: 0, ask: 0 });


    const calculateEntry = () => {
        var selected = props.instrument;
        var instruments = props.terminalData.instruments;
        var balance = props.terminalData.balance;
        var selBid = 0;
        var selAsk = 0;
        var selSpread = 0;
        var risk = 0;
        var calcAsk = 0;
        var calcBid = 0;
        for (var i = 0; i < instruments.length; ++i) {
            if (instruments[i].items[0] == selected) {
                risk = balance;
            }
        }

        return [calcAsk, calcBid];
    }

    const calculateRatio = () => {
        return props.terminalData.account.balance;
    }


    return (
        <>
            <table className="clsTrader" >
                <tbody>
                    <tr>

                        <td className={props.customClass}>Selected:{props.instrument}</td>
                    </tr>
                    <tr>
                        <td>
                            <Buttona name={"Save to Google"} customClass={"orangebutton"} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Buttona name={"Buy[Market]"} customClass={"bluebutton"} />
                        </td>
                        <td>
                            <Buttona name={"Buy[Limit]"} customClass={"bluebutton"} />
                        </td>
                        <td>
                            <Buttona name={"Buy[Stop]"} customClass={"bluebutton"} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Buttona name={"Sell[Market]"} customClass={"redbutton"} />
                        </td>
                        <td>
                            <Buttona name={"Sell[Limit]"} customClass={"redbutton"} />
                        </td>
                        <td>
                            <Buttona name={"Sell[Stop]"} customClass={"redbutton"} />
                        </td>
                    </tr>
                </tbody>
            </table >
            <table class="clsTrader" >
                <tbody>
                    <tr>
                        <td>
                            <div class="input-wrapper">
                                <div class="orangeTag">Risk[%]</div>
                                <input type="text" value={trade.risk} />
                            </div>
                        </td>
                        <td>
                            <div class="input-wrapper">
                                <div class="orangeTag">Ratio[%]</div>
                                <input type="text" value={trade.ratio} />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="input-wrapper">
                                <div class="blueTag">Ask</div>
                                <input type="text" value={trade.ask} />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="input-wrapper">
                                <div class="redTag">Bid</div>
                                <input type="text" value={trade.bid} />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="clsTrader" >
                <tbody>
                    <tr>
                        <td>

                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    )

}



export { Trader as default };
