package hello;

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
 * @author Artem Bilan
 * @author Josh Long
 */
@Configuration
@ComponentScan
@EnableAutoConfiguration
@RestController
public class Application {

    int i;

    public static void main(String args[]) throws Throwable {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    ServerWebSocketContainer serverWebSocketContainer() {
        return new ServerWebSocketContainer("/messages").withSockJs();
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

    @RequestMapping("/hi/{name}")
    public void send(@PathVariable String name) throws InterruptedException {
        requestChannel().send(MessageBuilder.withPayload(name).build());
    }

    @Bean
    TcpNetServerConnectionFactory cf () {
        TcpNetServerConnectionFactory factory = new TcpNetServerConnectionFactory(4561);
        factory.setDeserializer(new DefaultDeserializer());
        factory.setSerializer(new DefaultSerializer());
        factory.setSingleUse(false);
//        factory.setSoTimeout(0);
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
        System.out.println(++i + " -tcp- "+ object.toString());
        requestChannel().send(MessageBuilder.withPayload(object).build());
    }

}