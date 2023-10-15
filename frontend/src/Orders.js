import React, { useRef, useState, useEffect, createRef } from "react";
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InputAdornment from '@mui/material/InputAdornment';


const Orders = (props) => {
    return (
        <>
            <table className={props.customClass} style={{ width: "100%" }}>
                <thead>
                    <tr>
                        {props.headers.map((header, index) => {
                            return <th title={header} key={header} className={props.className}>
                                {header}
                            </th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    {
                        props.data.map((row) => {

                            return <tr>
                                {
                                    /** Map row line */
                                    row.items.map((cellData) => {
                                        return <td>{cellData}</td>
                                    })
                                }
                            </tr>
                        })
                    }
                </tbody>
            </table >
        </>
    );
};

export { Orders as default };