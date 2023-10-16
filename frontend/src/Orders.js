import React, { useState } from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';




const Orders = (props) => {
    const [dialogData, setDiagloData] = React.useState({ type: "", state: false, id: 0, name: "", volume: 0, ask: 0, bid: 0 });


    const handleCloseConfirmed = () => {
        setDiagloData((previousTrade) => ({
            ...previousTrade,
            state: false
        }));
        props.handleClose(dialogData.type, dialogData.name, dialogData.id, dialogData.volume, dialogData.ask, dialogData.bid);
    };

    const handleCloseRejected = () => {
        setDiagloData((previousTrade) => ({
            ...previousTrade,
            state: false
        }));
    };

    const handleOpenDialog = (name, id, volume, type, ask, bid) => {

        setDiagloData((previousTrade) => ({
            id: id,
            name: name,
            volume: volume,
            state: true,
            ask: ask,
            bid: bid,
            type: type
        }));
    };

    return (
        <>
            <Dialog
                open={dialogData.state}
                onClose={handleCloseRejected}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {`Close trade #${dialogData.id}`}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Do you really want to close this trade?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRejected}>Disagree</Button>
                    <Button onClick={handleCloseConfirmed} autoFocus>
                        Agree
                    </Button>
                </DialogActions>
            </Dialog>
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

                            return <tr onClick={() => handleOpenDialog(row.items[1], row.items[0], row.items[row.items.length - 1], row.items[3], row.items[8], row.items[9])}>
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