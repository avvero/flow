package com.avvero.flow.dao.mongo;

import com.avvero.flow.domain.LogEntry;
import com.google.gson.Gson;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;

/**
 * @author Avvero
 */
public class LogEntryRepositoryImpl implements LogEntryRepositoryExt {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public void save(String collection, LogEntry doc) {
        mongoTemplate.insert(new Gson().toJson(doc), collection);
    }

    @Override
    public List<String> find(String marker) {
        Query query = new Query();
        return mongoTemplate.find(query, String.class, marker);
    }
}
