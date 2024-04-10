import { TextField } from '@mui/material';

import InputAdornment from '@mui/material/InputAdornment';

import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

function getCorrespondingClosingType(type) {
    let close_type = ""
    if (type.includes("buy")) {
        close_type = "close_buy";
    } else {
        close_type = "close_sell";
    }

    return close_type;
};

const Calculator = ({ customClass, trade, handlers }) => {
    return (
        <>
            <table className={customClass}>
                <thead>
                    <tr>
                        <th className={customClass}>{trade.name}</th>
                        <th className={customClass}>Contract Size: {trade.contract_size}</th>
                        <th className={customClass}>Point Value: {trade.point_value}</th>
                        <th className={customClass}>Volume Step: {trade.volume_step}</th>
                        <th className={customClass}>Digits: {trade.digits}</th>
                        <th className={customClass}>Tick Size: {trade.tick_size}</th>
                        <th className={customClass} colSpan="1">Tick Value: {trade.tick_value}</th>
                        <th>
                            <button className={"css-blue-button property-fullsize"} onClick={() => { handlers.handleOpenTrade() }}>{"Execute Trade"} </button>
                        </th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <FormControl fullWidth>
                                <InputLabel id="demo-simple-select-label">Order type</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    label="Order type"
                                    value={trade.type}
                                    onChange={(e) => { handlers.handleTypeChange(e.target.value) }}>
                                    <MenuItem value={'market_buy'}>Market.Buy</MenuItem>
                                    <MenuItem value={'limit_buy'}>Limit.Buy</MenuItem>
                                    <MenuItem value={'stop_buy'}>Stop.Buy</MenuItem>
                                    <MenuItem value={'market_sell'}>Market.Sell</MenuItem>
                                    <MenuItem value={'limit_sell'}>Limit.Sell</MenuItem>
                                    <MenuItem value={'stop_sell'}>Stop.Sell</MenuItem>
                                </Select>
                            </FormControl>
                        </td>
                        <td>
                            <TextField
                                id="trade-volume"
                                type="number"
                                value={trade.risk_volume}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { handlers.handleVolumeChange(e.target.value) }}
                                label="Risk Volume"
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
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => { handlers.handleRiskChange(e.target.value) }}
                                label="Risk"
                                inputProps={{

                                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                    step: trade.risk_step
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-ratio"
                                type="number"
                                value={trade.ratio}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                label="Risk Ratio"
                                onChange={(e) => { handlers.handleRatioChange(e.target.value) }}
                                inputProps={{
                                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                    step: trade.ratio_step
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="trade-ask"
                                label="Ask"
                                type="number"
                                value={trade.ask}
                                onChange={(e) => { handlers.handleAskChange(e.target.value) }}
                                variant="outlined"
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
                                onChange={(e) => { handlers.handleBidChange(e.target.value) }}
                                helperText=""
                                inputProps={{
                                    startAdornment: <InputAdornment position="start">Price</InputAdornment>,
                                }}
                            />
                        </td>
                        <td>
                            <TextField
                                id="outlined-read-only-input"
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
                                id="outlined-helperText"
                                label="Comment"
                                value={trade.comment}
                                onChange={(e) => { handlers.handleCommentChange(e.target.value) }}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    );
};

export { Calculator, getCorrespondingClosingType };