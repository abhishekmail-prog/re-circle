package com.recircle.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
public class WebSocketController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/status")
    @SendTo("/topic/updates")
    public Map<String, Object> sendStatusUpdate(Map<String, Object> update) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "STATUS_UPDATE");
        response.put("data", update);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    @MessageMapping("/handover")
    @SendTo("/topic/handovers")
    public Map<String, Object> sendHandoverUpdate(Map<String, Object> update) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "HANDOVER_CONFIRMED");
        response.put("data", update);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
    
    public void notifyHandover(String lotId, String status) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("lotId", lotId);
        notification.put("status", status);
        notification.put("message", "Handover status updated to: " + status);
        notification.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/handovers", notification);
    }
}
