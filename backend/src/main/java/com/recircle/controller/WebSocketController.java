package com.recircle.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
public class WebSocketController {

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
}
