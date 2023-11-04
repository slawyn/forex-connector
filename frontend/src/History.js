import React, { } from "react";

const History = (props) => {

    const [imgData, setImage] = React.useState("0");

    return (
        <>
            <button onClick={props.saveall} className={"clsOrangebutton"} style={{ width: "fit-content" }}>Upload to Google</button>
            <button onClick={props.updateall} className={"clsBluebutton"} style={{ width: "fit-content" }}>Fetch Trades</button>
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
                <div className="clsImageContainer" >
                    <img src={`trades/${imgData}.png`} ></img>
                </div>
            </div>
        </>
    );
};


export { History as default };