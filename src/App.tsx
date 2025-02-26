
import { useEffect, useCallback, useState } from 'react'
import { AlertCircle } from "lucide-react"
import { Container, Row, Col, Alert, Button, Spinner } from 'react-bootstrap'
import TemperatureSensor from './components/TemperatureSensor'
import CO2Sensor from './components/CO2Sensor'
import HumiditySensor from './components/HumiditySensor'
import LightIntensitySensor from './components/LightIntensitySensor'
import type { SensorData, SensorProps } from "./types/sensors"

const TEMPCO2_WEBSOCKET_URL = "wss://java-sensor-microservice.onrender.com/ws/sensor"
const HUMLIGHT_WEBSOCKET_URL = "wss://go-sensor-microservice-production.up.railway.app/ws"
const RECONNECT_INTERVAL = 5000
const MAX_RECONNECT_ATTEMPTS = 5

type ConnectionStatus = "connected" | "disconnected" | "error"

function App() {
  const [tempCo2Sensor, setTempCo2Sensor] = useState<SensorData[]>([])
  const [humLightSensor, setHumLightSensor] = useState<SensorData[]>([])
  const [connectionStatus1, setConnectionStatus1] = useState<ConnectionStatus>("disconnected")
  const [connectionStatus2, setConnectionStatus2] = useState<ConnectionStatus>("disconnected")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [, setReconnectAttempts1] = useState(0)
  const [, setReconnectAttempts2] = useState(0)

  const connectWebSocket = useCallback(
    (
      url: string,
      setData: React.Dispatch<React.SetStateAction<SensorData[]>>,
      setStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>,
      setAttempts: React.Dispatch<React.SetStateAction<number>>,
    ) => {
      let socket: WebSocket

      try {
        socket = new WebSocket(url)
      } catch (error) {
        console.error("WebSocket construction error:", error)
        setStatus("error")
        setErrorMessage(`Failed to create WebSocket connection to ${url}. Please check your network connection.`)
        return null
      }

      socket.onopen = () => {
        console.log(`WebSocket connected to ${url}`)
        setStatus("connected")
        setErrorMessage(null)
        setAttempts(0)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setData(data)
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
          setErrorMessage(`Received invalid data from ${url}.`)
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error)
        setStatus("error")
        setErrorMessage(`An error occurred with the WebSocket connection to ${url}.`)
      }

      socket.onclose = (event) => {
        console.log(`WebSocket disconnected from ${url}:`, event.reason)
        setStatus("disconnected")
        setAttempts((prevAttempts) => {
          const newAttempts = prevAttempts + 1
          if (newAttempts <= MAX_RECONNECT_ATTEMPTS) {
            setErrorMessage(
              `Connection to ${url} lost. Attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS} to reconnect...`,
            )
            setTimeout(() => connectWebSocket(url, setData, setStatus, setAttempts), RECONNECT_INTERVAL)
          } else {
            setErrorMessage(
              `Failed to reconnect to ${url} after ${MAX_RECONNECT_ATTEMPTS} attempts. Please try manual reconnection.`,
            )
          }
          return newAttempts
        })
      }

      return socket
    },
    [],
  )

  useEffect(() => {
    const tempCo2Socket = connectWebSocket(TEMPCO2_WEBSOCKET_URL, setTempCo2Sensor, setConnectionStatus1, setReconnectAttempts1)
    const humLightSocket = connectWebSocket(HUMLIGHT_WEBSOCKET_URL, setHumLightSensor, setConnectionStatus2, setReconnectAttempts2)

    return () => {
      if (tempCo2Socket) tempCo2Socket.close()
      if (humLightSocket) humLightSocket.close()
    }
  }, [connectWebSocket])

  const getLatestValueByType = (type: string): Omit<SensorProps, "onThresholdAlert"> => {
    const sensor1 = tempCo2Sensor.find((data) => data.type === type)
    const sensor2 = humLightSensor.find((data) => data.type === type)
    return sensor1 ? { value: sensor1.value, timestamp: sensor1.timestamp }
      : sensor2 ? { value: sensor2.value, timestamp: sensor2.timestamp }
        : { value: 0, timestamp: "" };
  }

  const handleThresholdAlert = async (type: string, value: number) => {
    try {
      // TODO
      // const response = await fetch("/api/alert", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ type, value }),
      // })

      // if (!response.ok) {
      // //   throw new Error("Failed to send alert")
      // }

      console.log(`Alert sent for ${type}: ${value}`)
    } catch (error) {
      console.error("Error sending alert:", error)
      setErrorMessage("Failed to send alert. Please try again.")
    }
  }

  const handleManualReconnect = (
    url: string,
    setData: React.Dispatch<React.SetStateAction<SensorData[]>>,
    setStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>,
    setAttempts: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    setStatus("disconnected")
    setErrorMessage(`Manually reconnecting to ${url}...`)
    setAttempts(0)
    connectWebSocket(url, setData, setStatus, setAttempts)
  }

  return (
    <Container fluid>
      <Row>
        <h1>Dashboard</h1>
      </Row>
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }}>
        <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </symbol>
      </svg>
      {errorMessage && (
        <Alert variant="danger" className="d-flex align-items-center" role="alert">
          <svg className="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlinkHref="#exclamation-triangle-fill" /></svg>
          <div>
            <Alert.Heading>Error</Alert.Heading>
            <p className="mb-0">{errorMessage} <Spinner animation="border" size="sm" /></p>
          </div>
        </Alert>
      )}
      <Row className="align-items-center">
        <Col xs={12} md={6} className="mb-3 mb-md-0">
        </Col>
        <Col xs={12} md={6}>
          <Row className="g-2">
            <Col xs={12} sm={6} className="d-flex justify-content-between align-items-center">
              <span className="fw-medium">Temperature/CO2: {connectionStatus1}</span>
              <Button
                onClick={() =>
                  handleManualReconnect(TEMPCO2_WEBSOCKET_URL, setTempCo2Sensor, setConnectionStatus1, setReconnectAttempts1)
                }
                disabled={connectionStatus1 === "connected"}
                size="sm"
              >
                Reconnect
              </Button>
            </Col>

            <Col xs={12} sm={6} className="d-flex justify-content-between align-items-center">
              <span className="fw-medium">Humidity/Light: {connectionStatus2}</span>
              <Button
                onClick={() =>
                  handleManualReconnect(HUMLIGHT_WEBSOCKET_URL, setHumLightSensor, setConnectionStatus2, setReconnectAttempts2)
                }
                disabled={connectionStatus2 === "connected"}
                size="sm"
              >
                Reconnect
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row className='p-3'>
        <Col>
          <TemperatureSensor
            {...getLatestValueByType("temperature")}
            onThresholdAlert={(value) => handleThresholdAlert("temperature", value)}
          />
        </Col>
        <Col>
          <HumiditySensor
            {...getLatestValueByType("humidity")}
            onThresholdAlert={(value) => handleThresholdAlert("humidity", value)}
          />
        </Col>
      </Row>
      <Row className='p-3'>
        <Col>
          <CO2Sensor
            {...getLatestValueByType("co2")}
            onThresholdAlert={(value) => handleThresholdAlert("co2", value)}
          />
        </Col>
        <Col>
          <LightIntensitySensor
            {...getLatestValueByType("light")}
            onThresholdAlert={(value) => handleThresholdAlert("light", value)}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default App
