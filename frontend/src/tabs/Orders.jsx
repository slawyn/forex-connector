import React, { useState } from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TableHeads from "src/elements/TableHeads.jsx";
import TableRows from "src/elements/TableRows";

const Orders = ({ customClass, headers, data, handlers }) => {
    const [dialogData, setDialogData] = useState({
        type: "",
        state: false,
        id: 0,
        name: "",
        volume: 0,
        ask: 0,
        bid: 0
    });

    const handleDialogClose = (confirm) => {
        if (confirm) {
            handlers.handleCloseTrade(
                dialogData.type,
                dialogData.name,
                dialogData.id,
                dialogData.volume
            );
        }
        setDialogData((prev) => ({ ...prev, state: false }));
    };

    const handleRowClick = (id, items) => {
        setDialogData({
            name: items[1],
            id: items[0],
            volume: items[items.length - 1],
            type: items[3],
            ask: items[8],
            bid: items[9],
            state: true,
        });
    };

    return (
        <>
            <Dialog
                open={dialogData.state}
                onClose={() => handleDialogClose(false)}
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
                    <Button onClick={() => handleDialogClose(false)}>Disagree</Button>
                    <Button onClick={() => handleDialogClose(true)} autoFocus>
                        Agree
                    </Button>
                </DialogActions>
            </Dialog>

            <table className={customClass} style={{ width: "100%" }}>
                <TableHeads
                    customClass={customClass}
                    data={headers}
                    onHeaderClick={() => {}}
                />
                <TableRows
                    customClass={customClass}
                    data={data}
                    onRowClick={handleRowClick}
                />
            </table>
        </>
    );
};

export default Orders;
