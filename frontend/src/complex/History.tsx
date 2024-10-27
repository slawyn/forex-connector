import React, { useState, useEffect } from "react";
import { createPostRequest } from "src/utils";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Table, { mapTerminalData } from "src/elements/table/Table";

interface HistoryProps {
    customClass: string;
}

interface PositionData {
    headers: string[];
    positions: any[][];
}

const History: React.FC<HistoryProps> = ({ customClass }) => {
    const [positionData, setPositionData] = useState<PositionData>({ headers: [], positions: [] });
    const [selectedImage, setSelectedImage] = useState<string>("0");

    const saveHistory = () => {
        const requestOptions = createPostRequest({});
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

    const handleOnClick = (id: string, items: any[]) => {
        setSelectedImage(items[0])
    }

    return (
        <>
            <div>
                <button
                    onClick={saveHistory}
                    className="clsOrangebutton"
                    style={{ width: "fit-content" }}
                >
                    Sync with Google
                </button>
                <button
                    onClick={fetchHistory}
                    className="css-blue-button"
                    style={{ width: "fit-content" }}
                >
                    Fetch Trades
                </button>
            </div>
            <nav className="clsGlobalContainer">
                <nav className="clsHistoryContainer">
                    <Table customClass={customClass}
                        customHeaderClass=" css-orange-background"
                        headers={positionData.headers}
                        data={mapTerminalData(positionData.positions)}
                        onRowClick={handleOnClick}
                    />
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
