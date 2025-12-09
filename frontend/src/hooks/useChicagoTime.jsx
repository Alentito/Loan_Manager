import { useState, useEffect } from "react";

export const useChicagoTime = () => {
  const [time, setTime] = useState("Loading...");
  const [period, setPeriod] = useState("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();

        const options = {
          timeZone: "America/Chicago",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          weekday: "short",
          month: "short",
          day: "numeric",
          hour12: false,
        };

        const chicagoTime = now.toLocaleString("en-US", options);

        const chicagoHour = new Date(
          now.toLocaleString("en-US", { timeZone: "America/Chicago" })
        ).getHours();

        const ampm = chicagoHour >= 12 ? "PM" : "AM";

        setTime(chicagoTime);
        setPeriod(ampm);
      } catch (err) {
        console.error("Chicago time conversion failed:", err);
        setTime("Time unavailable");
        setPeriod("");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return { time, period };
};
