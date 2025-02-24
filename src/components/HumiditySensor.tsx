import { Card } from "react-bootstrap";
import { Droplets } from "lucide-react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { SensorProps } from "../App";

export default function HumiditySensor({ value, timestamp }: SensorProps) {
    const [data, setData] = useState<{ value: number, time: string }[]>([]);

    useEffect(() => {
        setData((prevData) => [...prevData, { value, time: new Date(timestamp).toLocaleTimeString() }].slice(-10));
    }, [value, timestamp]);

    return (
        <>
            <Card>
                <Card.Header className="d-flex flex-row align-items-center justify-content-between pb-2">
                    <Card.Title>Humidity</Card.Title>
                    <Droplets />
                </Card.Header>
                <Card.Body>
                    <div className="display-4 font-weight-bold">{value.toFixed(2)} %</div>
                    <p className="text-muted" style={{ fontSize: "0.85rem" }}>Last 10 readings</p>
                    <div style={{ height: "250px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="5 5" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line dataKey="value" stroke="#82ca9d" activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card.Body>
            </Card>

        </>
    );
}