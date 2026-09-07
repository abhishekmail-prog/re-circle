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

    public void sendToAll(String topic, String eventType, Object data) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", eventType);
        message.put("data", data);
        message.put("timestamp", LocalDateTime.now().toString());
        messagingTemplate.convertAndSend("/topic/" + topic, message);
    }

    // ========== LOT EVENTS ==========
    public void notifyLotCreated(Object lotData) {
        sendToAll("lots", "LOT_CREATED", lotData);
        sendToAll("admin", "NEW_LOT", lotData);
        sendToAll("recycler", "NEW_LOT", lotData);
    }

    public void notifyLotMatched(Object lotData) {
        sendToAll("lots", "LOT_MATCHED", lotData);
    }

    // ========== RECYCLER EVENTS ==========
    public void notifyRecyclerVerified(Object recyclerData) {
        sendToAll("recyclers", "RECYCLER_VERIFIED", recyclerData);
        sendToAll("admin", "RECYCLER_VERIFIED", recyclerData);
    }

    public void notifyRecyclerAdded(Object recyclerData) {
        sendToAll("recyclers", "RECYCLER_ADDED", recyclerData);
        sendToAll("admin", "RECYCLER_ADDED", recyclerData);
    }

    // ========== HANDOVER EVENTS ==========
    public void notifyHandoverConfirmed(Object handoverData) {
        sendToAll("handovers", "HANDOVER_CONFIRMED", handoverData);
        sendToAll("admin", "HANDOVER_CONFIRMED", handoverData);
        sendToAll("collector", "HANDOVER_CONFIRMED", handoverData);
    }

    // ========== PAYMENT EVENTS ==========
    public void notifyPaymentUpdated(Object paymentData) {
        sendToAll("payments", "PAYMENT_UPDATED", paymentData);
        sendToAll("admin", "PAYMENT_UPDATED", paymentData);
        sendToAll("collector", "PAYMENT_UPDATED", paymentData);
    }

    // ========== EARNINGS EVENTS ==========
    public void notifyEarningsUpdated(Object earningsData) {
        sendToAll("earnings", "EARNINGS_UPDATED", earningsData);
        sendToAll("admin", "EARNINGS_UPDATED", earningsData);
    }

    // ========== STATS EVENTS ==========
    public void notifyStatsUpdated(Object statsData) {
        sendToAll("stats", "STATS_UPDATED", statsData);
    }

    @MessageMapping("/ping")
    @SendTo("/topic/pong")
    public Map<String, String> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "pong");
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
}
