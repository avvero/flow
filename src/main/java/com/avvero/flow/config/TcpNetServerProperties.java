package com.avvero.flow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("tcpNetServer")
public class TcpNetServerProperties {

    private int port;

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }
}