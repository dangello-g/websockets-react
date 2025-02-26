# WebSockets React Application

A React-based application that demonstrates real-time communication using WebSockets. It connects to one WebSocket server on [Java](https://github.com/dangello-g/java-sensor-microservice) and another WebSocket server on [Go](https://github.com/dangello-g/go-sensor-microservice) to receive data from simulated sensors, showcasing how to integrate WebSockets into a React application effectively.

## Features

- Real-Time Dashboard: establishes a persistent connection with WebSocket servers to receive data instantly.
- WebSocket Reconnection: automatic reconnection logic to ensure a seamless user experience in case of connection failures. This will help maintain real-time updates even when network disruptions occur.

## Planned Features

- User-Friendly Interface: Provides an intuitive UI for users to interact with the WebSocket servers, including sending messages and viewing responses.
- Error Handling Improvements: Enhance error handling mechanisms to provide clear feedback to users when the WebSocket connection fails, including UI notifications and retry options.
