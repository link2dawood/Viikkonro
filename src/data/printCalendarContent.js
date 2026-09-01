import {
  isoWeek,
  isoYear,
  WD,
  weeksInIsoYear,
} from "../components/dateUtils.js";
import {
  getJuhlapaivat,
  getLiputuspaivat,
} from "./juhlapaivat.js";

function pad(value) {
  return String(value).padStart(2, "0");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[;"\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}

export function calendarCsv(year) {
  const holidays = getJuhlapaivat(year);
  const flagDays = getLiputuspaivat(year);
  const rows = [
    ["Päivämäärä", "Viikonpäivä", "Viikko", "Viikkovuosi", "Juhlapäivä", "Liputuspäivä"],
  ];

  for (
    let date = new Date(year, 0, 1);
    date.getFullYear() === year;
    date.setDate(date.getDate() + 1)
  ) {
    const key = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    rows.push([
      `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${year}`,
      WD[date.getDay()],
      isoWeek(date),
      isoYear(date),
      holidays.get(key) || "",
      flagDays.get(key) || "",
    ]);
  }

  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}

export function downloadCalendarCsv(year) {
  const blob = new Blob([calendarCsv(year)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `viikkokalenteri-${year}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printListFaqs(year) {
  return [
    {
      q: `Mitä tulostettava viikkolista ${year} sisältää?`,
      a: `Tulostettava viikkolista ${year} sisältää vuoden kaikki ${weeksInIsoYear(year)} ISO-viikkoa sekä jokaisen viikon maanantain ja sunnuntain päivämäärät.`,
    },
    {
      q: `Miten tallennan vuoden ${year} viikot PDF-muodossa?`,
      a: "Paina Tulosta / tallenna PDF ja valitse selaimen tulostusikkunasta PDF-tallennus. Erillistä ohjelmaa ei tarvita.",
    },
    {
      q: "Voiko viikkolistan avata Excelissä?",
      a: "Kyllä. Lataa Excel-yhteensopiva CSV-tiedosto ja avaa se Excelissä, Numbersissa tai Google Sheetsissä.",
    },
    {
      q: "Alkavatko viikot maanantaista?",
      a: "Kyllä. Lista noudattaa Suomessa käytettävää ISO 8601 -standardia, jossa viikko alkaa maanantaista ja päättyy sunnuntaihin.",
    },
    {
      q: "Mitä eroa on viikkolistalla ja tulostettavalla viikkokalenterilla?",
      a: "Viikkolista näyttää viikot riveinä alkamis- ja päättymispäivineen. Tulostettava viikkokalenteri näyttää kaikki kuukaudet visuaalisena A4-kalenterina.",
    },
  ];
}

export function printableCalendarFaqs(year) {
  return [
    {
      q: `Mitä tulostettava A4-kuukausikalenteri ${year} sisältää?`,
      a: `A4-kuukausikalenteri sisältää vuoden ${year} kaikki 12 kuukautta, ${weeksInIsoYear(year)} ISO-viikkoa, viikkonumerot sekä Suomen juhla- ja liputuspäivät.`,
    },
    {
      q: `Miten A4-kuukausikalenteri ${year} tallennetaan PDF-muodossa?`,
      a: "Paina Tulosta / tallenna PDF ja valitse tulostusikkunasta PDF-tallennus. Kalenteri on sovitettu A4-vaakasivulle.",
    },
    {
      q: "Onko tulostettava kalenteri ilmainen?",
      a: "Kyllä. Kalenterin tulostaminen, PDF-tallennus ja CSV-lataus ovat ilmaisia eivätkä vaadi rekisteröitymistä.",
    },
    {
      q: "Saako kalenterin Excel-muodossa?",
      a: "Kalenterin tiedot voi ladata Excel-yhteensopivana UTF-8 CSV-tiedostona, joka toimii myös Numbersissa ja Google Sheetsissä.",
    },
    {
      q: "Mihin viikkonumerot perustuvat?",
      a: "Viikkonumerot perustuvat ISO 8601 -standardiin: viikko alkaa maanantaista ja viikko 1 sisältää vuoden ensimmäisen torstain.",
    },
  ];
}
