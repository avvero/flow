package com.avvero.flow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * @author Avvero
 */
@Configuration
@EnableMongoRepositories("com.avvero.flow.dao.mongo")
public class DataStoreConfig {
}
