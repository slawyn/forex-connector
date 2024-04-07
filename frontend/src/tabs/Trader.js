import React from "react";
import Orders from "./Orders";
import { Calculator, getCorrespondingClosingType } from "./Calculator";

function round(number, digits) {
    const d = Math.pow(10, digits);
    return Math.round((number + Number.EPSILON) * d) / d;
}

function calculatePoints(ask, riskAmount, contractSize, pointValue, riskLot, conversion) {
    if (conversion) {
        pointValue = 1 / ask;
    }
    return (riskAmount / (contractSize * pointValue * riskLot));
};

function calculateInitialRisk(ask, bid, riskAmount, contractSize, pointValue, volumeStep, conversion) {
    if (conversion) {
        pointValue = 1 / ask;
    }

    const INITIAL_SPREAD_AMOUNT = 10
    const priceRisk = (ask - bid) * INITIAL_SPREAD_AMOUNT
    const riskLot = (riskAmount / (contractSize * pointValue * priceRisk));
    const initialRiskLot = Math.trunc(riskLot / volumeStep) * volumeStep
    if (initialRiskLot < volumeStep) {
        return volumeStep
    }

    return initialRiskLot
}

const Trader = ({ customClass, account, symbol, headers, data, handlers, preview }) => {
    const INITIAL_RISK_PERCENTAGE = 1.00
    const INITIAL_RISK = INITIAL_RISK_PERCENTAGE / 100.0
    const [trade, setTrade] = React.useState({
        name: "",
        type: "",
        risk: INITIAL_RISK_PERCENTAGE,
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
        const risk = calculateInitialRisk(
            symbol.ask,
            symbol.bid,
            trade.risk * INITIAL_RISK * account.balance,
            symbol.contract_size,
            symbol.point_value,
            symbol.volume_step,
            symbol.conversion)

        const points = calculatePoints(
                symbol.ask,
                trade.risk * INITIAL_RISK * account.balance,
                symbol.contract_size,
                symbol.point_value,
                risk,
                symbol.conversion)

        setTrade((previousTrade) => ({
            ...previousTrade,
            name: symbol.name,
            bid: symbol.bid,
            ask: symbol.ask,
            risk_volume: risk,
            volume_step: symbol.volume_step,
            balance: account.balance,
            point_value: symbol.point_value,
            contract_size: symbol.contract_size,
            digits: symbol.digits,
            tick_size: symbol.tick_size,
            tick_value: round(symbol.tick_value, 4),
            conversion: symbol.conversion,
            points: points
        }));

    }, [symbol, account.balance, trade.ratio, trade.risk, INITIAL_RISK]);
    calculateParameters(trade.ask, trade.bid, trade.ratio, trade.points)


    function calculateParameters(ask, bid, ratio, points) {
        const sl = [ask - points, bid + points];
        const tp = [ask + (points * ratio), bid - (points * ratio)];
        handlers.commandPreview( ask, bid, sl, tp );
    }


    function handleVolumeChange(risk_volume) {
        const points = calculatePoints(
            trade.ask,
            trade.risk * 0.01 * trade.balance,
            trade.contract_size,
            trade.point_value,
            risk_volume,
            symbol.conversion)

        setTrade((previousTrade) => ({
            ...previousTrade,
            risk_volume: parseFloat(risk_volume),
            points: points
        }));

        calculateParameters(trade.ask, trade.bid, trade.ratio, points)
    };

    function handleTypeChange(type) {
        setTrade((previousTrade) => ({
            ...previousTrade,
            type: type
        }));
    };

    function handleRiskChange(value) {
        const points = calculatePoints(
            trade.ask,
            value * 0.01 * trade.balance,
            trade.contract_size,
            trade.point_value,
            trade.risk_volume,
            symbol.conversion)

        setTrade((previousTrade) => ({
            ...previousTrade,
            risk: parseFloat(value),
            points: points
        }));

        calculateParameters(trade.ask, trade.bid, trade.ratio, points)
    };

    function handleRatioChange(value) {
        const points = calculatePoints(
            trade.ask,
            trade.risk * 0.01 * trade.balance,
            trade.contract_size,
            trade.point_value,
            trade.risk_volume,
            symbol.conversion)

        setTrade((previousTrade) => ({
            ...previousTrade,
            ratio: parseFloat(value),
            points: points
        }));

        calculateParameters(trade.ask, trade.bid, trade.ratio, points)
    };

    function handleCommentChange(value) {
        setTrade((previousTrade) => ({
            ...previousTrade,
            comment: value
        }));
    };

    function handleAskChange(value) {
        const ask = parseFloat(value)
        setTrade((previousTrade) => ({
            ...previousTrade,
            ask: ask
        }));

        calculateParameters(ask, trade.bid, trade.ratio, trade.points)
    };

    const handleBidChange = (value) => {
        const bid = parseFloat(value)
        setTrade((previousTrade) => ({
            ...previousTrade,
            bid: bid
        }));

        calculateParameters(trade.ask, bid, trade.ratio, trade.points)
    };


    function handleOpenTrade() {
        var request = {
            symbol: trade.name,
            position: 0,
            lot: trade.risk_volume,
            type: trade.type,
            entry_buy: trade.ask,
            entry_sell: trade.bid,
            stoploss_sell: round(trade.bid + trade.points, trade.digits),
            stoploss_buy: round(trade.ask - trade.points, trade.digits),
            takeprofit_sell: round(trade.bid - (trade.points) * trade.ratio, trade.digits),
            takeprofit_buy: round(trade.ask + (trade.points) * trade.ratio, trade.digits),
            comment: generateComment(trade.risk, trade.comment)
        }
        handlers.requestTrade(request);
    };

    function generateComment(risk, text) {
        var comment = `[R:${risk}%, ]` + text;
        return comment;
    };

    function handleCloseTrade(type, name, position, volume, ask, bid) {

        let close_type = getCorrespondingClosingType(type);
        let request = {
            symbol: name,
            position: position,
            lot: volume,
            type: close_type,
            entry_buy: ask,
            entry_sell: bid
        };

        handlers.requestTrade(request);
    };

    return (
        <>
            <div className="cls50PContainer">
                <Calculator customClass="clsBorderless"
                    trade={trade}
                    handlers={{
                        handleOpenTrade,
                        handleTypeChange,
                        handleVolumeChange,
                        handleRiskChange,
                        handleRatioChange,
                        handleCommentChange,
                        handleAskChange,
                        handleBidChange
                    }}
                />
            </div>
            <div className="cls50PContainer">
                <Orders customClass={customClass}
                    headers={headers}
                    data={data}
                    handlers={{ handleCloseTrade }}
                />
            </div>
        </>
    )
}

Trader.whyDidYouRender = false
export { Trader as default };
