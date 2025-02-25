
import { useEffect, useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import TemperatureSensor from './components/TemperatureSensor'
import CO2Sensor from './components/CO2Sensor'
import HumiditySensor from './components/HumiditySensor'
import LightIntensitySensor from './components/LightIntensitySensor'

export interface SensorProps {
  type: string,
  value: number,
  unit: string,
  timestamp: string
}

const TempAndCO2WebSocketURL = "wss://java-sensor-microservice.onrender.com/ws/sensor";
const HumidityAndLightWebSocketURL = "wss://go-sensor-microservice-production.up.railway.app/ws";

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [temperature, setTemperature] = useState<SensorProps>({
    type: "temperature",
    value: 0,
    unit: "°C",
    timestamp: new Date().toLocaleTimeString()
  })
  const [co2Level, setCo2Level] = useState<SensorProps>({
    type: "co2",
    value: 0,
    unit: "ppm",
    timestamp: new Date().toLocaleTimeString()
  })
  const [humidity, setHumidity] = useState<SensorProps>({
    type: "humidity",
    value: 0,
    unit: "%",
    timestamp: new Date().toLocaleTimeString()
  })
  const [lightIntensity, setLightIntensity] = useState<SensorProps>({
    type: "light",
    value: 0,
    unit: "lux",
    timestamp: new Date().toLocaleTimeString()
  })

  const temperatureAndCO2Data = () => {
    const ws = new WebSocket(TempAndCO2WebSocketURL);

    ws.onopen = () => {
      console.log("Successfully connected to temperature and CO2 level WebSocket");
    };

    ws.onmessage = (event) => {
      console.log("Data received from temperature and CO2 level");
      const data: SensorProps[] = JSON.parse(event.data);

      data.forEach((sensor) => {
        if (sensor.type === "temperature") {
          setTemperature(sensor);
        } else {
          setCo2Level(sensor);
        }
      })
    };

    ws.onerror = (error) => {
      console.error("Error on temperature and CO2 level WebSocket:", error);
    };

    ws.onclose = () => {
      console.log("Connection with temperature and CO2 level WebSocket closed");
      setSocket(null);
    };

    setSocket(ws);
  };

  const humidityAndLightData = () => {
    const ws = new WebSocket(HumidityAndLightWebSocketURL);

    ws.onopen = () => {
      console.log("Successfully connected to humidity and light intensity WebSocket");
    };

    ws.onmessage = (event) => {
      console.log("Data received from humidity and light intensity");
      const data: SensorProps[] = JSON.parse(event.data);

      data.forEach((sensor) => {
        if (sensor.type === "humidity") {
          setHumidity(sensor);
        } else {
          setLightIntensity(sensor);
        }
      })
    };

    ws.onerror = (error) => {
      console.error("Error on humidity and light intensity WebSocket:", error);
    };

    ws.onclose = () => {
      console.log("Connection with humidity and light intensity WebSocket closed");
      setSocket(null);
    };

    setSocket(ws);
  };

  useEffect(() => {
    temperatureAndCO2Data();
    humidityAndLightData();
  }, [])

  return (
    <>
      <Container fluid>
        <Row>
          <h1>Dashboard</h1>
        </Row>
        <Row className='p-3'>
          <Col>
            <TemperatureSensor {...temperature} />
          </Col>
          <Col>
            <CO2Sensor {...co2Level} />
          </Col>
        </Row>
        <Row className='p-3'>
          <Col>
            <HumiditySensor {...humidity} />
          </Col>
          <Col>
            <LightIntensitySensor {...lightIntensity} />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default App
