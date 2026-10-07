import { DAY_RULES } from "../data/dayRules";

// Tells the visitor which day rule a tool uses. The text comes from
// dayRules.js, the same module the calculations use, so it cannot drift.
const DayRuleNote = ({ mode }) => (
  <p className="note-soft day-rule" data-day-rule={mode}>
    <strong>Käytetty sääntö.</strong> {DAY_RULES[mode].disclosure}
  </p>
);

export default DayRuleNote;
