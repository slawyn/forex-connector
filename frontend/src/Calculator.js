import { TextField } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InputAdornment from '@mui/material/InputAdornment';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});


const Calculator = (props) => {

    return (
        <>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <table className="">
                    <tbody>
                        <tr>
                            <td>Symbol: {props.trade.name}</td>
                            <td>Contract Size: {props.trade.contract_size}</td>
                            <td>Point Value: {props.trade.point_value}</td>
                            <td>Volume Step: {props.trade.volume_step}</td>
                            <td>Digits: {props.trade.digits}</td>
                            <td>Tick Size: {props.trade.tick_size}</td>
                            <td>Tick Value: {props.trade.tick_value}</td>
                        </tr>
                        <tr>
                            <td>
                                <TextField
                                    id="trade-volume"
                                    type="number"
                                    value={props.trade.risk_volume}
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    onChange={(e) => { props.handlervolume(e.target.value) }}
                                    label="Risk Volume"
                                    inputProps={{
                                        startAdornment: <InputAdornment position="start">LOT</InputAdornment>,
                                        step: props.trade.volume_step,
                                    }}
                                />
                            </td>
                            <td>
                                <TextField
                                    id="trade-risk"
                                    type="number"
                                    value={props.trade.risk}
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    onChange={(e) => { props.handleRisk(e.target.value) }}
                                    label="Risk"
                                    inputProps={{

                                        startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                        step: props.trade.risk_step
                                    }}
                                />
                            </td>
                            <td>
                                <TextField
                                    id="trade-ratio"
                                    type="number"
                                    value={props.trade.ratio}
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    label="Risk Ratio"
                                    onChange={(e) => { props.handleRatio(e.target.value) }}
                                    inputProps={{
                                        startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                        step: props.trade.ratio_step
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
                                    value={props.trade.ask}
                                    onChange={(e) => { props.handleAsk(e.target.value) }}
                                    variant="outlined"
                                    inputProps={{
                                        startAdornment: <InputAdornment position="start">Price</InputAdornment>,
                                    }}
                                />
                                <button className={"clsBluebutton"} onClick={() => { props.handlertrade("market_buy") }}>{"Market.Buy"}</button>
                                <button className={"clsBluebutton"} onClick={() => { props.handlertrade("limit_buy") }}>{"Limit.Buy"} </button>
                                <button className={"clsBluebutton"} onClick={() => { props.handlertrade("stop_buy") }}  >{"Stop.Buy"}</button>
                            </td>
                            <td>
                                <TextField
                                    id="outlined-read-only-input"
                                    label="Price Points"
                                    value={props.trade.points}
                                    inputProps={{
                                        readOnly: true,
                                        startAdornment: <InputAdornment position="start">PP</InputAdornment>,
                                    }}
                                />
                                <TextField
                                    id="outlined-helperText"
                                    label="Comment"
                                    value={props.trade.comment}
                                    onChange={(e) => { props.handlercomment(e.target.value) }}
                                    helperText="Strategy tracking"
                                />
                            </td>

                            <td>
                                <TextField
                                    id="trade-bid"
                                    label="Bid"
                                    type="number"
                                    value={props.trade.bid}
                                    onChange={(e) => { props.handleBid(e.target.value) }}
                                    helperText=""
                                    inputProps={{
                                        startAdornment: <InputAdornment position="start">Price</InputAdornment>,
                                    }}
                                />
                                <button className={"clsRedbutton"} onClick={() => { props.handlertrade("market_sell") }}>{"Market.Sell"} </button>
                                <button className={"clsRedbutton"} onClick={() => { props.handlertrade("limit_sell") }}>{"Limit.Sell"} </button>
                                <button className={"clsRedbutton"} onClick={() => { props.handlertrade("stop_sell") }}  >{"Stop.Sell"}</button>
                            </td>

                        </tr>

                        <tr>
                            <td>
                                <FormControlLabel
                                    control={<Checkbox onChange={(e) => { props.handlePreview(e.target.checked) }} />}
                                    label="Preview in MT5" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </ThemeProvider>
        </>
    );
};

export { Calculator as default };