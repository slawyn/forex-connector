import React, { } from "react";

const History = ({ customClass, handlers, headers, data }) => {

    const [imgData, setImage] = React.useState("0");
    return (
        <>
            <button
                onClick={handlers.saveHistory}
                className={"clsOrangebutton"}
                style={{ width: "fit-content" }}>
                Upload to Google
            </button>
            <button
                onClick={handlers.getHistory}
                className={"css-blue-button"}
                style={{ width: "fit-content" }}>
                Fetch Trades
            </button>
            <nav className="clsGlobalContainer" >
                <nav className="clsHistoryContainer" >
                    <table className={customClass} >
                        <thead>
                            <tr>
                                {headers.map((header, index) => {
                                    return <th title={header} key={header} className={customClass}>
                                        {header}
                                    </th>
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {
                                data.map((entry) => {
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