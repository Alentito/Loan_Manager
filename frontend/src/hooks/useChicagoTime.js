import { useState, useEffect } from "react";

export const useChicagoTime = () => {
  const [time, setTime] = useState("");
  const [period, setPeriod] = useState(""); // AM or PM

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Get Chicago time explicitly
      const options = {
        timeZone: "America/Chicago",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour12: false,  // <-- always 24-hour clock
      };
      const chicagoTime = now.toLocaleString("en-US", options);
      
      // Extract hour to calculate AM/PM manually
      const chicagoHour = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Chicago" })
      ).getHours();
      const ampm = chicagoHour >= 12 ? "PM" : "AM";

      setTime(chicagoTime);
      setPeriod(ampm);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // update every sec
    return () => clearInterval(interval);
  }, []);

  return { time, period }; // returns both
};
