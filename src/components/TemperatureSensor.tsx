import { SensorProps } from "../App";

export default function TemperatureSensor({ value, unit, timestamp }: SensorProps) {
    return (
        <>
            <span>Data: {value} {unit} at: {timestamp}</span>
        </>
    );
}