package com.avvero.flow;

import ch.qos.logback.classic.spi.LoggingEventVO;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.socket.messaging.*;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import static org.springframework.messaging.simp.SimpMessageHeaderAccessor.*;

/**
 * @author avvero
 */
@Configuration
@ComponentScan
@EnableAutoConfiguration
@RestController
public class Application {

    public static final String MARKER_HEADER = "marker";
    public static final String ALL_MARKER_HEADER = "*";

    public static int count;

    public static synchronized int incCount() {
        return ++count;
    };
    public static int succesed;

    public static synchronized int incSuccesed() {
        return ++succesed;
    };

    public static void main(String args[]) throws Throwable {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    ServerWebSocketContainer serverWebSocketContainer() {
        ServerWebSocketContainer container = new ServerWebSocketContainer("/messages/flow").withSockJs();
        container.setSendBufferSizeLimit(Integer.MAX_VALUE);
        container.setSendTimeLimit(10 * 1000);
        return container;
    }

    @Bean
    SubProtocolHandler stompSubProtocolHandler() {
        StompSubProtocolHandler handler = new StompSubProtocolHandler();
        return handler;
    }

    @Bean
    WebSocketInboundChannelAdapter webSocketInboundChannelAdapter() {
        WebSocketInboundChannelAdapter adapter = new WebSocketInboundChannelAdapter(serverWebSocketContainer(),
                new SubProtocolHandlerRegistry(stompSubProtocolHandler()));
        adapter.setOutputChannel(receiveMessage());
        return adapter;
    }

    @Bean
    WebSocketOutboundMessageHandler webSocketOutboundMessageHandler() {
        WebSocketOutboundMessageHandler handler = new WebSocketOutboundMessageHandler(serverWebSocketContainer(),
                new SubProtocolHandlerRegistry(stompSubProtocolHandler()));
        return handler;
    }

    @Bean
    Map<String, List<Tuple>> markerSessions() {
        return new ConcurrentHashMap<>();
    }

    @Bean
    ApplicationListener sessionSubscribeEventListener() {
        return new ApplicationListener<SessionSubscribeEvent>(){
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
            }
        };
    }

    @Bean
    ApplicationListener sessionUnsubscribeEventListener() {
        return new ApplicationListener<SessionUnsubscribeEvent>(){
            @Override
            public void onApplicationEvent(SessionUnsubscribeEvent event) {
                String simpSessionId = (String) event.getMessage().getHeaders().get(SESSION_ID_HEADER);
                String simpSubscriptionId = (String) event.getMessage().getHeaders().get(SUBSCRIPTION_ID_HEADER);
                String marker = (String) event.getMessage().getHeaders().get(DESTINATION_HEADER);
                markerSessions().get(marker).remove(new Tuple(simpSessionId, simpSubscriptionId, marker));
            }
        };
    }

    @Bean
    ApplicationListener sessionDisconnectEventListener() {
        return new ApplicationListener<SessionDisconnectEvent>(){
            @Override
            public void onApplicationEvent(SessionDisconnectEvent event) {
                String simpSessionId = (String) event.getMessage().getHeaders().get(SESSION_ID_HEADER);
                synchronized (markerSessions()) {
                    for(List<Tuple> list : markerSessions().values()) {
                        Iterator<Tuple> iterator = list.iterator();
                        while(iterator.hasNext()) {
                            Tuple tuple = iterator.next();
                            if (simpSessionId.equals(tuple.get(0))) {
                                iterator.remove();
                            }
                        }
                    }
                }
            }
        };
    }

    @Bean(name = "webSocketFlow.input")
    MessageChannel sendMessage() {
        return new DirectChannel();
    }

    @Bean
    MessageChannel receiveMessage() {
        return new NullChannel();
    }

    @Bean
    IntegrationFlow webSocketFlow() {
        return f -> {
            Function<Message , Object> splitter = m ->
                    markerSessions()
                            .get(m.getHeaders().get(MARKER_HEADER))
                            .stream()
                            .map(s -> MessageBuilder.fromMessage(m)
                                    .copyHeaders(m.getHeaders())
                                    .setHeader(SESSION_ID_HEADER, s.get(0))
                                    .setHeader(SUBSCRIPTION_ID_HEADER, s.get(1))
                                    .build())
                            .collect(Collectors.toList());
            f.split( Message.class, splitter)
                    .channel(c -> c.executor(Executors.newCachedThreadPool()))
                    .handle(webSocketOutboundMessageHandler());
        };
    }
//
    /***
     * TCP
     * @return
     */

    @Bean
    TcpNetServerConnectionFactory cf () {
        TcpNetServerConnectionFactory factory = new TcpNetServerConnectionFactory(4561);
        factory.setDeserializer(new DefaultDeserializerStub());
        return factory;
    }

    @Bean
    TcpReceivingChannelAdapter adapter() {
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
        //TODO переделать
        synchronized (markerSessions()) {
            if (!markerSessions().containsKey(marker)) {
                markerSessions().put(marker, Collections.synchronizedList(new ArrayList<>()));
            }
        }
        sendMessage().send(MessageBuilder
                .withPayload(event)
                .setHeader(MARKER_HEADER, marker)
                .build());
    }

    /**
     * MVC
     * @return
     */
    @RequestMapping(value = "/data/markers", method = RequestMethod.GET)
    public Set getRegisteredMarkers() {
        return markerSessions().keySet();
    }

}