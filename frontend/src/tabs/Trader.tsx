import React, { useEffect, useRef, useState } from "react";
import Orders from "src/tabs/Orders";
import Calculator from "src/tabs/Calculator";
import { createPostRequest } from "src/utils";

const SPREADMULTIPLIFER = 5;

interface Trade {
  name: string;
  type: string;
  risk: number;
  ratio: number;
  ratio_step: number;
  bid: number;
  ask: number;
  risk_volume: number;
  volume_step: number;
  risk_step: number;
  balance: number;
  point_value: number;
  contract_size: number;
  points: number;
  digits: number;
  tick_size: number;
  tick_value: number;
  conversion: boolean;
  comment?: string;
}

interface Symbol {
  ask: number;
  bid: number;
  contract_size: number;
  point_value: number;
  volume_step: number;
  conversion: boolean;
  name: string;
  digits: number;
  tick_size: number;
  tick_value: number;
}

interface Account {
  balance: number;
}

interface Handlers {
  setCommand: (ask: number, bid: number, sl: number[], tp: number[]) => void;
  setErrorData: (errorData: { error: number; text: string }) => void;
}

interface TraderProps {
  customClass: string;
  account: Account;
  symbol: Symbol;
  headers: string[];
  data: any[];
  handlers: Handlers;
}

function round(number: number, digits: number) {
  const d = Math.pow(10, digits);
  return Math.round((number + Number.EPSILON) * d) / d;
}

function calculatePoints(
  ask: number,
  riskAmount: number,
  contractSize: number,
  pointValue: number,
  riskLot: number,
  conversion: boolean
) {
  if (conversion) {
    pointValue = 1 / ask;
  }
  return riskAmount / (contractSize * pointValue * riskLot);
}

function calculateInitialRisk(
  ask: number,
  bid: number,
  riskAmount: number,
  contractSize: number,
  pointValue: number,
  volumeStep: number,
  conversion: boolean
) {
  if (conversion) {
    pointValue = 1 / ask;
  }

  const priceRisk = (ask - bid) * SPREADMULTIPLIFER;
  const riskLot = riskAmount / (contractSize * pointValue * priceRisk);
  const initialRiskLot = Math.trunc(riskLot / volumeStep) * volumeStep;
  return priceRisk <= 0 || initialRiskLot < volumeStep ? volumeStep : initialRiskLot;
}

function buildBaseRequest(symbol: string, type: string, lot: number, comment: string) {
  return { symbol, lot, comment, type };
}

function buildBuyRequest(
  request: any,
  ask: number,
  bid: number,
  points: number,
  digits: number,
  ratio: number
) {
  request.price = ask;
  request.stoploss = round(ask - points, digits);
  request.takeprofit = round(ask + points * ratio, digits);
  return request;
}

function buildBuyStopLimitRequest(
  request: any,
  ask: number,
  bid: number,
  points: number,
  digits: number,
  ratio: number
) {
  request.price = ask;
  request.stoploss = round(ask - points, digits);
  request.takeprofit = round(ask + points * ratio, digits);
  request.pending = true;
  return request;
}

function buildSellRequest(
  request: any,
  ask: number,
  bid: number,
  points: number,
  digits: number,
  ratio: number
) {
  request.price = bid;
  request.stoploss = round(bid + points, digits);
  request.takeprofit = round(bid - points * ratio, digits);
  return request;
}

function buildSellStopLimitRequest(
  request: any,
  ask: number,
  bid: number,
  points: number,
  digits: number,
  ratio: number
) {
  request.price = bid;
  request.stoploss = round(bid + points, digits);
  request.takeprofit = round(bid - points * ratio, digits);
  request.pending = true;
  return request;
}

const Trader: React.FC<TraderProps> = ({
  customClass,
  account,
  symbol,
  headers,
  data,
  handlers,
}) => {
  const REQUEST_BUILD_HANDLERS: Record<string, Function> = {
    market_buy: buildBuyRequest,
    limit_buy: buildBuyStopLimitRequest,
    stop_buy: buildBuyStopLimitRequest,
    market_sell: buildSellRequest,
    limit_sell: buildSellStopLimitRequest,
    stop_sell: buildSellStopLimitRequest,
  };

  const INITIAL_RISK_PERCENTAGE = 1.0;
  const INITIAL_RISK = INITIAL_RISK_PERCENTAGE / 100.0;
  const localSymbol = useRef<Symbol | undefined>();
  const localFreezePrice = useRef(false);

  const [trade, setTrade] = useState<Trade>({
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
    conversion: false,
  });

  useEffect(() => {
    calculateParameters(trade.ask, trade.bid, trade.ratio, trade.points);
  }, [trade.ask, trade.bid, trade.points, trade.ratio]);

  if (localSymbol.current !== symbol) {
    const risk = calculateInitialRisk(
      symbol.ask,
      symbol.bid,
      trade.risk * INITIAL_RISK * account.balance,
      symbol.contract_size,
      symbol.point_value,
      symbol.volume_step,
      symbol.conversion
    );

    const points = calculatePoints(
      symbol.ask,
      trade.risk * INITIAL_RISK * account.balance,
      symbol.contract_size,
      symbol.point_value,
      risk,
      symbol.conversion
    );

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
    } else {
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
        points: points,
      }));
    }
    localSymbol.current = symbol;
  }

  function _getCorrespondingClosingType(type: string) {
    return type.includes("buy") ? "close_buy" : "close_sell";
  }

  function requestTrade(request: any) {
    const requestOptions = createPostRequest(request);
    fetch("/api/trade", requestOptions)
      .then((response) => response.json())
      .then((idResponse) => {
        handlers.setErrorData({
          error: idResponse.error,
          text: idResponse.text,
        });
        if (idResponse.error !== 10009) {
          throw new Error(`Result: [${idResponse.error}] ${idResponse.text}`);
        }
      });
  }

  function calculateParameters(ask: number, bid: number, ratio: number, points: number) {
    const sl = [ask - points, bid + points];
    const tp = [ask + points * ratio, bid - points * ratio];
    handlers.setCommand(ask, bid, sl, tp);
  }

  function handleVolumeChange(risk_volume: number) {
    const points = calculatePoints(
      trade.ask,
      trade.risk * 0.01 * trade.balance,
      trade.contract_size,
      trade.point_value,
      risk_volume,
      trade.conversion
    );

    setTrade((previousTrade) => ({
      ...previousTrade,
      risk_volume: risk_volume,
      points: points,
    }));
  }

  function handleTypeChange(type: string) {
    setTrade((previousTrade) => ({
      ...previousTrade,
      type: type,
    }));

    localFreezePrice.current = type.includes("limit") || type.includes("stop");
  }

  function handleRiskChange(risk: number) {
    const points = calculatePoints(
      trade.ask,
      risk * 0.01 * trade.balance,
      trade.contract_size,
      trade.point_value,
      trade.risk_volume,
      trade.conversion
    );

    setTrade((previousTrade) => ({
      ...previousTrade,
      risk: risk,
      points: points,
    }));
  }

  function handleRatioChange(ratio: number) {
    const points = calculatePoints(
      trade.ask,
      trade.risk * 0.01 * trade.balance,
      trade.contract_size,
      trade.point_value,
      trade.risk_volume,
      trade.conversion
    );

    setTrade((previousTrade) => ({
      ...previousTrade,
      ratio: ratio,
      points: points,
    }));
  }

  function handleCommentChange(comment: string) {
    setTrade((previousTrade) => ({
      ...previousTrade,
      comment: comment,
    }));
  }

  function handleAskChange(ask: number) {
    setTrade((previousTrade) => ({
      ...previousTrade,
      ask: ask,
    }));
  }

  const handleBidChange = (bid: number) => {
    setTrade((previousTrade) => ({
      ...previousTrade,
      bid: bid,
    }));
  };

  function handleOpenTrade() {
    const comment = generateComment(trade.risk, trade.comment || "");
    const request = REQUEST_BUILD_HANDLERS[trade.type](
      buildBaseRequest(trade.name, trade.type, trade.risk_volume, comment),
      trade.ask,
      trade.bid,
      trade.points,
      trade.digits,
      trade.ratio
    );
    requestTrade(request);
  }

  function generateComment(risk: number, text: string) {
    return `R${risk}%G${trade.ratio}%` + text;
  }

  function handleCloseTrade(type: string, name: string, position: number, volume: number) {
    const request = {
      symbol: name,
      position: position,
      lot: volume,
      type: _getCorrespondingClosingType(type),
    };

    requestTrade(request);
  }

  return (
    <>
      <nav className="cls50PContainer">
        <Calculator
          customClass={customClass}
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
            handleBidChange,
          }}
        />
      </nav>
      <nav className="cls50PContainer">
        <Orders
          customClass={customClass}
          headers={headers}
          data={data}
          handlers={{ handleCloseTrade }}
        />
      </nav>
    </>
  );
};

Trader.whyDidYouRender = false;
export default Trader;
