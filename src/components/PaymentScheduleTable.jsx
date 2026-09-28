import { Link } from "react-router-dom";
import { paymentSchedule } from "../data/benefitPaymentPages";

// Month-by-benefit payment table shared by /kelan-maksupaivat-{year} and
// /elakkeen-maksupaivat-{year}. Each date links to its ISO week page and each
// month to its month page, so the table doubles as internal linking into the
// week/month hierarchy. Fully deterministic, so SSR and hydration agree.
const PaymentScheduleTable = ({ year, benefits, caption }) => {
  const rows = paymentSchedule(year, benefits);
  return (
    <div className="table-wrap">
      <table className="data-table payment-table">
        <caption className="payment-caption">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Kuukausi</th>
            {benefits.map((b) => (
              <th scope="col" key={b.id}>
                {b.column}
                <span className="payment-rule">{b.rule}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <th scope="row">
                <Link to={`/kuukausi-${row.month}-${year}`}>{row.monthName}</Link>
              </th>
              {row.cells.map((cell, i) => (
                <td key={benefits[i].id}>
                  <Link to={`/viikko-${cell.week}-${cell.weekYear}`}>
                    {cell.weekday.slice(0, 2).toLowerCase()} {cell.actual.getDate()}.
                    {cell.actual.getMonth() + 1}.
                  </Link>
                  {cell.moved && (
                    <span className="payday-moved">
                      {" "}
                      {cell.early ? "etuajassa" : "siirtyy"} ({cell.reason.toLowerCase()}{" "}
                      {cell.nominal.getDate()}.{cell.nominal.getMonth() + 1}.)
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentScheduleTable;
