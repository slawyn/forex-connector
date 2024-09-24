import React from "react";
import Orders from "./Orders";
import Calculator from "./Calculator";
import { createPostRequest } from "../utils";

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

    const INITIAL_SPREAD_AMOUNT = 5
    const priceRisk = (ask - bid) * INITIAL_SPREAD_AMOUNT
    const riskLot = (riskAmount / (contractSize * pointValue * priceRisk));
    const initialRiskLot = Math.trunc(riskLot / volumeStep) * volumeStep
    if (initialRiskLot < volumeStep) {
        return volumeStep
    }

    return initialRiskLot
}

function buildBaseRequest(symbol, type, lot, comment) {
    return { symbol, lot, comment, type }
}

function buildBuyRequest(request, ask, bid, points, digits, ratio) {
    request.price = ask
    request.stoploss = round(ask - points, digits)
    request.takeprofit = round(ask + (points) * ratio, digits)
    return request
}

function buildBuyStopLimitRequest(request, ask, bid, points, digits, ratio) {
    request.price = ask
    request.stoploss = round(ask - points, digits)
    request.takeprofit = round(ask + (points) * ratio, digits)
    request.pending = true
    return request
}

function buildSellRequest(request, ask, bid, points, digits, ratio) {
    request.price = bid
    request.stoploss = round(bid + points, digits)
    request.takeprofit = round(bid - (points) * ratio, digits)
    return request
}

function buildSellStopLimitRequest(request, ask, bid, points, digits, ratio) {
    request.price = bid
    request.stoploss = round(bid + points, digits)
    request.takeprofit = round(bid - (points) * ratio, digits)
    request.pending = true
    return request
}

const Trader = ({ customClass, account, symbol, headers, data, handlers }) => {
    const REQUEST_BUILD_HANDLERS = {
        "market_buy": buildBuyRequest,
        "limit_buy": buildBuyStopLimitRequest,
        "stop_buy": buildBuyStopLimitRequest,
        "market_sell": buildSellRequest,
        "limit_sell": buildSellStopLimitRequest,
        "stop_sell": buildSellStopLimitRequest,
    }
    const INITIAL_RISK_PERCENTAGE = 1.00
    const INITIAL_RISK = INITIAL_RISK_PERCENTAGE / 100.0
    const localSymbol = React.useRef();
    const localFreezePrice = React.useRef(false);
    const [trade, setTrade] = React.useState({
        name: "",
        type: "",
        risk: INITIAL_RISK_PERCENTAGE,
        ratio: 2.25,
        ratio_step: 0.25,
        bid: 0.0,
        ask: 0.0,
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

    if (localSymbol.current !== symbol) {

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

        /** Partial update, Only price has been updated */
        if (localSymbol.current && localSymbol.current.name === symbol.name) {
            if (!localFreezePrice.current) {
                setTrade((previousTrade) => ({
                    ...previousTrade,
                    bid: symbol.bid,
                    ask: symbol.ask,
                    balance: account.balance,
                    point_value: symbol.point_value,
                    tick_value: round(symbol.tick_value, 4),
                }));
            }
        }
        /* Full update */
        else {
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
            calculateParameters(symbol.ask, symbol.bid, trade.ratio, points)
        }
        localSymbol.current = symbol
    }

    function _getCorrespondingClosingType(type) {
        let close_type = ""
        if (type.includes("buy")) {
            close_type = "close_buy";
        } else {
            close_type = "close_sell";
        }
    
        return close_type;
    };

    function requestTrade(request) {
        const requestOptions = createPostRequest(request)
        fetch('/trade', requestOptions).then(response =>
            response.json()).then(((idResponse) => {
                handlers.setErrorData({
                    error: idResponse.error,
                    text: idResponse.text
                });
                if (idResponse.error !== 10009) {
                    throw new Error(`Result: [${idResponse.error}] ${idResponse.text} `);
                }
            }));
    };



    function calculateParameters(ask, bid, ratio, points) {
        const sl = [ask - points, bid + points];
        const tp = [ask + (points * ratio), bid - (points * ratio)];
        handlers.setCommand(ask, bid, sl, tp);
    }

    function handleVolumeChange(risk_volume) {
        const points = calculatePoints(
            trade.ask,
            trade.risk * 0.01 * trade.balance,
            trade.contract_size,
            trade.point_value,
            risk_volume,
            trade.conversion)

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

        localFreezePrice.current = (type.includes("limit") || type.includes("stop"))
    };

    function handleRiskChange(risk) {
        const points = calculatePoints(
            trade.ask,
            risk * 0.01 * trade.balance,
            trade.contract_size,
            trade.point_value,
            trade.risk_volume,
            trade.conversion)

        setTrade((previousTrade) => ({
            ...previousTrade,
            risk: parseFloat(risk),
            points: points
        }));

        calculateParameters(trade.ask, trade.bid, trade.ratio, points)
    };

    function handleRatioChange(ratio) {
        const points = calculatePoints(
            trade.ask,
            trade.risk * 0.01 * trade.balance,
            trade.contract_size,
            trade.point_value,
            trade.risk_volume,
            trade.conversion)

        setTrade((previousTrade) => ({
            ...previousTrade,
            ratio: parseFloat(ratio),
            points: points
        }));

        calculateParameters(trade.ask, trade.bid, trade.ratio, points)
    };

    function handleCommentChange(comment) {
        setTrade((previousTrade) => ({
            ...previousTrade,
            comment: comment
        }));
    };

    function handleAskChange(ask) {
        setTrade((previousTrade) => ({
            ...previousTrade,
            ask: parseFloat(ask)
        }));

        calculateParameters(ask, trade.bid, trade.ratio, trade.points)
    };

    const handleBidChange = (bid) => {
        setTrade((previousTrade) => ({
            ...previousTrade,
            bid: parseFloat(bid)
        }));

        calculateParameters(trade.ask, bid, trade.ratio, trade.points)
    };

    function handleOpenTrade() {
        const comment = generateComment(trade.risk, trade.comment)
        const request = REQUEST_BUILD_HANDLERS[trade.type](
            buildBaseRequest(trade.name, trade.type, trade.risk_volume, comment),
            trade.ask,
            trade.bid,
            trade.points,
            trade.digits,
            trade.ratio,
        )
        requestTrade(request);
    };

    function generateComment(risk, text) {
        let comment = ''
        if (text !== undefined) {
            comment = text;
        }
        return `R${risk}%G${trade.ratio}%` + comment;
    };




    function handleCloseTrade(type, name, position, volume) {
        let request = {
            symbol: name,
            position: position,
            lot: volume,
            type: _getCorrespondingClosingType(type)
        };

        requestTrade(request);
    };

    return (
        <>
            <nav className="cls50PContainer">
                <Calculator customClass={customClass}
                    trade={trade}
                    types={Object.keys(REQUEST_BUILD_HANDLERS)}
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
            </nav>
            <nav className="cls50PContainer">
                <Orders customClass={customClass}
                    headers={headers}
                    data={data}
                    handlers={{ handleCloseTrade }}
                />
            </nav>
        </>
    )
}

Trader.whyDidYouRender = false
export { Trader as default };
