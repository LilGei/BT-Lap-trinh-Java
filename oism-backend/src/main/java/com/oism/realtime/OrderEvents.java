package com.oism.realtime;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;
import java.util.UUID;

@Component
public class OrderEvents {
    private final SimpMessagingTemplate messaging;
    public OrderEvents(SimpMessagingTemplate messaging) { this.messaging = messaging; }

    public void publishAfterCommit(UUID tenantId, String event, Map<String, ?> payload) {
        Runnable send = () -> messaging.convertAndSend("/topic/tenants/" + tenantId + "/orders", Map.of("event", event, "data", payload));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { send.run(); }
            });
        } else send.run();
    }
}
