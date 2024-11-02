import React, { useState, useEffect } from "react";
import { createPostRequest } from "src/utils";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Table, { mapTerminalData } from "src/elements/table/Table";
import Api, {HistoryData, transformHistoryData} from "src/Api"


interface HistoryProps {
    customClass: string;
    headers: string[];
}

const History: React.FC<HistoryProps> = ({ customClass, headers }) => {
    const [positionData, setPositionData] = useState<any[][]>([]);
    const [selectedImage, setSelectedImage] = useState<string>("0");

    const postSaveHistory = async () => {
        const result = await new Api().postSaveHistory()
    };

    const fetchHistory = async () => {
        const result = await new Api().fetchHistory()
        setPositionData(transformHistoryData(result));
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
                    onClick={postSaveHistory}
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
            <nav className="container-flex">
                <nav className="clsHistoryContainer">
                    <Table customClass={customClass}
                        customHeaderClass=" css-orange-background"
                        headers={headers}
                        data={mapTerminalData(positionData)}
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
