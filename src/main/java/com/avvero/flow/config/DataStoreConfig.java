package com.avvero.flow.config;

import org.springframework.context.annotation.Configuration;

/**
 * @author Avvero
 */
@Configuration
@EnableMongoRepositories("com.avvero.flow.dao.mongo")
public class DataStoreConfig {
}
