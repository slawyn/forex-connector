import { TextField, InputAdornment, InputLabel, MenuItem, FormControl, Select } from '@mui/material';
import * as React from 'react';

const Calculator = ({ customClass, types, trade, handlers }) => {
    return (
        <table className={customClass}>
            <thead>
                <tr>
                    <th className={customClass}>{trade.name}</th>
                    <th className={customClass}>Contract Size: {trade.contract_size}</th>
                    <th className={customClass}>Point Value: {trade.point_value}</th>
                    <th className={customClass}>Volume Step: {trade.volume_step}</th>
                    <th className={customClass}>Digits: {trade.digits}</th>
                    <th className={customClass}>Tick Size: {trade.tick_size}</th>
                    <th className={customClass}>Tick Value: {trade.tick_value}</th>
                    <th className="css-blue-button property-fullsize" onClick={handlers.handleOpenTrade}>
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
                                onChange={(e) => handlers.handleTypeChange(e.target.value)}
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
                            onChange={(e) => handlers.handleVolumeChange(e.target.value)}
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
                            onChange={(e) => handlers.handleRiskChange(e.target.value)}
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
                            onChange={(e) => handlers.handleRatioChange(e.target.value)}
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
                            onChange={(e) => handlers.handleAskChange(e.target.value)}
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
                            onChange={(e) => handlers.handleBidChange(e.target.value)}
                            inputProps={{
                                startAdornment: <InputAdornment position="start">Price</InputAdornment>,
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
                            onChange={(e) => handlers.handleCommentChange(e.target.value)}
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

export default Calculator;
