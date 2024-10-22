import React, { useState, useEffect } from "react";
import { createPostRequest } from "../utils";
import { LazyLoadImage } from 'react-lazy-load-image-component';

const History = ({ customClass }) => {
    const [positionData, setPositionData] = useState({ headers: [], positions: [] });
    const [selectedImage, setSelectedImage] = useState("0");

    const saveHistory = () => {
        const requestOptions = createPostRequest("");
        fetch('/api/save', requestOptions)
            .then(response => response.json())
            .then(() => { /* Handle response if needed */ });
    };

    const fetchHistory = () => {
        fetch("/api/history")
            .then(response => response.json())
            .then(receivedPositions => setPositionData(receivedPositions));
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <>
            <div>
                <button
                    onClick={saveHistory}
                    className="clsOrangebutton"
                    style={{ width: "fit-content" }}>
                    Sync with Google
                </button>
                <button
                    onClick={fetchHistory}
                    className="css-blue-button"
                    style={{ width: "fit-content" }}>
                    Fetch Trades
                </button>
            </div>
            <nav className="clsGlobalContainer">
                <nav className="clsHistoryContainer">
                    <table className={customClass}>
                        <thead>
                            <tr>
                                {positionData.headers.map((header, index) => (
                                    <th key={index} title={header} className={customClass}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {positionData.positions.map((entry, entryIndex) => (
                                <tr
                                    key={entry[0] || entryIndex}
                                    onClick={() => setSelectedImage(entry[0])}
                                    style={{
                                        backgroundColor: entry[0] === selectedImage ? 'orange' : ''
                                    }}
                                >
                                    {entry.map((cellData, cellIndex) => (
                                        <td key={cellIndex}>{cellData}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </nav>
                <LazyLoadImage
                    src={`api/${selectedImage}.png`}
                    effect="blur"
                    style={{
                        width: '100vw',
                        height: '100vh',
                        objectFit: 'contain',
                    }}
                />
            </nav>
        </>
    );
};

export default History;
