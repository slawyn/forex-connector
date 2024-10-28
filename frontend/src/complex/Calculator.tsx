import { TextField, InputAdornment, InputLabel, MenuItem, FormControl, Select } from '@mui/material';
import * as React from 'react';
import MiscCheckbox from 'src/elements/Misc';

export interface Trade {
  name: string;
  type: string;
  risk: number;
  ratio: number;
  ratio_step: number;
  bid: number;
  ask: number;
  spread: number;
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

interface Handlers {
    openTrade: () => void;
    typeChange: (value: string) => void;
    volumeChange: (value: number) => void;
    riskChange: (value: number) => void;
    ratioChange: (value: number) => void;
    askChange: (value: number) => void;
    bidChange: (value: number) => void;
    commentChange: (value: string) => void;
    enableTrading: (state: boolean) => void;
}

interface CalculatorProps {
    customClass: string;
    types: string[];
    trade: Trade;
    handlers: Handlers;
}

export const Calculator: React.FC<CalculatorProps> =  ({ customClass, types, trade, handlers }) => {
    return (
        <table className={customClass}>
            <thead>
                <tr>
                    <th className={customClass}>{trade.name}</th>
                    <th title="Volume Step" className={customClass}>VS: {trade.volume_step}</th>
                    <th title="Contract Size" className={customClass}>CS: {trade.contract_size}</th>
                    <th title="Point Value" className={customClass}>PV: {trade.point_value}</th>
                    <th title="Digits Count" className={customClass}>DC: {trade.digits}</th>
                    <th title="Tick Size" className={customClass}>TS: {trade.tick_size}</th>
                    <th title="Tick Value" className={customClass}>TV: {trade.tick_value}</th>
                    <th className={customClass}>
                        <MiscCheckbox customClass={"css-button-checkbox property-fullsize"}
                            text ="Enable Trading"
                            handler={(state) => {
                                handlers.enableTrading(state);
                            }}
                        /></th>
                    <th title="" className="css-blue-button property-fullsize" onClick={handlers.openTrade}>
                        {"Execute Trade"}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr key="order-row">
                    <td>
                        <FormControl fullWidth>
                            <InputLabel id="order-type-label">Order type</InputLabel>
                            <Select
                                labelId="order-type-label"
                                id="order-type-select"
                                label="Order type"
                                value={trade.type}
                                onChange={(e) => handlers.typeChange(e.target.value)}
                            >
                                {types.map((type, index) => (
                                    <MenuItem key={index} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </td>
                    <td>
                        <TextField
                            id="trade-volume"
                            type="number"
                            value={trade.risk_volume}
                            variant="outlined"
                            label="Risk Volume"
                            onChange={(e) => handlers.volumeChange(parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                startAdornment: <InputAdornment position="start">LOT</InputAdornment>,
                                step: trade.volume_step,
                            }}
                        />
                    </td>
                    <td>
                        <TextField
                            id="trade-risk"
                            type="number"
                            value={trade.risk}
                            variant="outlined"
                            label="Risk"
                            onChange={(e) => handlers.riskChange(parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                step: trade.risk_step,
                            }}
                        />
                    </td>
                    <td>
                        <TextField
                            id="trade-ratio"
                            type="number"
                            value={trade.ratio}
                            variant="outlined"
                            label="Risk Ratio"
                            onChange={(e) => handlers.ratioChange(parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                step: trade.ratio_step,
                            }}
                        />
                    </td>
                    <td>
                        <TextField
                            id="trade-ask"
                            label="Ask"
                            type="number"
                            value={trade.ask}
                            variant="outlined"
                            onChange={(e) => handlers.askChange(parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                startAdornment: <InputAdornment position="start">Price</InputAdornment>,
                            }}
                        />
                    </td>
                    <td>
                        <TextField
                            id="trade-bid"
                            label="Bid"
                            type="number"
                            value={trade.bid}
                            variant="outlined"
                            onChange={(e) => handlers.bidChange(parseFloat(e.target.value))}
                            inputProps={{
                                startAdornment: <InputAdornment position="start">Price</InputAdornment>,
                            }}
                        />
                    </td>
                    <td>
                        <TextField
                            id="trade-spread"
                            label="Spread"
                            value={trade.spread}
                            inputProps={{
                                readOnly: true,
                                startAdornment: <InputAdornment position="start">PP</InputAdornment>,
                            }}
                        />
                    </td>
                    <td>
                        <TextField
                            id="price-points"
                            label="Price Points"
                            value={trade.points}
                            inputProps={{
                                readOnly: true,
                                startAdornment: <InputAdornment position="start">PP</InputAdornment>,
                            }}
                        />
                    </td>
                    <td>
                        <TextField
                            id="trade-comment"
                            label="Comment"
                            value={trade.comment}
                            onChange={(e) => handlers.commentChange(e.target.value)}
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

