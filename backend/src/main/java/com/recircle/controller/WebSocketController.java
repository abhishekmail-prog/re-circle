package com.recircle.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/hello")
    @SendTo("/topic/greetings")
    public Map<String, String> greeting(Map<String, String> message) {
        Map<String, String> response = new HashMap<>();
        response.put("content", "Hello, " + message.get("name") + "!");
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    @MessageMapping("/ping")
    @SendTo("/topic/pong")
    public Map<String, String> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "pong");
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    // Send real-time updates to all connected clients
    public void sendToAll(String topic, String eventType, Object data) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", eventType);
        message.put("data", data);
        message.put("timestamp", LocalDateTime.now().toString());
        messagingTemplate.convertAndSend("/topic/" + topic, message);
    }

    public void notifyLotCreated(Object lotData) {
        sendToAll("lots", "LOT_CREATED", lotData);
    }

    public void notifyRecyclerSelected(Object lotData) {
        sendToAll("lots", "RECYCLER_SELECTED", lotData);
    }

    public void notifyHandoverConfirmed(Object handoverData) {
        sendToAll("handovers", "HANDOVER_CONFIRMED", handoverData);
    }

    public void notifyPaymentUpdated(Object paymentData) {
        sendToAll("payments", "PAYMENT_UPDATED", paymentData);
    }

    public void notifyRecyclerVerified(Object recyclerData) {
        sendToAll("recyclers", "RECYCLER_VERIFIED", recyclerData);
    }
}
