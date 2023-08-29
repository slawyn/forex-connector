import React, { useRef, useState, useEffect, createRef } from "react";


const sort = (ref, col) => {
    var sortDirection = true;
    var column = col;
    var table = ref;
    return () => {
        sortDirection = !sortDirection;
        var rows, i, x, y, shouldSwitch;
        var switching = true;

        while (switching) {

            switching = false;
            rows = table.rows;

            /* Loop through all table rows (except the
            first, which contains table headers): */
            for (i = 1; i < (rows.length - 1); i++) {
                shouldSwitch = false;

                x = rows[i].getElementsByTagName("TD")[column];
                y = rows[i + 1].getElementsByTagName("TD")[column];

                // If so, mark as a switch and break the loop:
                if (sortDirection) {

                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {

                        shouldSwitch = true;
                        break;
                    }
                } else if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }

            /* If a switch has been marked, make the switch
                and mark that a switch has been done: */
            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
            }
        }
    };
}

function postInstrument(instr) {
    const instrument = instr;
    return () => {

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer my-token',

            },
            body: JSON.stringify({ 'Instrument': instrument })
        };
        fetch('/command', requestOptions)
            .then(response => response.json())
            .then(data => { console.log("LOG:Instrument sent") });
    }
}


const TableHeadItem = ({ hparam0, hparam1, item, className }) => {
    return (
        <th title={item} className={className} onClick={sort(hparam0, hparam1)}>
            {item}
        </th>
    );
};


const TableRow = ({ data }) => {
    var instrument = data[0];
    return (
        <tr onClick={postInstrument(instrument)}>
            {data.map((item) => {
                return <td key={item}>{item}</td>;
            })}
        </tr>
    );
};

class Table extends React.Component {

    constructor(props) {
        super(props);
        this.tableRef = React.createRef();
        this.customClass = props.customClass;
        this.headerData = ["INSTRUMENT", "ATR", "CHANGE", "TIME"];
        this.state = {
            data: []
        };
    }

    UpdateComponent() {
        /* Updater */
        // Using fetch to fetch the api from
        // flask server it will be redirected to proxy
        fetch("/update").then((res) =>
            res.json().then((received) => {
                this.setState({
                    data: received
                })
            })


        );
    }

    componentDidMount() {
        //this.UpdateComponent();
        /* Update periodically */
        this.interval = setInterval(() => this.UpdateComponent(), 2000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        var headerCount = -1;
        return (
            <table ref={this.tableRef} className={this.customClass}>
                <thead>
                    <tr>
                        {this.headerData.map((h) => {
                            headerCount += 1;
                            return <TableHeadItem hparam0={this.tableRef.current} hparam1={headerCount} key={h} item={h} className={this.ustomClass} />;
                        })}
                    </tr>
                </thead>
                <tbody>
                    {this.state.data.map((item) => {
                        return <TableRow key={item.id} data={item.items} />;
                    })}
                </tbody>
            </table>
        );
    }
};


export { Table as default };
