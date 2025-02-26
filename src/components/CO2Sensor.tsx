import { Button, Card } from "react-bootstrap";
import { Cloud } from "lucide-react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { SensorProps } from "../types/sensors";

export default function CO2Sensor({ value, timestamp, onThresholdAlert }: SensorProps) {
    const [data, setData] = useState<{ value: number, time: string }[]>([]);
    const threshold = 800;

    useEffect(() => {
        setData((prevData) => [...prevData, { value, time: new Date(timestamp).toLocaleTimeString() }].slice(-10));
    }, [value, timestamp]);

    const handleThresholdAlert = () => {
        onThresholdAlert(value);
    };

    return (
        <>
            <Card>
                <Card.Header className="d-flex flex-row align-items-center justify-content-between pb-2">
                    <Card.Title>CO2 Level</Card.Title>
                    <Cloud />
                </Card.Header>
                <Card.Body>
                    <div className="display-4 font-weight-bold">{value.toFixed(2)} ppm</div>
                    <p className="text-muted" style={{ fontSize: "0.85rem" }}>Last 10 readings</p>
                    <div style={{ height: "250px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="5 5" />
                                <XAxis dataKey="time" />
                                <YAxis domain={[400, 1000]} />
                                <Tooltip />
                                <Line dataKey="value" stroke="#ffc658" activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <Button className="mt-4 w-100" onClick={handleThresholdAlert} disabled={value <= threshold}>{value > threshold ? `Alert: High CO2 Level at ${new Date(timestamp).toLocaleTimeString()}` : `Threshold: ${threshold}`}</Button>
                </Card.Body>
            </Card>
        </>
    );
}