import React, { useRef } from "react";


const Button = ({ name, customClass }) => {
    const buttonRef = useRef(null);
    return (
        <button className={customClass} >{name}</button>
    );
};

class Trader extends React.Component {
    constructor(props) {
        super(props);
        this.tableRef = props.table;
        this.data = props.data;
        this.rowRef = React.createRef();
    }

    componentDidMount() {
    }

    render() {
        return (
            <table>
                <tbody>
                    <tr>
                        <td>
                            <form>
                                <button type="submit">Save to Google</button>
                            </form>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Button name={"Buy[Market]"} customClass={"bluebutton"} />
                        </td>
                        <td>
                            <Button name={"Buy[Limit]"} customClass={"bluebutton"} />
                        </td>
                        <td>
                            <Button name={"Buy[Stop]"} customClass={"bluebutton"} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Button name={"Sell[Market]"} customClass={"redbutton"} />
                        </td>
                        <td>
                            <Button name={"Sell[Limit]"} customClass={"redbutton"} />
                        </td>
                        <td>
                            <Button name={"Sell[Stop]"} customClass={"redbutton"} />
                        </td>
                    </tr>
                </tbody>
            </table>)
    }
}



export { Trader as default };
