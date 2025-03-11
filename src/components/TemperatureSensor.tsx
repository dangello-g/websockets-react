import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Thermometer } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { SensorProps } from "../types/sensors";
import { useTheme } from "@/components/ThemeProvider";

export default function TemperatureSensor({
  value,
  timestamp,
  onThresholdAlert,
}: SensorProps) {
  const [data, setData] = useState<{ value: number; time: string }[]>([]);
  const threshold = 50;
  const { theme } = useTheme();

  useEffect(() => {
    setData((prevData) =>
      [
        ...prevData,
        { value, time: new Date(timestamp).toLocaleTimeString() },
      ].slice(-10)
    );
  }, [value, timestamp]);

  const handleThresholdAlert = () => {
    onThresholdAlert(value);
  };

  return (
    <>
      <Card className="h-96">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Temperature</CardTitle>
          <Thermometer />
        </CardHeader>
        <CardContent>
          <div className="text-3xl">{value.toFixed(2)}°C</div>
          <p className="text-gray-500 text-xs">Last 10 readings</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="5 5" />
                <XAxis
                  dataKey="time"
                  stroke={theme === "dark" ? "#fff" : "#333"}
                />
                <YAxis stroke={theme === "dark" ? "#fff" : "#333"} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ffb400"
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Button
            className="mt-4 w-full"
            onClick={handleThresholdAlert}
            disabled={value <= threshold}
          >
            {value > threshold
              ? `Alert: High Temperature at ${new Date(
                  timestamp
                ).toLocaleTimeString()}`
              : `Threshold: ${threshold}`}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
