import React, { useState } from "react";
import Orders from "./Orders";
import Calculator from "./Calculator";

function round(number, digits) {
    const d = Math.pow(10, digits);
    return Math.round((number + Number.EPSILON) * d) / d;
}

const calculatePoints = (ask, riskAmount, contractSize, pointValue, riskLot, digits, conversion) => {
    var tickValue = 1 / ask;

    if (conversion) {
        pointValue = tickValue;
    }
    var points = (riskAmount / (contractSize * pointValue * riskLot));
    return points;
};



const Trader = (props) => {
    const [trade, setTrade] = useState({
        name: "",
        preview: false,
        risk: 1.00,
        ratio: 2.25,
        ratio_step: 0.25,
        bid: 0,
        ask: 0,
        risk_volume: 0.0,
        volume_step: 0,
        risk_step: 0.25,
        balance: 0,
        point_value: 0,
        contract_size: 0,
        points: 0,
        digits: 0,
        tick_size: 0,
        tick_value: 0,
        conversion: false
    });

    React.useEffect(() => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            name: props.symbolData.name,
            bid: props.symbolData.bid,
            ask: props.symbolData.ask,
            risk_volume: props.symbolData.volume_step,
            volume_step: props.symbolData.volume_step,
            balance: props.account.balance,
            point_value: props.symbolData.point_value,
            contract_size: props.symbolData.contract_size,
            digits: props.symbolData.digits,
            tick_size: props.symbolData.tick_size,
            tick_value: props.symbolData.tick_value,
            conversion: props.symbolData.conversion,
            points: calculatePoints(
                props.symbolData.ask,
                previousTrade.risk * 0.01 * props.account.balance,
                props.symbolData.contract_size,
                props.symbolData.point_value,
                props.symbolData.volume_step,
                props.symbolData.digits,
                props.symbolData.conversion)
        }));
    }, [props.symbolData, props.account.balance]);


    React.useEffect(() => {
        console.log(trade.preview);
        if (trade.preview) {
            const sl = [trade.ask - trade.points, trade.bid + trade.points];
            const tp = [trade.ask + (trade.points * trade.ratio), trade.bid - (trade.points * trade.ratio)];
            props.handlepreview(trade.ask, trade.bid, sl, tp);
        }
    }, [trade.ratio, trade.preview, trade.points, trade.ask, trade.bid]);

    const handleVolumeChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            risk_volume: parseFloat(value),
            points: calculatePoints(
                trade.ask,
                trade.risk * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                value,
                props.symbolData.digits,
                props.symbolData.conversion)
        }));
    };

    const handleRiskChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            risk: parseFloat(value),
            points: calculatePoints(
                trade.ask,
                value * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                trade.risk_volume,
                props.symbolData.digits,
                props.symbolData.conversion)
        }));
    };

    const handleRatioChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            ratio: parseFloat(value),
            points: calculatePoints(
                trade.ask,
                trade.risk * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                trade.risk_volume,
                props.symbolData.digits,
                props.symbolData.conversion)
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
            ask: parseFloat(value)
        }));
    };

    const handleBidChange = (value) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            bid: parseFloat(value)
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
            position: 0,
            lot: trade.risk_volume,
            type: type,
            entry_buy: trade.ask,
            entry_sell: trade.bid,
            stoploss_sell: round(trade.bid + trade.points, trade.digits),
            stoploss_buy: round(trade.ask - trade.points, trade.digits),
            takeprofit_sell: round(trade.bid - (trade.points) * trade.ratio, trade.digits),
            takeprofit_buy: round(trade.ask + (trade.points) * trade.ratio, trade.digits),
            comment: generateComment(trade.risk, trade.comment)
        }
        props.handletrade(request);
    };

    const generateComment = (risk, text) => {
        var comment = `[Risk: ${risk}% ]` + text;
        return comment;
    };

    const handleCloseTrade = (name, position, volume) => {
        var request = {
            symbol: name,
            position: position,
            lot: volume,
            type: "close"
        }

        props.handletrade(request);
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

            <Orders customClass={props.customClass}
                headers={props.openHeaders}
                data={props.openData}
                handleClose={handleCloseTrade}
            />
        </>
    )

}

export { Trader as default };
