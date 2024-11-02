import React, { useState } from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Table, { mapTerminalData } from "src/elements/table/Table";


interface OrdersProps {
    customClass: string;
    headers: string[];
    openPositions: any[][];
    handlers: {
        closeOrder: (type: string, name: string, id: number, volume: number) => void;
    };
}

const Orders: React.FC<OrdersProps> = ({ customClass, headers, openPositions, handlers }) => {
    const [dialogData, setDialogData] = useState({
        type: "",
        state: false,
        id: 0,
        name: "",
        volume: 0,
        ask: 0,
        bid: 0
    });

    const handleDialogClose = (confirm: boolean) => {
        if (confirm) {
            handlers.closeOrder(
                dialogData.type,
                dialogData.name,
                dialogData.id,
                dialogData.volume
            );
        }
        setDialogData(prev => ({ ...prev, state: false }));
    };

    const handleRowClick = (id: string, items: any[]) => {
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
            <Table customClass={customClass}
                    customHeaderClass="css-green-background"
                    headers={headers}
                    data={mapTerminalData(Object.values(openPositions).flat())}
                    onRowClick={handleRowClick}
            />
        </>
    );
};

// Symbols.whyDidYouRender = true
export default Orders;
