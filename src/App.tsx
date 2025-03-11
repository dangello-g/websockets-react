import { useEffect, useCallback, useState, useRef } from "react";
import TemperatureSensor from "./components/TemperatureSensor";
import CO2Sensor from "./components/CO2Sensor";
import HumiditySensor from "./components/HumiditySensor";
import LightIntensitySensor from "./components/LightIntensitySensor";
import type { SensorData, SensorProps } from "./types/sensors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleAlert, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";

const TEMPCO2_WEBSOCKET_URL =
  "wss://java-sensor-microservice.onrender.com/ws/sensor";
const HUMLIGHT_WEBSOCKET_URL =
  "wss://go-sensor-microservice-production.up.railway.app/ws";
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

type ConnectionStatus = "connected" | "disconnected" | "error";

function App() {
  const tempCo2SocketRef = useRef<WebSocket | null>(null);
  const humLightSocketRef = useRef<WebSocket | null>(null);
  const [tempCo2Sensor, setTempCo2Sensor] = useState<SensorData[]>([]);
  const [humLightSensor, setHumLightSensor] = useState<SensorData[]>([]);
  const [connectionStatus1, setConnectionStatus1] =
    useState<ConnectionStatus>("disconnected");
  const [connectionStatus2, setConnectionStatus2] =
    useState<ConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [, setReconnectAttempts1] = useState(0);
  const [, setReconnectAttempts2] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(
    (
      url: string,
      setData: React.Dispatch<React.SetStateAction<SensorData[]>>,
      setStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>,
      setAttempts: React.Dispatch<React.SetStateAction<number>>,
      socketRef: React.RefObject<WebSocket | null>
    ) => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        console.log(`WebSocket already connected to ${url}`);
        return;
      }

      let socket: WebSocket;

      try {
        socket = new WebSocket(url);
        socketRef.current = socket;
      } catch (error) {
        console.error("WebSocket construction error:", error);
        setStatus("error");
        setErrorMessage(
          `Failed to create WebSocket connection to ${url}. Please check your network connection.`
        );
        return null;
      }

      socket.onopen = () => {
        console.log(`WebSocket connected to ${url}`);
        setStatus("connected");
        setErrorMessage(null);
        setInfoMessage(null);
        setAttempts(0);
      };

      socket.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          data = event.data;
        }
        if (Array.isArray(data)) {
          setData(data);
        } else if (typeof data === "string") {
          console.log(`Backend response: ${data}`);
          setInfoMessage(`Server response: ${data}`);
        } else {
          console.error("Unexpected data format:", data);
          setErrorMessage(`Invalid data format received from ${url}.`);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("error");
        setErrorMessage(
          `An error occurred with the WebSocket connection to ${url}.`
        );
      };

      socket.onclose = (event) => {
        console.log(`WebSocket disconnected from ${url}:`, event.reason);
        setStatus("disconnected");
        socketRef.current = null;

        setAttempts((prevAttempts) => {
          const newAttempts = prevAttempts + 1;
          if (newAttempts <= MAX_RECONNECT_ATTEMPTS) {
            setErrorMessage(
              `Connection to ${url} lost. Attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS} to reconnect...`
            );
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket(url, setData, setStatus, setAttempts, socketRef);
            }, RECONNECT_INTERVAL);
          } else {
            setErrorMessage(
              `Failed to reconnect to ${url} after ${MAX_RECONNECT_ATTEMPTS} attempts. Please try manual reconnection.`
            );
          }
          return newAttempts;
        });
      };

      return socket;
    },
    []
  );

  useEffect(() => {
    const tempCo2Socket = connectWebSocket(
      TEMPCO2_WEBSOCKET_URL,
      setTempCo2Sensor,
      setConnectionStatus1,
      setReconnectAttempts1,
      tempCo2SocketRef
    );
    const humLightSocket = connectWebSocket(
      HUMLIGHT_WEBSOCKET_URL,
      setHumLightSensor,
      setConnectionStatus2,
      setReconnectAttempts2,
      humLightSocketRef
    );

    return () => {
      if (tempCo2Socket) tempCo2Socket.close();
      if (humLightSocket) humLightSocket.close();
    };
  }, []);

  useEffect(() => {
    if (infoMessage) {
      const timer = setTimeout(() => setInfoMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [infoMessage]);

  const getLatestValueByType = (
    type: string
  ): Omit<SensorProps, "onThresholdAlert"> => {
    const sensor1 = tempCo2Sensor.find((data) => data.type === type);
    const sensor2 = humLightSensor.find((data) => data.type === type);
    return sensor1
      ? { value: sensor1.value, timestamp: sensor1.timestamp }
      : sensor2
      ? { value: sensor2.value, timestamp: sensor2.timestamp }
      : { value: 0, timestamp: "" };
  };

  const handleThresholdAlert = (type: string, value: number) => {
    const message = JSON.stringify({
      type,
      value,
      timestamp: new Date().toString(),
    });

    let socketRef: React.RefObject<WebSocket | null> | null = null;

    if (type === "temperature" || type === "co2") {
      socketRef = tempCo2SocketRef;
    } else if (type === "humidity" || type === "light") {
      socketRef = humLightSocketRef;
    }

    if (
      socketRef &&
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      socketRef.current.send(message);
      console.log(`Sent alert for ${type}: ${value}`);
    } else {
      console.error(`WebSocket not connected for ${type}`);
      setErrorMessage(
        `Failed to send alert for ${type}. WebSocket not connected.`
      );
    }
  };

  const handleManualReconnect = (
    url: string,
    setData: React.Dispatch<React.SetStateAction<SensorData[]>>,
    setStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>,
    setAttempts: React.Dispatch<React.SetStateAction<number>>,
    socketRef: React.RefObject<WebSocket | null>
  ) => {
    setStatus("disconnected");
    setErrorMessage(`Manually reconnecting to ${url}...`);
    setAttempts(0);

    if (socketRef.current) {
      socketRef.current.close();
    }

    connectWebSocket(url, setData, setStatus, setAttempts, socketRef);
  };

  return (
    <div className="container w-11/12 mx-auto p-4 space-y-4">
      <NavBar />

      {infoMessage && (
        <Alert>
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>{infoMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-end sm:items-center">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <span>Temperature/CO2: {connectionStatus1}</span>
            <Button
              onClick={() =>
                handleManualReconnect(
                  TEMPCO2_WEBSOCKET_URL,
                  setTempCo2Sensor,
                  setConnectionStatus1,
                  setReconnectAttempts1,
                  tempCo2SocketRef
                )
              }
              disabled={connectionStatus1 === "connected"}
              size="sm"
            >
              Reconnect
            </Button>

            <span>Humidity/Light: {connectionStatus2}</span>
            <Button
              onClick={() =>
                handleManualReconnect(
                  HUMLIGHT_WEBSOCKET_URL,
                  setHumLightSensor,
                  setConnectionStatus2,
                  setReconnectAttempts2,
                  humLightSocketRef
                )
              }
              disabled={connectionStatus2 === "connected"}
              size="sm"
            >
              Reconnect
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TemperatureSensor
          {...getLatestValueByType("temperature")}
          onThresholdAlert={(value) =>
            handleThresholdAlert("temperature", value)
          }
        />
        <HumiditySensor
          {...getLatestValueByType("humidity")}
          onThresholdAlert={(value) => handleThresholdAlert("humidity", value)}
        />
        <CO2Sensor
          {...getLatestValueByType("co2")}
          onThresholdAlert={(value) => handleThresholdAlert("co2", value)}
        />
        <LightIntensitySensor
          {...getLatestValueByType("light")}
          onThresholdAlert={(value) => handleThresholdAlert("light", value)}
        />
      </div>
    </div>
  );
}

export default App;
