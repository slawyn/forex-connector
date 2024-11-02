import React from 'react';

interface TopBarProps {
    customClass: string;
    company: string;
    balance: number;
    currency: string;
    login: string;
    server: string;
    profit: number;
    leverage: string;
    date: string;
    error: {
        error: string;
        text: string;
    };
    brokerDate: Date;
}

const TopBar: React.FC<TopBarProps> = ({ customClass, company, balance, currency, login, server, profit, leverage, date, error, brokerDate }) => {
    return (
        <table className={customClass}>
            <tbody>
                <tr>
                    <td title="Company" className={customClass}>{company}</td>
                    <td title="Balance" className={customClass}>{balance}{currency}</td>
                    <td title="Login" className={customClass}>{login}</td>
                    <td title="Server" className={customClass}>{server}</td>
                    <td title="Profit" className={customClass}>{profit}</td>
                    <td title="Leverage" className={customClass}>{leverage}</td>
                    <td title="Date" className={customClass}>{date}</td>
                    <td title="Last Status" className={customClass}>{error.error} [{error.text}]</td>
                    <td title="Broker Date" className={customClass}>{brokerDate}</td>
                </tr>
            </tbody>
        </table>
    );
}

export default TopBar;
