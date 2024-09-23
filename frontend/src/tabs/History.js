import React, { } from "react";
import { createPostRequest } from "../utils";
import { LazyLoadImage } from 'react-lazy-load-image-component';

const History = ({ customClass }) => {
    const [positionData, setPositionData] = React.useState({ headers: [], positions: [] });
    const [selectedImage, setSelectedImage] = React.useState("0")


    function saveHistory(selected) {
        const requestOptions = createPostRequest("")
        fetch('/save', requestOptions).then(response => response.json()).then(((receivedSymbolData) => { }));
    };

    function fetchHistory() {
        fetch("/history").then((response) =>
            response.json().then((receivedPositions) => { setPositionData(receivedPositions); })
        );
    };


    React.useEffect(() => {
        fetchHistory()
      }, []);

    return (
        <>
            <button
                onClick={saveHistory}
                className={"clsOrangebutton"}
                style={{ width: "fit-content" }}>
                Sync with Google
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
                                    return <tr key={entry[0]} onClick={() => setSelectedImage(entry[0])} style={{
                                        backgroundColor: entry[0] === selectedImage ? 'orange' : ''
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
                <LazyLoadImage src={`${selectedImage}.png`}
                    effect="blur"
                    style={{
                        width: '100vw',   // Scale to the full viewport width
                        height: '100vh',  // Scale to the full viewport height
                        objectFit: 'contain',  // Ensure the image maintains aspect ratio
                    }}
                />
            </nav>
        </>
    );
};


export { History as default };
