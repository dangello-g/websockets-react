import { SensorProps } from "../App";

export default function CO2Sensor({ value, unit, timestamp }: SensorProps) {
    return (
        <>
            <span>Data: {value} {unit} at: {timestamp}</span>
        </>
    );
}