
function TopBar({customClass, company, balance, currency, login, server, profit, leverage, date, error}){

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
              <td className={customClass}>Last Error:{error}</td>
            </tr>
        </tbody>
    </table>
  )
}


export default TopBar;