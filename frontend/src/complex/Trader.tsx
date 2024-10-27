import React, { Component } from "react";
import { Calculator, Trade } from "src/complex/Calculator";
import { createPostRequest } from "src/utils";

const SPREADMULTIPLIFER = 5;
const INITIAL_RISK_PERCENTAGE = 1.0;

function round(number: number, digits: number): number {
  const d = Math.pow(10, digits);
  return Math.round((number + Number.EPSILON) * d) / d;
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

interface TraderState {
  trade: Trade;
}

class Trader extends Component<TraderProps, TraderState> {
  REQUEST_BUILD_HANDLERS: Record<string, Function>;
  isInternalUpdate: boolean;
  isPriceFrozen: boolean;

  constructor(props: TraderProps) {
    super(props);

    this.state = {
      trade: {
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
      },
    };

    this.isPriceFrozen = false,
      this.isInternalUpdate = false

    this.REQUEST_BUILD_HANDLERS = {
      market_buy: this.buildBuyRequest,
      limit_buy: this.buildBuyStopLimitRequest,
      stop_buy: this.buildBuyStopLimitRequest,
      market_sell: this.buildSellRequest,
      limit_sell: this.buildSellStopLimitRequest,
      stop_sell: this.buildSellStopLimitRequest,
    };
  }



  calculatePoints(
    ask: number,
    riskAmount: number,
    contractSize: number,
    pointValue: number,
    riskLot: number,
    conversion: boolean
  ): number {
    if (conversion) {
      pointValue = 1 / ask;
    }
    return riskAmount / (contractSize * pointValue * riskLot);
  }

  calculateInitialRisk(
    ask: number,
    bid: number,
    riskAmount: number,
    contractSize: number,
    pointValue: number,
    volumeStep: number,
    conversion: boolean
  ): number {
    if (conversion) {
      pointValue = 1 / ask;
    }

    const priceRisk = (ask - bid) * SPREADMULTIPLIFER;
    const riskLot = riskAmount / (contractSize * pointValue * priceRisk);
    const initialRiskLot = Math.trunc(riskLot / volumeStep) * volumeStep;
    return priceRisk <= 0 || initialRiskLot < volumeStep ? volumeStep : initialRiskLot;
  }

  buildBaseRequest(symbol: string, type: string, lot: number, comment: string) {
    return { symbol, lot, comment, type };
  }

  buildBuyRequest(
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

  buildBuyStopLimitRequest(
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

  buildSellRequest(
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

  buildSellStopLimitRequest(
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

  componentDidUpdate(prevProps: TraderProps) {
    const { symbol, account } = this.props;
    const { trade } = this.state;

    // console.log("DidUpdate", symbol)

    /* when symbol changes */
    if (prevProps.symbol.name !== symbol.name) {
      const risk = this.calculateInitialRisk(
        symbol.ask,
        symbol.bid,
        trade.risk * 0.01 * account.balance,
        symbol.contract_size,
        symbol.point_value,
        symbol.volume_step,
        symbol.conversion
      );
      const points = this.calculatePoints(
        symbol.ask,
        trade.risk * 0.01 * account.balance,
        symbol.contract_size,
        symbol.point_value,
        risk,
        symbol.conversion
      );

      this.setState((prevState) => ({
        trade: {
          ...prevState.trade,
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
        }
      }))

      /* when symbol bid or as change */
    } else if (!this.isPriceFrozen && (trade.ask !== symbol.ask || trade.bid !== symbol.bid)) {
      this.setState((prevState) => ({
        trade: {
          ...prevState.trade,
          bid: symbol.bid,
          ask: symbol.ask,
          balance: account.balance,
          point_value: symbol.point_value,
          tick_value: round(symbol.tick_value, 4),
        },
      }));

      /* internal update updates the outter modules  */
    } else if (this.isInternalUpdate) {
      this.isInternalUpdate = false
      this.setExternalParameters(trade.ask, trade.bid, trade.ratio, trade.points)
    }
  }

  getClosingType(type: string) {
    return type.includes("buy") ? "close_buy" : "close_sell";
  }

  executeInternalUpdate(newState: Partial<Trade>) {
    this.isInternalUpdate = true
    this.setState((prevState) => ({
      trade: {
        ...prevState.trade,
        ...newState
      },
    }));
  }


  requestTrade(request: any) {
    const requestOptions = createPostRequest(request);
    fetch("/api/trade", requestOptions)
      .then((response) => response.json())
      .then((idResponse) => {
        this.props.handlers.setErrorData({
          error: idResponse.error,
          text: idResponse.text,
        });
        if (idResponse.error !== 10009) {
          throw new Error(`Result: [${idResponse.error}] ${idResponse.text}`);
        }
      });
  }

  setExternalParameters(ask: number, bid: number, ratio: number, points: number) {
    const sl = [ask - points, bid + points];
    const tp = [ask + points * ratio, bid - points * ratio];
    this.props.handlers.setCommand(ask, bid, sl, tp);
  }

  handleVolumeChange = (risk_volume: number) => {
    const { trade } = this.state;
    const points = this.calculatePoints(
      trade.ask,
      trade.risk * 0.01 * trade.balance,
      trade.contract_size,
      trade.point_value,
      risk_volume,
      trade.conversion
    );

    this.executeInternalUpdate({ risk_volume, points })
  };

  handleTypeChange = (type: string) => {
    this.isPriceFrozen = type.includes("limit") || type.includes("stop")
    this.executeInternalUpdate({ type })
  };

  handleRiskChange = (risk: number) => {
    const { trade } = this.state;
    const points = this.calculatePoints(
      trade.ask,
      risk * 0.01 * trade.balance,
      trade.contract_size,
      trade.point_value,
      trade.risk_volume,
      trade.conversion
    );

    this.executeInternalUpdate({ risk, points })
  };

  handleRatioChange = (ratio: number) => {
    const { trade } = this.state;
    const points = this.calculatePoints(
      trade.ask,
      trade.risk * 0.01 * trade.balance,
      trade.contract_size,
      trade.point_value,
      trade.risk_volume,
      trade.conversion
    );

    this.executeInternalUpdate({ ratio, points })
  };

  handleCommentChange = (comment: string) => { this.executeInternalUpdate({ comment }) };
  handleAskChange = (ask: number) => { this.executeInternalUpdate({ ask }) };
  handleBidChange = (bid: number) => { this.executeInternalUpdate({ bid }) };
  handleOpenTrade = () => {
    const { trade } = this.state;
    const comment = this.generateComment(trade.risk, trade.comment || "");
    const request = this.REQUEST_BUILD_HANDLERS[trade.type](
      this.buildBaseRequest(trade.name, trade.type, trade.risk_volume, comment),
      trade.ask,
      trade.bid,
      trade.points,
      trade.digits,
      trade.ratio
    );
    this.requestTrade(request);
  };

  handleCloseTrade = (type: string, name: string, position: number, volume: number) => {
    const request = {
      symbol: name,
      position: position,
      lot: volume,
      type: this.getClosingType(type),
    };

    this.requestTrade(request);
  };

  generateComment(risk: number, text: string) {
    return `R${risk}%G${this.state.trade.ratio}%` + text;
  }

  render() {
    const { customClass } = this.props;
    const { trade } = this.state;
    // console.log("render", trade)
    return (
      <>
        <nav className="cls50PContainer">
          <Calculator
            customClass={customClass}
            trade={trade}
            types={Object.keys(this.REQUEST_BUILD_HANDLERS)}
            handlers={{
              openTrade: this.handleOpenTrade,
              typeChange: this.handleTypeChange,
              volumeChange: this.handleVolumeChange,
              riskChange: this.handleRiskChange,
              ratioChange: this.handleRatioChange,
              commentChange: this.handleCommentChange,
              askChange: this.handleAskChange,
              bidChange: this.handleBidChange,
            }} />
        </nav>
      </>
    );
  }
}

// Trader.whyDidYouRender = true;
export default Trader;
