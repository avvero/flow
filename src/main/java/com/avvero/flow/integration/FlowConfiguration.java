package com.avvero.flow.integration;

import ch.qos.logback.classic.spi.LoggingEventVO;
import com.avvero.flow.config.InstanceProperties;
import com.avvero.flow.config.TcpNetServerProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.serializer.DefaultDeserializer;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.channel.NullChannel;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.dsl.support.Function;
import org.springframework.integration.dsl.support.tuple.Tuple;
import org.springframework.integration.ip.tcp.TcpReceivingChannelAdapter;
import org.springframework.integration.ip.tcp.connection.TcpNetServerConnectionFactory;
import org.springframework.integration.support.MessageBuilder;
import org.springframework.integration.websocket.ServerWebSocketContainer;
import org.springframework.integration.websocket.inbound.WebSocketInboundChannelAdapter;
import org.springframework.integration.websocket.outbound.WebSocketOutboundMessageHandler;
import org.springframework.integration.websocket.support.SubProtocolHandlerRegistry;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.web.socket.messaging.*;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import static org.springframework.messaging.simp.SimpMessageHeaderAccessor.*;

/**
 * @author fxdev-belyaev-ay
 */
@Configuration
public class FlowConfiguration {

    public static final String MARKER_HEADER = "marker";
    public static final String ALL_MARKER_HEADER = "*";

    private static final Logger log = LoggerFactory.getLogger(FlowConfiguration.class);

    @Bean
    public ServerWebSocketContainer serverWebSocketContainer() {
        ServerWebSocketContainer container = new ServerWebSocketContainer("/messages/flow").withSockJs();
        container.setSendBufferSizeLimit(Integer.MAX_VALUE);
        container.setSendTimeLimit(10 * 1000);
        return container;
    }

    @Bean
    public SubProtocolHandler stompSubProtocolHandler() {
        StompSubProtocolHandler handler = new StompSubProtocolHandler();
        return handler;
    }

    @Bean
    public WebSocketInboundChannelAdapter webSocketInboundChannelAdapter() {
        WebSocketInboundChannelAdapter adapter = new WebSocketInboundChannelAdapter(serverWebSocketContainer(),
                new SubProtocolHandlerRegistry(stompSubProtocolHandler()));
        adapter.setOutputChannel(receiveMessage());
        return adapter;
    }

    @Bean
    public WebSocketOutboundMessageHandler webSocketOutboundMessageHandler() {
        WebSocketOutboundMessageHandler handler = new WebSocketOutboundMessageHandler(serverWebSocketContainer(),
                new SubProtocolHandlerRegistry(stompSubProtocolHandler()));
        return handler;
    }

    @Bean
    public Map<String, List<Tuple>> markerSessions() {
        return Collections.synchronizedMap(new HashMap<>());
    }

    @Bean
    public ApplicationListener sessionSubscribeEventListener() {
        return new ApplicationListener<SessionSubscribeEvent>() {
            @Override
            public void onApplicationEvent(SessionSubscribeEvent event) {
                String simpSessionId = (String) event.getMessage().getHeaders().get(SESSION_ID_HEADER);
                String simpSubscriptionId = (String) event.getMessage().getHeaders().get(SUBSCRIPTION_ID_HEADER);
                String marker = (String) event.getMessage().getHeaders().get(DESTINATION_HEADER);
                List sessions = markerSessions().get(marker);
                if (sessions == null) {
                    sessions = Collections.synchronizedList(new ArrayList<>());
                    markerSessions().put(marker, sessions);
                }
                sessions.add(new Tuple(simpSessionId, simpSubscriptionId, marker));
                log.info(String.format("Do subscribe session %s on %s", simpSessionId, simpSubscriptionId));
            }
        };
    }

    @Bean
    public ApplicationListener sessionUnsubscribeEventListener() {
        return new ApplicationListener<SessionUnsubscribeEvent>() {
            @Override
            public void onApplicationEvent(SessionUnsubscribeEvent event) {
                String simpSessionId = (String) event.getMessage().getHeaders().get(SESSION_ID_HEADER);
                String simpSubscriptionId = (String) event.getMessage().getHeaders().get(SUBSCRIPTION_ID_HEADER);
                String marker = (String) event.getMessage().getHeaders().get(DESTINATION_HEADER);
                markerSessions().get(marker).remove(new Tuple(simpSessionId, simpSubscriptionId, marker));
                log.info(String.format("Do unsubscribe session %s on %s", simpSessionId, simpSubscriptionId));
            }
        };
    }

    @Bean
    public ApplicationListener sessionDisconnectEventListener() {
        return new ApplicationListener<SessionDisconnectEvent>() {
            @Override
            public void onApplicationEvent(SessionDisconnectEvent event) {
                String simpSessionId = (String) event.getMessage().getHeaders().get(SESSION_ID_HEADER);
                for (List<Tuple> list : markerSessions().values()) {
                    Iterator<Tuple> iterator = list.iterator();
                    while (iterator.hasNext()) {
                        Tuple tuple = iterator.next();
                        if (simpSessionId.equals(tuple.get(0))) {
                            iterator.remove();
                        }
                    }
                }
                log.info(String.format("Do disconnect session %s", simpSessionId));
            }
        };
    }

    @Bean(name = "webSocketFlow.input")
    public MessageChannel sendMessage() {
        return new DirectChannel();
    }

    @Bean
    public MessageChannel receiveMessage() {
        return new NullChannel();
    }

    @Bean
    public IntegrationFlow webSocketFlow() {
        return f -> {
            Function<Message, Object> splitter = m ->
                    markerSessions()
                            .get(m.getHeaders().get(MARKER_HEADER))
                            .stream()
                            .filter(tuple -> serverWebSocketContainer().getSessions().containsKey(tuple.get(0)))
                            .map(s -> MessageBuilder.fromMessage(m)
                                    .copyHeaders(m.getHeaders())
                                    .setHeader(SESSION_ID_HEADER, s.get(0))
                                    .setHeader(SUBSCRIPTION_ID_HEADER, s.get(1))
                                    .build())
                            .collect(Collectors.toList());
            f.split(Message.class, splitter)
                    .channel(c -> c.executor(Executors.newCachedThreadPool()))
                    .handle(webSocketOutboundMessageHandler());
        };
    }
//
    /**
     * TCP
     *
     * @return
     */

    @Autowired
    public TcpNetServerProperties tcpNetServerProperties;

    @Autowired
    public InstanceProperties instanceProperties;

    @Bean
    public TcpNetServerConnectionFactory cf() {
        TcpNetServerConnectionFactory factory = new TcpNetServerConnectionFactory(tcpNetServerProperties.getPort());
        factory.setDeserializer(new DefaultDeserializer());
        return factory;
    }

    @Bean
    public TcpReceivingChannelAdapter adapter() {
        TcpReceivingChannelAdapter adapter = new TcpReceivingChannelAdapter();
        adapter.setConnectionFactory(cf());
        adapter.setOutputChannel(tcpChannel());
        return adapter;
    }

    @Bean
    public MessageChannel tcpChannel() {
        return new DirectChannel();
    }

    @ServiceActivator(inputChannel = "tcpChannel")
    public void sendLog(LoggingEventVO event) throws IOException, ClassNotFoundException {
        String marker = event.getMarker() != null ? event.getMarker().getName() : ALL_MARKER_HEADER;
        //TODO ??????????
        Map<String, List<Tuple>> map = markerSessions();
        synchronized (map) {
            if (!map.containsKey(marker)) {
                map.put(marker, Collections.synchronizedList(new ArrayList<>()));
            }
        }
        sendMessage().send(MessageBuilder
                .withPayload(event)
                .setHeader(MARKER_HEADER, marker)
                .build());
    }
}