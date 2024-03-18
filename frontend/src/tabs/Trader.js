import React from "react";
import Orders from "./Orders";
import { Calculator, getCorrespondingClosingType } from "./Calculator";

function round(number, digits) {
    const d = Math.pow(10, digits);
    return Math.round((number + Number.EPSILON) * d) / d;
}

function calculatePoints(ask, riskAmount, contractSize, pointValue, riskLot, digits, conversion) {
    let tickValue = 1 / ask;

    if (conversion) {
        pointValue = tickValue;
    }
    return (riskAmount / (contractSize * pointValue * riskLot));
};


const Trader = ({customClass, account, symbol, headers, data, handlers, preview}) => {
    const [trade, setTrade] = React.useState({
        name: "",
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
            name: symbol.name,
            bid: symbol.bid,
            ask: symbol.ask,
            risk_volume: symbol.volume_step,
            volume_step: symbol.volume_step,
            balance: account.balance,
            point_value: symbol.point_value,
            contract_size: symbol.contract_size,
            digits: symbol.digits,
            tick_size: symbol.tick_size,
            tick_value: symbol.tick_value,
            conversion: symbol.conversion,
            points: calculatePoints(
                symbol.ask,
                previousTrade.risk * 0.01 * account.balance,
                symbol.contract_size,
                symbol.point_value,
                symbol.volume_step,
                symbol.digits,
                symbol.conversion)
        }));
    }, [symbol, account.balance]);


    React.useEffect(() => {
       const sl = [trade.ask - trade.points, trade.bid + trade.points];
       const tp = [trade.ask + (trade.points * trade.ratio), trade.bid - (trade.points * trade.ratio)];
       handlers.commandPreview(trade.ask, trade.bid, sl, tp);
    }, [preview, trade.ratio, trade.points, trade.ask, trade.bid]);

    function handleVolumeChange (value) {
        setTrade((previousTrade) => ({
            ...previousTrade,
            risk_volume: parseFloat(value),
            points: calculatePoints(
                trade.ask,
                trade.risk * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                value,
                symbol.digits,
                symbol.conversion)
        }));
    };

    function handleRiskChange (value)  {
        setTrade((previousTrade) => ({
            ...previousTrade,
            risk: parseFloat(value),
            points: calculatePoints(
                trade.ask,
                value * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                trade.risk_volume,
                symbol.digits,
                symbol.conversion)
        }));
    };

    function handleRatioChange (value){
        setTrade((previousTrade) => ({
            ...previousTrade,
            ratio: parseFloat(value),
            points: calculatePoints(
                trade.ask,
                trade.risk * 0.01 * trade.balance,
                trade.contract_size,
                trade.point_value,
                trade.risk_volume,
                symbol.digits,
                symbol.conversion)
        }));
    };

    function handleCommentChange (value) {
        setTrade((previousTrade) => ({
            ...previousTrade,
            comment: value
        }));
    };

    function handleAskChange (value)  {
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


    function handleOpenTrade (type) {
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
        handlers.transmitTradeRequest(request);
    };

    function generateComment (risk, text) {
        var comment = `[R:${risk}%, ]` + text;
        return comment;
    };

    function handleCloseTrade (type, name, position, volume, ask, bid) {

        let close_type = getCorrespondingClosingType(type);
        let request = {
            symbol: name,
            position: position,
            lot: volume,
            type: close_type,
            entry_buy: ask,
            entry_sell: bid
        };

        handlers.transmitTradeRequest(request);
    };

    const handlersCalculator = {handleOpenTrade, handleVolumeChange,handleRiskChange, handleRatioChange, handleCommentChange, handleAskChange, handleBidChange};
    const handlersOrders = {handleCloseTrade};
    return (
        <>
            <div className="clsCalculator">
                <Calculator customClass="clsBorderless"
                    trade={trade}
                    handlers = {handlersCalculator}
                  />
            </div>
            <div className="clsOrders">
                <Orders customClass={customClass}
                    headers={headers}
                    data={data}
                    handlers={handlersOrders}
                />
            </div> 
        </>
    )
}

export { Trader as default };
