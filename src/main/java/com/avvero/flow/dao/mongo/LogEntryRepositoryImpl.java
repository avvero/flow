package com.avvero.flow.dao.mongo;

import com.avvero.flow.domain.LogEntry;
import com.avvero.flow.integration.Wave;
import com.avvero.flow.utils.JSONUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
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
        mongoTemplate.insert(JSONUtils.toString(doc), collection);
    }

    @Override
    public List<String> find(Wave wave) {
        Query query = new Query();
        query.with(new Sort(Sort.Direction.ASC, "nanoTime"));
        if (wave.getLevels() != null && !wave.getLevels().isEmpty()) {
            query.addCriteria(Criteria.where("event.level.levelStr").in(wave.getLevels().toArray()));
        }
        query.limit(100);
        return mongoTemplate.find(query, String.class, wave.getMarker());
    }
}
