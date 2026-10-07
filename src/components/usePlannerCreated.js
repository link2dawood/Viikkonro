import { useEffect, useRef } from "react";
import { trackPlannerCreated } from "../analytics";

// Sends "planner_created" once the visitor has changed an input and the tool
// shows a result. Pass null while the result is invalid. The first render (the
// prerendered default state) never counts, and edits are debounced so typing
// a number does not fire an event per keystroke.
export default function usePlannerCreated(props) {
  const key = props ? JSON.stringify(props) : null;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    if (!key) return undefined;
    const id = setTimeout(() => trackPlannerCreated(JSON.parse(key)), 1000);
    return () => clearTimeout(id);
  }, [key]);
}
