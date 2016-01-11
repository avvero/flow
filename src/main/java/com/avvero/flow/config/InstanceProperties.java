package com.avvero.flow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author fxdev-belyaev-ay
 */
@ConfigurationProperties("instance")
public class InstanceProperties {

    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}