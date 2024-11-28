package ws

import (
	"sync"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

// Client represents a WebSocket client connection
type Client struct {
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan []byte
	UserID string
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	clients    map[*Client]bool
	userMap    map[string][]*Client // Map userID to their clients
	broadcast  chan *Message
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
	logger     *zap.Logger
}

// Message represents a notification message to be sent
type Message struct {
	UserID  string `json:"user_id"` // Target user (empty for broadcast)
	Type    string `json:"type"`    // Notification type
	Payload []byte `json:"payload"` // JSON payload
}

// NewHub creates a new WebSocket hub
func NewHub(logger *zap.Logger) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		userMap:    make(map[string][]*Client),
		broadcast:  make(chan *Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		logger:     logger,
	}
}

// Run starts the hub's event loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			if client.UserID != "" {
				h.userMap[client.UserID] = append(h.userMap[client.UserID], client)
			}
			h.mu.Unlock()
			h.logger.Info("WebSocket client connected", zap.String("user_id", client.UserID))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				// Remove from userMap
				if client.UserID != "" {
					clients := h.userMap[client.UserID]
					for i, c := range clients {
						if c == client {
							h.userMap[client.UserID] = append(clients[:i], clients[i+1:]...)
							break
						}
					}
				}
			}
			h.mu.Unlock()
			h.logger.Info("WebSocket client disconnected", zap.String("user_id", client.UserID))

		case message := <-h.broadcast:
			h.mu.RLock()
			if message.UserID != "" {
				// Send to specific user
				if clients, ok := h.userMap[message.UserID]; ok {
					for _, client := range clients {
						select {
						case client.Send <- message.Payload:
						default:
							close(client.Send)
							delete(h.clients, client)
						}
					}
				}
			} else {
				// Broadcast to all
				for client := range h.clients {
					select {
					case client.Send <- message.Payload:
					default:
						close(client.Send)
						delete(h.clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Register adds a client to the hub
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from the hub
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID string, msgType string, payload []byte) {
	h.broadcast <- &Message{
		UserID:  userID,
		Type:    msgType,
		Payload: payload,
	}
}

// Broadcast sends a message to all connected clients
func (h *Hub) Broadcast(msgType string, payload []byte) {
	h.broadcast <- &Message{
		UserID:  "",
		Type:    msgType,
		Payload: payload,
	}
}
