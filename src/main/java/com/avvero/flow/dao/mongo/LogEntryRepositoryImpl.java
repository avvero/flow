package com.avvero.flow.dao.mongo;

import com.avvero.flow.domain.LogEntry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * @author Avvero
 */
public class LogEntryRepositoryImpl implements LogEntryRepositoryExt {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public void save(String collection, LogEntry doc) {
        mongoTemplate.insert(doc, collection);
    }
}
