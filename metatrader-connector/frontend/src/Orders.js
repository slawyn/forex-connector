import React, { useRef, useState, useEffect, createRef } from "react";
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InputAdornment from '@mui/material/InputAdornment';

const Orders = (props) => {
    return (
        <table className={props.customClass} >
            <tbody>
                <tr>
                    <td>
                        <button onClick={props.saveall} className={"clsOrangebutton"} >{"Save to Google"}</button>
                    </td>
                    <td>
                        <button onClick={props.updateall}>Fetch All Positions</button>
                    </td>
                </tr>
            </tbody>
        </table >
    );
};

export { Orders as default };