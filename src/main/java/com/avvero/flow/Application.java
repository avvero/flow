package com.avvero.flow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.core.serializer.DefaultDeserializer;
import org.springframework.core.serializer.DefaultSerializer;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.dsl.support.Function;
import org.springframework.integration.ip.tcp.TcpReceivingChannelAdapter;
import org.springframework.integration.ip.tcp.connection.TcpNetServerConnectionFactory;
import org.springframework.integration.websocket.ServerWebSocketContainer;
import org.springframework.integration.websocket.outbound.WebSocketOutboundMessageHandler;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * @author avvero
 */
@Configuration
@ComponentScan
@EnableAutoConfiguration
@RestController
public class Application {

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
        return new ServerWebSocketContainer("/flow").withSockJs();
    }

    @Bean
    MessageHandler webSocketOutboundAdapter() {
        return new WebSocketOutboundMessageHandler(serverWebSocketContainer());
    }

    @Bean(name = "webSocketFlow.input")
    MessageChannel requestChannel() {
        return new DirectChannel();
    }

    @Bean
    IntegrationFlow webSocketFlow() {
        return f -> {
            Function<Message , Object> splitter = m -> serverWebSocketContainer()
                    .getSessions()
                    .keySet()
                    .stream()
                    .map(s -> MessageBuilder.fromMessage(m)
                            .setHeader(SimpMessageHeaderAccessor.SESSION_ID_HEADER, s)
                            .build())
                    .collect(Collectors.toList());
            f.split( Message.class, splitter)
                    .channel(c -> c.executor(Executors.newCachedThreadPool()))
                    .handle(webSocketOutboundAdapter());
        };
    }

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

//    @Bean
//    TcpInboundGateway tcpGate() {
//        TcpInboundGateway gateway = new TcpInboundGateway();
//        gateway.setConnectionFactory(cf());
//        gateway.setRequestChannel(tcpChannel());
//        return gateway;
//    }

    @Bean
    public MessageChannel tcpChannel() {
        return new DirectChannel();
    }

    @ServiceActivator(inputChannel = "tcpChannel")
    public void echo(Object object) throws IOException, ClassNotFoundException {
        requestChannel().send(MessageBuilder.withPayload(object).build());
    }

}