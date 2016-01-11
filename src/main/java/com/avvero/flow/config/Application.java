package com.avvero.flow.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * @author avvero
 */
@Configuration
@ComponentScan(basePackages = "com.avvero.flow")
@EnableAutoConfiguration
@SpringBootApplication
@EnableConfigurationProperties({TcpNetServerProperties.class, InstanceProperties.class})
public class Application extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }

    public static void main(String args[]) throws Throwable {
        SpringApplication.run(Application.class, args);
    }
}