#!/bin/bash

# Strudel MCP Demo Script
# Shows how the MCP integration works

echo "🎵 Strudel MCP Demo"
echo "=================="
echo ""
echo "This demo shows how AI can control Strudel patterns"
echo ""

# Check if pattern bridge is running
check_bridge() {
    curl -s http://localhost:3457 > /dev/null 2>&1
    return $?
}

# Send a pattern to the bridge
send_pattern() {
    local pattern="$1"
    echo "📤 Sending pattern: $pattern"
    curl -X POST http://localhost:3457/pattern \
        -H "Content-Type: application/json" \
        -d "{\"code\":\"$pattern\"}" \
        -s > /dev/null
    echo "✅ Pattern sent!"
    echo ""
}

# Demo patterns
demo_patterns() {
    echo "Starting demo patterns..."
    echo "========================"
    echo ""
    
    sleep 2
    echo "1. Simple drum beat"
    send_pattern 's("bd sd bd sd")'
    sleep 5
    
    echo "2. Adding hi-hats"
    send_pattern 'stack(s("bd sd bd sd"), s("hh*8").gain(0.4))'
    sleep 5
    
    echo "3. Euclidean rhythm"
    send_pattern 's("bd").euclid(5,8).stack(s("hh*4"))'
    sleep 5
    
    echo "4. Melodic pattern"
    send_pattern 'note("c4 e4 g4 c5").s("piano").stack(s("bd sd"))'
    sleep 5
    
    echo "5. Complex pattern with effects"
    send_pattern 'stack(
        s("bd*4, sd(3,8), hh*8"),
        note("c3 e3 g3 b3".fast(2))
            .s("sawtooth")
            .cutoff(sine.range(400,2000).slow(4))
            .delay(0.25)
    )'
}

# Main
echo "Checking if pattern bridge is running..."
if check_bridge; then
    echo "✅ Pattern bridge is running!"
    echo ""
    echo "Make sure you have http://localhost:4321 open in your browser"
    echo "You should see the green '🎵 MCP' indicator"
    echo ""
    read -p "Press Enter to start the demo..."
    echo ""
    demo_patterns
    echo "Demo complete! 🎉"
else
    echo "❌ Pattern bridge not running"
    echo ""
    echo "Start it with:"
    echo "  cd packages/mcp-server"
    echo "  node index.js"
    echo ""
    echo "Or for full MCP setup:"
    echo "  ./install-mcp.sh"
fi