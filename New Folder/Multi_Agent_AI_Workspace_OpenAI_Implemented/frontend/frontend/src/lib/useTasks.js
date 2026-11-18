import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

// Loads the current workspace's tasks. While any task is "running" it re-checks every 3 seconds,
// so the status changes to Completed/Failed as soon as the agent service reports back.
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      api
        .getTasks()
        .then((list) => {
          setTasks(list);
          setError("");
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const hasRunning = tasks.some((t) => t.rawStatus === "running");

  useEffect(() => {
    if (!hasRunning) return undefined;
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [hasRunning, load]);

  return { tasks, setTasks, loading, error, reload: load };
}
