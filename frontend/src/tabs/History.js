import React, { } from "react";
import { createPostRequest } from "../utils";


const History = ({ customClass }) => {
    const [imgData, setImage] = React.useState("0");
    const [positionData, setPositionData] = React.useState({ headers: [], positions: [] });


    function saveHistory(selected) {
        const requestOptions = createPostRequest("")
        fetch('/save', requestOptions).then(response =>response.json()).then(((receivedSymbolData) => { }));
      };

    function fetchHistory() {
        /**
         * Fetch all positional Data
         */
        fetch("/history").then((response) =>
          response.json().then((receivedPositions) => {setPositionData(receivedPositions);})
        );
      };


    return (
        <>
            <button
                onClick={saveHistory}
                className={"clsOrangebutton"}
                style={{ width: "fit-content" }}>
                Upload to Google
            </button>
            <button
                onClick={fetchHistory}
                className={"css-blue-button"}
                style={{ width: "fit-content" }}>
                Fetch Trades
            </button>
            <nav className="clsGlobalContainer" >
                <nav className="clsHistoryContainer" >
                    <table className={customClass} >
                        <thead>
                            <tr>
                                {positionData.headers.map((header, index) => {
                                    return <th title={header} key={header} className={customClass}>
                                        {header}
                                    </th>
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {
                                positionData.positions.map((entry) => {
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
                </nav>
                <nav className="clsImageContainer" >
                    <img src={`trades/${imgData}.png`} className="property-fitcontent"></img>
                </nav>
            </nav>
        </>
    );
};


export { History as default };