export interface SensorProps {
    value: number,
    timestamp: string,
    onThresholdAlert: (value: number) => void
}

export interface SensorData {
    type: string
    value: number
    unit: string
    timestamp: string
}