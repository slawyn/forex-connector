import React, { } from "react";


const Header = ({customClass, account, date, errorData, getSymbols}) => {

    return (
    <>
        <table className={customClass}>
        <tbody>
          <tr>
            <td className={customClass}>Company</td>
            <td className={customClass}>Balance</td>
            <td className={customClass}>Login</td>
            <td className={customClass}>Server</td>
            <td className={customClass}>Profit</td>
            <td className={customClass}>Leverage</td>
            <td className={customClass}>Date</td>
            <td className={customClass}>
              <button className={"clsBluebutton"} onClick={getSymbols}>Get Symbols</button>
            </td>

          </tr>
          <tr>
            <td className={customClass}>{account.company}</td>
            <td className={customClass}>{account.balance}{account.currency}</td>
            <td className={customClass}>{account.login}</td>
            <td className={customClass}>{account.server}</td>
            <td className={customClass}>{account.profit}</td>
            <td className={customClass}>{account.leverage}</td>
            <td className={customClass}>{date}</td>
            <td className={customClass}>Last Error:{errorData.error}</td>
          </tr>
        </tbody>
      </table>
    </>)
};

export { Header as default};