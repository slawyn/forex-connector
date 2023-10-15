import React, { useRef, useState, useEffect, createRef } from "react";
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InputAdornment from '@mui/material/InputAdornment';

const History = (props) => {

    const [imgData, setImage] = React.useState("0");

    return (
        <>
            <button onClick={props.saveall} className={"clsOrangebutton"} >{"Save to Google"}</button>
            <button onClick={props.updateall}>Fetch All Positions</button>

            <div className="clsGlobalContainer" >
                <div className="clsHistoryContainer" >
                    <table className={props.customClass} >
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
                                props.data.map((entry) => {
                                    return <tr onClick={() => setImage(entry[0])} style={{
                                        backgroundColor: entry[0] === imgData ? 'orange' : ''
                                    }}>
                                        {
                                            /** Map row line */
                                            entry.map((cellData) => {
                                                return <td>{cellData}</td>
                                            })
                                        }
                                    </tr>
                                })
                            }
                        </tbody>
                    </table>
                </div>
                <div className="clsHistoryContainer" >
                    <img src={`trades/${imgData}.png`} style={{ width: "500px" }}></img>
                </div>
            </div >
        </>
    );
};


export { History as default };