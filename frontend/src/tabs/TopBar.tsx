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
}

const TopBar: React.FC<TopBarProps> = ({ customClass, company, balance, currency, login, server, profit, leverage, date, error }) => {
    return (
        <table className={customClass}>
            <tbody>
                <tr>
                    <td className={customClass}>Company: {company}</td>
                    <td className={customClass}>Balance: {balance}{currency}</td>
                    <td className={customClass}>Login: {login}</td>
                    <td className={customClass}>Server: {server}</td>
                    <td className={customClass}>Profit: {profit}</td>
                    <td className={customClass}>Leverage: {leverage}</td>
                    <td className={customClass}>Date: {date}</td>
                    <td className={customClass}>Last Status: {error.error} [{error.text}]</td>
                </tr>
            </tbody>
        </table>
    );
}

export default TopBar;
