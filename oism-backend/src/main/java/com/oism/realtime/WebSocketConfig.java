package com.oism.realtime;

import com.oism.security.CurrentUser;
import com.oism.security.JwtTokenService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtTokenService tokens;
    public WebSocketConfig(JwtTokenService tokens) { this.tokens = tokens; }

    @Override public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*");
    }

    @Override public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authorization = accessor.getFirstNativeHeader("Authorization");
                    if (authorization == null || !authorization.startsWith("Bearer "))
                        throw new IllegalArgumentException("A bearer token is required for WebSocket connections");
                    CurrentUser user = tokens.parse(authorization.substring(7));
                    accessor.setUser(() -> user.userId().toString());
                    accessor.getSessionAttributes().put("tenantId", user.tenantId().toString());
                }
                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    Object tenant = accessor.getSessionAttributes() == null ? null : accessor.getSessionAttributes().get("tenantId");
                    String destination = accessor.getDestination();
                    if (tenant == null || destination == null || !destination.equals("/topic/tenants/" + tenant + "/orders"))
                        throw new IllegalArgumentException("Subscription is outside the authenticated tenant");
                }
                if (StompCommand.SEND.equals(accessor.getCommand()))
                    throw new IllegalArgumentException("Client messages are not accepted by this notification socket");
                return message;
            }
        });
    }
}
