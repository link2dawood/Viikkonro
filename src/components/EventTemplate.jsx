import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { helsinkiDayKey } from "./dateUtils.js";
import { useToday } from "./useToday.js";
import { CONTENT_UPDATED, CONTENT_UPDATED_FI } from "../data/seo.js";
import {
  countdownSentence,
  eventCountdown,
  eventReviewedFi,
  eventReviewedFor,
} from "../data/eventTemplate.js";
import "./eventTemplate.css";

// The reusable event-page block, in the order a dated query wants it:
//
//   1. the answer in the first line (date, weekday, week number)
//   2. a countdown to the day
//   3. is it a day off
//   4. a link to next year's page
//   5. a calendar CTA
//   6. the visible "Päivitetty" line, from the same review date the page's
//      schema dateModified and sitemap lastmod use
//
// The day count comes from useToday(): the prerendered day while hydrating,
// the live day immediately after, so a visitor never sees a stale number and
// hydration never mismatches. The hour and minute figures render only after
// mount, because they change every minute and cannot be prerendered.
//
// `answer` keeps the .answer-sentence wrapper the pages' speakable schema
// targets, so the first sentence stays the one answer engines lift.
function clockLeft(target, now) {
  const totalMin = Math.max(0, Math.floor((target - now) / 60000));
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
  };
}

export default function EventTemplate({
  path,
  answer,
  answerTail,
  target,
  nameCap,
  illative,
  dayOff,
  nextYear,
  calendar,
}) {
  const today = useToday();
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const { days, state } = eventCountdown(target, today);
  const sentence = countdownSentence({ nameCap, illative, target, today });
  // A page with a recorded review date states that date, once the day has
  // actually arrived; the rest fall back to the site-wide editorial date they
  // showed before, so no page ever claims a freshness it does not have. The
  // same guard gates the schema dateModified and the sitemap lastmod.
  const reviewed = eventReviewedFor(path, helsinkiDayKey(today));
  const reviewedLabel = reviewed ? eventReviewedFi(path) : CONTENT_UPDATED_FI;
  const clock = now && days > 0 ? clockLeft(target, now) : null;

  return (
    <>
      <p className="lead">
        <span className="answer-sentence">
          <strong>{answer}</strong>
        </span>
        {answerTail ? <> {answerTail}</> : null}
      </p>

      <div className="event-countdown">
        {state === "future" && <span className="event-countdown-days">{days}</span>}
        <span className="event-countdown-text" aria-live="polite">
          {sentence ?? `${nameCap} on jo mennyt.`}
        </span>
        {clock && (
          <span className="event-countdown-clock">
            Tarkalleen {clock.days} pv {clock.hours} h {clock.minutes} min
          </span>
        )}
      </div>

      <dl className="event-verdict">
        <dt>{dayOff.question}</dt>
        <dd>
          <strong>{dayOff.verdict}.</strong>
          {dayOff.detail ? <> {dayOff.detail}</> : null}
        </dd>
      </dl>

      <p className="event-actions">
        {nextYear && (
          <span>
            Seuraava vuosi: <Link to={nextYear.to}>{nextYear.label}</Link>.
          </span>
        )}
        <Link className="event-cta" to={calendar.to}>
          {calendar.label}
        </Link>
      </p>

      <p className="note-soft">
        Sisältö päivitetty <time dateTime={reviewed ?? CONTENT_UPDATED}>{reviewedLabel}</time>.
      </p>
    </>
  );
}
