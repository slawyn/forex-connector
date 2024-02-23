import { TextField } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import InputAdornment from '@mui/material/InputAdornment';

function getCorrespondingClosingType (type) {
    let close_type = ""
    if (type.includes("buy")) {
        close_type = "close_buy";
    } else {
        close_type = "close_sell";
    }

    return close_type;
};

const Calculator = ({customClass, trade, handlers}) => {

    return (
        <>
            <table className="">
                <tbody>
                    <tr>
                        <td>Symbol: {trade.name}</td>
                        <td>Contract Size: {trade.contract_size}</td>
                        <td>Point Value: {trade.point_value}</td>
                        <td>Volume Step: {trade.volume_step}</td>
                        <td>Digits: {trade.digits}</td>
                        <td>Tick Size: {trade.tick_size}</td>
                        <td>Tick Value: {trade.tick_value}</td>
                    </tr>
                    <tr>
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
                    </tr>
                    <tr>
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
                            <button className={"clsBluebutton"} onClick={() => { handlers.handleOpenTrade("market_buy") }}>{"Market.Buy"}</button>
                            <button className={"clsBluebutton"} onClick={() => { handlers.handleOpenTrade("limit_buy") }}>{"Limit.Buy"} </button>
                            <button className={"clsBluebutton"} onClick={() => { handlers.handleOpenTrade("stop_buy") }}  >{"Stop.Buy"}</button>
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
                            <TextField
                                id="outlined-helperText"
                                label="Comment"
                                value={trade.comment}
                                onChange={(e) => { handlers.handleCommentChange(e.target.value) }}
                                helperText="Strategy tracking"
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
                            <button className={"clsRedbutton"} onClick={() => { handlers.handleOpenTrade("market_sell") }}>{"Market.Sell"} </button>
                            <button className={"clsRedbutton"} onClick={() => { handlers.handleOpenTrade("limit_sell") }}>{"Limit.Sell"} </button>
                            <button className={"clsRedbutton"} onClick={() => { handlers.handleOpenTrade("stop_sell") }}  >{"Stop.Sell"}</button>
                        </td>

                    </tr>

                    <tr>
                        <td>
                            <FormControlLabel
                                control={<Checkbox onChange={(e) => { handlers.handlePreviewChange(e.target.checked) }} />}
                                label="Preview in MT5" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    );
};

export { Calculator, getCorrespondingClosingType };