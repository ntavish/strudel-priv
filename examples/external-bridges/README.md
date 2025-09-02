# External Bridge Examples

Collection of example implementations for the Strudel External Pattern Bridge.

## Available Examples

### basic-bridge.js
A minimal Node.js HTTP bridge implementation.

### osc-bridge.py
Python bridge that converts OSC messages to Strudel patterns.

### websocket-bridge.js
WebSocket bridge for real-time bidirectional communication.

### midi-bridge.html
Browser-based MIDI to pattern converter using WebMIDI API.

## Usage

1. Start Strudel REPL (it will automatically detect bridges on localhost:3457)
2. Run one of the bridge examples
3. Send patterns through your chosen interface

## Creating Your Own Bridge

Any HTTP server that implements these endpoints can act as a bridge:

- `POST /pattern` - Receive patterns to queue
- `GET /next` - Serve queued patterns to Strudel
- `POST /current` - Receive current pattern from Strudel

See the basic-bridge.js for a minimal implementation.

## Security

All examples are configured for localhost only. Do not expose bridges to the internet without authentication.